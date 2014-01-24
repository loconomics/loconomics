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
//require('LC/jquery.xtsh');
require('jquery-ui');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    educationSelector = '.DashboardEducation',
    $others = $c.find(educationSelector).closest('.DashboardSection-page-section').siblings();

  var crudl = initCrudl(educationSelector);
  //crudl.settings.effects['show-viewer'] = { effect: 'height', duration: 'slow' };

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
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
    $others = $licenses.siblings().add($licenses.find('.DashboardSection-page-section-introduction'));

  var crudl = initCrudl(licensesSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
  });
};

},{}],20:[function(require,module,exports){
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
    $others = $locations.siblings().add($locations.find('.DashboardSection-page-section-introduction'));

  var crudl = initCrudl(locationsSelector);

  var locationMap;

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    //Force execution of the 'has-confirm' script
    $editor.find('fieldset.has-confirm > .confirm input').change();

    locationMap = setupGeopositioning($editor);
  })
  .on(crudl.settings.events['editor-showed'], function (e, $editor) {
    if (locationMap)
      mapReady.refreshMap(locationMap);
  });
};

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
},{}],21:[function(require,module,exports){
/** UI logic to manage provider photos (your-work/photos).
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
    popup(LcUrl.LangPath + 'NewDashboard/YourWork/UploadPhoto/?PositionID=' + posID, 'small');
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
      $(this).closest(sectionSelector).find('[name=gallery-order]').val(order);
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
      smoothBoxBlock.open(form.find('.no-photos'), editPanel);
    } else {
      smoothBoxBlock.open(form.find('.no-primary-photo'), editPanel);
    }
    // Reset hidden fields manually to avoid browser memory breaking things
    editPanel.find('[name=PhotoID]').val('');
    editPanel.find('[name=photo-caption]').val('');
    editPanel.find('[name=is-primary-photo]').prop('checked', false);
  }
  // Reset delete option
  editPanel.find('[name=delete-photo]').val('False');

}

},{}],22:[function(require,module,exports){
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

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    pricingSelector = '.DashboardPricing',
    $pricing = $c.find(pricingSelector).closest('.DashboardSection-page-section'),
    $others = $pricing.siblings().add($pricing.find('.DashboardSection-page-section-introduction'));

  var crudl = initCrudl(pricingSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ready'], function (e, $editor) {

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
    if (!f.is('form')) {
      if (console && console.error) console.error('The element to apply validation must be a form');
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

  /* Your work / pricing */
  require('./dashboard/pricingCrudl').on('.DashboardYourWork');

  /* Your work / locations */
  require('./dashboard/locationsCrudl').on('.DashboardYourWork');

  /* Your work / licenses */
  require('./dashboard/licensesCrudl').on('.DashboardYourWork');

  /* Your work / photos */
  require('./dashboard/managePhotosUI').on('.DashboardYourWork');
});
},{"../LC/ProviderPosition":2,"../LC/toggle":14,"./dashboard/changeProfilePhoto":16,"./dashboard/educationCrudl":17,"./dashboard/generateBookNowButton":18,"./dashboard/licensesCrudl":19,"./dashboard/locationsCrudl":20,"./dashboard/managePhotosUI":21,"./dashboard/paymentAccount":22,"./dashboard/pricingCrudl":23,"./dashboard/privacySettings":24,"./dashboard/serviceAttributesValidation":25,"./dashboard/verificationsActions":26}]},{},[27])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1Byb3ZpZGVyUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheENhbGxiYWNrcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcmVhdGVJZnJhbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zbW9vdGhCb3hCbG9jay5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy90b2dnbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9uZXctZGFzaGJvYXJkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qKiBQcm92aWRlclBvc2l0aW9uIGNsYXNzXHJcbiAgSXQgcHJvdmlkZXMgbWluaW11biBsaWtlLWpxdWVyeSBldmVudCBsaXN0ZW5lcnNcclxuICB3aXRoIG1ldGhvZHMgJ29uJyBhbmQgJ29mZicsIGFuZCBpbnRlcm5hbGx5ICd0aGlzLmV2ZW50cydcclxuICBiZWluZyBhIGpRdWVyeS5DYWxsYmFja3MuXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKTtcclxuXHJcbi8qKiBDb25zdHJ1Y3RvclxyXG4qKi9cclxudmFyIFByb3ZpZGVyUG9zaXRpb24gPSBmdW5jdGlvbiAocG9zaXRpb25JZCkge1xyXG4gIHRoaXMucG9zaXRpb25JZCA9IHBvc2l0aW9uSWQ7XHJcblxyXG4gIC8vIEV2ZW50cyBzdXBwb3J0IHRocm91Z2gganF1ZXJ5LkNhbGxiYWNrXHJcbiAgdGhpcy5ldmVudHMgPSAkLkNhbGxiYWNrcygpO1xyXG4gIHRoaXMub24gPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLmFkZC5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG4gIHRoaXMub2ZmID0gZnVuY3Rpb24gKCkgeyB0aGlzLmV2ZW50cy5yZW1vdmUuYXBwbHkodGhpcy5ldmVudHMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpOyByZXR1cm4gdGhpczsgfTtcclxufTtcclxuXHJcbi8vIFVzaW5nIGRlZmF1bHQgY29uZmlndXJhdGlvbiBhcyBwcm90b3R5cGVcclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUgPSB7XHJcbiAgZGVjbGluZWRNZXNzYWdlQ2xhc3M6ICdpbmZvJyxcclxuICBkZWNsaW5lZFBvcHVwQ2xhc3M6ICdwb3NpdGlvbi1zdGF0ZS1jaGFuZ2UnLFxyXG4gIHN0YXRlQ2hhbmdlZEV2ZW50OiAnc3RhdGUtY2hhbmdlZCcsXHJcbiAgc3RhdGVDaGFuZ2VkRGVjbGluZWRFdmVudDogJ3N0YXRlLWNoYW5nZWQtZGVjbGluZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJChkb2N1bWVudCk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciBjdHggPSB7IGZvcm06ICRkLCBib3g6ICRkIH07XHJcbiAgJC5hamF4KHtcclxuICAgIHVybDogTGNVcmwuTGFuZ1BhdGggKyAnTmV3RGFzaGJvYXJkL1Bvc2l0aW9uLycgKyBwYWdlICsgJy8/UG9zaXRpb25JRD0nICsgdGhpcy5wb3NpdGlvbklkLFxyXG4gICAgY29udGV4dDogY3R4LFxyXG4gICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgJGQub25lKCdhamF4U3VjY2Vzc1Bvc3QnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEsIHQsIGosIGN0eCkge1xyXG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSAxMDEpIHtcclxuICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZShzdGF0ZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBTaG93IG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcyh0aGF0LmRlY2xpbmVkTWVzc2FnZUNsYXNzKS5hcHBlbmQoZGF0YS5SZXN1bHQuTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obXNnLCBwb3MsIHRoYXQuZGVjbGluZWRQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIC8vIFByb2Nlc3MgdGhlIHJlc3VsdCwgdGhhdCBldmVudHVhbGx5IHdpbGwgY2FsbCBhamF4U3VjY2Vzc1Bvc3RcclxuICAgICAgYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247IiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAvLyB0aGUgZWxlbWVudCBpbiB0aGUgbmV3aHRtbDpcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgaWYgKGpiLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKCFqYiB8fCBqYi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gYWpheC1ib3gsIHVzZSBhbGwgZWxlbWVudCByZXR1cm5lZDpcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgIC8vIG9yIGFsbCBpZiB0aGVyZSBpcyBubyBhamF4LWJveCBpbiB0aGUgcmVzdWx0LlxyXG4gICAgICAgICAgY3R4LmJveC5lbXB0eSgpLmFwcGVuZChqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICAgICAgLy8gbGluayBlbGVtZW50cyBmcm9tIGVscyB0byBjbGVhbi11cCBpdHMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBlbHMgPSBwcmV2RWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkgeyAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59IiwiLyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgNTAwLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogUG9wdXAgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKlxyXG4qIFBvcHVwIHJlbGF0ZWQgXHJcbiogZnVuY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHBvcHVwU2l6ZShzaXplKSB7XHJcbiAgICB2YXIgcyA9IChzaXplID09ICdsYXJnZScgPyAwLjggOiAoc2l6ZSA9PSAnbWVkaXVtJyA/IDAuNSA6IChzaXplID09ICdzbWFsbCcgPyAwLjIgOiBzaXplIHx8IDAuNSkpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoJCh3aW5kb3cpLndpZHRoKCkgKiBzKSxcclxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoJCh3aW5kb3cpLmhlaWdodCgpICogcyksXHJcbiAgICAgICAgc2l6ZUZhY3Rvcjogc1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cFN0eWxlKHNpemUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgd2lkdGg6IHNpemUud2lkdGggKyAncHgnLFxyXG4gICAgICAgIGxlZnQ6IE1hdGgucm91bmQoKCQod2luZG93KS53aWR0aCgpIC0gc2l6ZS53aWR0aCkgLyAyKSAtIDI1ICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB0b3A6IE1hdGgucm91bmQoKCQod2luZG93KS5oZWlnaHQoKSAtIHNpemUuaGVpZ2h0KSAvIDIpIC0gMzIgKyAncHgnLFxyXG4gICAgICAgIHBhZGRpbmc6ICczNHB4IDI1cHggMzBweCcsXHJcbiAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAnLW1vei1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZycsXHJcbiAgICAgICAgJy13ZWJraXQtYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94JyxcclxuICAgICAgICAnYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94J1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cCh1cmwsIHNpemUsIGNvbXBsZXRlLCBsb2FkaW5nVGV4dCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiAodXJsKSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgb3B0aW9ucyA9IHVybDtcclxuXHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgdXJsOiB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJycsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfSxcclxuICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXHJcbiAgICAgICAgbG9hZGluZ1RleHQ6IGxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNsb3NhYmxlOiB7XHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFmdGVyTG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgb25FcnJvcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b1NpemU6IGZhbHNlLFxyXG4gICAgICAgIGNvbnRhaW5lckNsYXNzOiAnJyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWVcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc2l6ZSBhbmQgbG9hZGluZ1xyXG4gICAgb3B0aW9ucy5sb2FkaW5nVGV4dCA9IG9wdGlvbnMubG9hZGluZ1RleHQgfHwgJyc7XHJcbiAgICBpZiAodHlwZW9mIChvcHRpb25zLnNpemUud2lkdGgpID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICBvcHRpb25zLnNpemUgPSBwb3B1cFNpemUob3B0aW9ucy5zaXplKTtcclxuXHJcbiAgICAkLmJsb2NrVUkoe1xyXG4gICAgICAgIG1lc3NhZ2U6IChvcHRpb25zLmNsb3NhYmxlLm9uTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArXHJcbiAgICAgICAnPGltZyBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyArIG9wdGlvbnMubG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2VudGVyWTogZmFsc2UsXHJcbiAgICAgICAgY3NzOiBwb3B1cFN0eWxlKG9wdGlvbnMuc2l6ZSksXHJcbiAgICAgICAgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9LFxyXG4gICAgICAgIGZvY3VzSW5wdXQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcgVXJsIHdpdGggQWpheCBhbmQgcGxhY2UgY29udGVudCBpbnNpZGUgdGhlIGJsb2NrZWQtYm94XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogb3B0aW9ucy51cmwsXHJcbiAgICAgICAgY29udGV4dDoge1xyXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICBjb250YWluZXI6ICQoJy5ibG9ja01zZycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIuYWRkQ2xhc3Mob3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgcmVxdWlyZXMgaXQgb3IgZW1wdHkgbWVzc2FnZSBjb250ZW50IHRvIGFwcGVuZCB0aGVuIG1vcmVcclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwob3B0aW9ucy5jbG9zYWJsZS5hZnRlckxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJyk7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50SG9sZGVyID0gY29udGFpbmVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbnRlbnRcIi8+JykuY2hpbGRyZW4oJy5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUgJiYgZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGNvZGUsIHNob3cgcmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFnZSBjb250ZW50IGdvdCwgcGFzdGUgaW50byB0aGUgcG9wdXAgaWYgaXMgcGFydGlhbCBodG1sICh1cmwgc3RhcnRzIHdpdGggJClcclxuICAgICAgICAgICAgICAgIGlmICgvKCheXFwkKXwoXFwvXFwkKSkvLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50SG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBtaXNjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2SGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zdHlsZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsSGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zY3JvbGxIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250V2lkdGggPSBjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVdpZHRoID0gY29udGFpbmVyLm91dGVyV2lkdGgodHJ1ZSkgLSBjb250V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUhlaWdodCA9IGNvbnRhaW5lci5vdXRlckhlaWdodCh0cnVlKSAtIGNvbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9ICQod2luZG93KS53aWR0aCgpIC0gZXh0cmFXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIGV4dHJhSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCA6IGFjdHVhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHQgPiBtYXhIZWlnaHQgPyBtYXhIZWlnaHQgOiBhY3R1YWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFuaW1hdGUoc2l6ZSwgMzAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlzY2FsY3VsYXRpb25zIGNvcnJlY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsIHByZXZXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCBwcmV2SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIGlmIHVybCBpcyBhIGZ1bGwgaHRtbCBwYWdlIChub3JtYWwgcGFnZSksIHB1dCBjb250ZW50IGludG8gYW4gaWZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShkYXRhLCB0aGlzLm9wdGlvbnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGJsb2NraW5nIGVsZW1lbnQgY29udGVudCAodGhlIGxvYWRpbmcpIHdpdGggdGhlIGlmcmFtZTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGVycm9yOiBmdW5jdGlvbiAoaiwgdCwgZXgpIHtcclxuICAgICAgICAgICAgJCgnZGl2LmJsb2NrTXNnJykuaHRtbCgob3B0aW9ucy5jbG9zYWJsZS5vbkVycm9yID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICsgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+UGFnZSBub3QgZm91bmQ8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5pbmZvKSBjb25zb2xlLmluZm8oXCJQb3B1cC1hamF4IGVycm9yOiBcIiArIGV4KTtcclxuICAgICAgICB9LCBjb21wbGV0ZTogb3B0aW9ucy5jb21wbGV0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJldHVybmVkQmxvY2sgPSAkKCcuYmxvY2tVSScpO1xyXG5cclxuICAgIHJldHVybmVkQmxvY2sub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgcmV0dXJuZWRCbG9jay50cmlnZ2VyKCdwb3B1cC1jbG9zZWQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybmVkQmxvY2suY2xvc2VQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWRCbG9jaztcclxufVxyXG5cclxuLyogU29tZSBwb3B1cCB1dGlsaXRpdGVzL3Nob3J0aGFuZHMgKi9cclxuZnVuY3Rpb24gbWVzc2FnZVBvcHVwKG1lc3NhZ2UsIGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgJ2JvZHknKTtcclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdi8+JykudGV4dChtZXNzYWdlKTtcclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY29udGFpbmVyLCAnbWVzc2FnZS1wb3B1cCBmdWxsLWJsb2NrJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0UG9wdXBBY3Rpb24oYXBwbHlUb1NlbGVjdG9yKSB7XHJcbiAgICBhcHBseVRvU2VsZWN0b3IgPSBhcHBseVRvU2VsZWN0b3IgfHwgJy5wb3B1cC1hY3Rpb24nO1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgYXBwbHlUb1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKCQodGhpcykuYXR0cignaHJlZicpKS5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIGRvY3VtZW50LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFRoZSBwb3B1cCBmdW5jdGlvbiBjb250YWlucyBhbGwgdGhlIG90aGVycyBhcyBtZXRob2RzXHJcbnBvcHVwLnNpemUgPSBwb3B1cFNpemU7XHJcbnBvcHVwLnN0eWxlID0gcG9wdXBTdHlsZTtcclxucG9wdXAuY29ubmVjdEFjdGlvbiA9IGNvbm5lY3RQb3B1cEFjdGlvbjtcclxucG9wdXAubWVzc2FnZSA9IG1lc3NhZ2VQb3B1cDtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBvcHVwOyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgLy8gSGlkaW5nIGJveDpcclxuICAgIGlmIChjb250ZW50Qm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGJveGM7XHJcbiAgICBpZiAoYm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveGMgPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1lbGVtZW50XCIvPicpO1xyXG4gICAgICAgIGJveCA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLW92ZXJsYXlcIj48L2Rpdj4nKTtcclxuICAgICAgICBib3guYWRkQ2xhc3MoYWRkY2xhc3MpO1xyXG4gICAgICAgIGlmIChmdWxsKSBib3guYWRkQ2xhc3MoJ2Z1bGwtYmxvY2snKTtcclxuICAgICAgICBib3guYXBwZW5kKGJveGMpO1xyXG4gICAgICAgIGJveC5hdHRyKCdpZCcsIGJJRCk7XHJcbiAgICAgICAgaWYgKGJveEluc2lkZUJsb2NrZWQpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuYXBwZW5kKGJveCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKGJveCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJveGMgPSBib3guY2hpbGRyZW4oJy5zbW9vdGgtYm94LWJsb2NrLWVsZW1lbnQnKTtcclxuICAgIH1cclxuICAgIC8vIEhpZGRlbiBmb3IgdXNlciwgYnV0IGF2YWlsYWJsZSB0byBjb21wdXRlOlxyXG4gICAgY29udGVudEJveC5zaG93KCk7XHJcbiAgICBib3guc2hvdygpLmNzcygnb3BhY2l0eScsIDApO1xyXG4gICAgLy8gU2V0dGluZyB1cCB0aGUgYm94IGFuZCBzdHlsZXMuXHJcbiAgICBib3hjLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICBpZiAob3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICBib3hjLmFwcGVuZCgkKCc8YSBjbGFzcz1cImNsb3NlLXBvcHVwIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicpKTtcclxuICAgIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycsIG9wdGlvbnMpO1xyXG4gICAgaWYgKCFib3hjLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnKSlcclxuICAgICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKCkgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJylcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIi8qKlxyXG4gIEl0IHRvZ2dsZXMgYSBnaXZlbiB2YWx1ZSB3aXRoIHRoZSBuZXh0IGluIHRoZSBnaXZlbiBsaXN0LFxyXG4gIG9yIHRoZSBmaXJzdCBpZiBpcyB0aGUgbGFzdCBvciBub3QgbWF0Y2hlZC5cclxuICBUaGUgcmV0dXJuZWQgZnVuY3Rpb24gY2FuIGJlIHVzZWQgZGlyZWN0bHkgb3IgXHJcbiAgY2FuIGJlIGF0dGFjaGVkIHRvIGFuIGFycmF5IChvciBhcnJheSBsaWtlKSBvYmplY3QgYXMgbWV0aG9kXHJcbiAgKG9yIHRvIGEgcHJvdG90eXBlIGFzIEFycmF5LnByb3RvdHlwZSkgYW5kIHVzZSBpdCBwYXNzaW5nXHJcbiAgb25seSB0aGUgZmlyc3QgYXJndW1lbnQuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvZ2dsZShjdXJyZW50LCBlbGVtZW50cykge1xyXG4gIGlmICh0eXBlb2YgKGVsZW1lbnRzKSA9PT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgdHlwZW9mICh0aGlzLmxlbmd0aCkgPT09ICdudW1iZXInKVxyXG4gICAgZWxlbWVudHMgPSB0aGlzO1xyXG5cclxuICB2YXIgaSA9IGVsZW1lbnRzLmluZGV4T2YoY3VycmVudCk7XHJcbiAgaWYgKGkgPiAtMSAmJiBpIDwgZWxlbWVudHMubGVuZ3RoIC0gMSlcclxuICAgIHJldHVybiBlbGVtZW50c1tpICsgMV07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdO1xyXG59O1xyXG4iLCIvKiogVmFsaWRhdGlvbiBsb2dpYyB3aXRoIGxvYWQgYW5kIHNldHVwIG9mIHZhbGlkYXRvcnMgYW5kIFxyXG4gICAgdmFsaWRhdGlvbiByZWxhdGVkIHV0aWxpdGllc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuLy8gVXNpbmcgb24gc2V0dXAgYXN5bmNyb25vdXMgbG9hZCBpbnN0ZWFkIG9mIHRoaXMgc3RhdGljLWxpbmtlZCBsb2FkXHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzJyk7XHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cFZhbGlkYXRpb24ocmVhcHBseU9ubHlUbykge1xyXG4gICAgcmVhcHBseU9ubHlUbyA9IHJlYXBwbHlPbmx5VG8gfHwgZG9jdW1lbnQ7XHJcbiAgICBpZiAoIXdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWYgKCFqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB7XHJcbiAgICAgICAganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoW1xyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qc1wiIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENoZWNrIGZpcnN0IGlmIHZhbGlkYXRpb24gaXMgZW5hYmxlZCAoY2FuIGhhcHBlbiB0aGF0IHR3aWNlIGluY2x1ZGVzIG9mXHJcbiAgICAgICAgLy8gdGhpcyBjb2RlIGhhcHBlbiBhdCBzYW1lIHBhZ2UsIGJlaW5nIGV4ZWN1dGVkIHRoaXMgY29kZSBhZnRlciBmaXJzdCBhcHBlYXJhbmNlXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgc3dpdGNoIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgY2hhbmdlZFxyXG4gICAgICAgIC8vIGJ1dCB3aXRob3V0IHZhbGlkYXRpb24gYmVpbmcgYWxyZWFkeSBsb2FkZWQgYW5kIGVuYWJsZWQpXHJcbiAgICAgICAgaWYgKCQgJiYgJC52YWxpZGF0b3IgJiYgJC52YWxpZGF0b3IudW5vYnRydXNpdmUpIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgdGhlIHZhbGlkYXRpb24gcnVsZXMgdG8gdGhlIG5ldyBlbGVtZW50c1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3ZhbGlkYXRvcicpO1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgICAgICAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZS5wYXJzZShyZWFwcGx5T25seVRvKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdGllcyAqL1xyXG5cclxuLyogQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnMgb2YgdGhlIHZhbGlkYXRpb24gc3VtbWFyeVxyXG5pbmNsdWRlZCBpbiAnY29udGFpbmVyJyBhbmQgc2V0IGFzIHZhbGlkIHRoZSBzdW1tYXJ5XHJcbiovXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICAgICQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgIC5maW5kKCc+dWw+bGknKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBTZXQgYWxsIGZpZWxkcyB2YWxpZGF0aW9uIGluc2lkZSB0aGlzIGZvcm0gKGFmZmVjdGVkIGJ5IHRoZSBzdW1tYXJ5IHRvbylcclxuICAgIC8vIGFzIHZhbGlkIHRvb1xyXG4gICAgJCgnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgIC50ZXh0KCcnKTtcclxuXHJcbiAgICAvLyBSZS1hcHBseSBzZXR1cCB2YWxpZGF0aW9uIHRvIGVuc3VyZSBpcyB3b3JraW5nLCBiZWNhdXNlIGp1c3QgYWZ0ZXIgYSBzdWNjZXNzZnVsXHJcbiAgICAvLyB2YWxpZGF0aW9uLCBhc3AubmV0IHVub2J0cnVzaXZlIHZhbGlkYXRpb24gc3RvcHMgd29ya2luZyBvbiBjbGllbnQtc2lkZS5cclxuICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyKSB7XHJcbiAgdmFyIHYgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKTtcclxuICB2LmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnb1RvU3VtbWFyeUVycm9ycyhmb3JtKSB7XHJcbiAgICB2YXIgb2ZmID0gZm9ybS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLm9mZnNldCgpO1xyXG4gICAgaWYgKG9mZilcclxuICAgICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZi50b3AgfSwgNTAwKTtcclxuICAgIGVsc2VcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdnb1RvU3VtbWFyeUVycm9yczogbm8gc3VtbWFyeSB0byBmb2N1cycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gIHJldHVybiAkKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNldHVwOiBzZXR1cFZhbGlkYXRpb24sXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCxcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcjogc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yLFxyXG4gICAgZ29Ub1N1bW1hcnlFcnJvcnM6IGdvVG9TdW1tYXJ5RXJyb3JzLFxyXG4gICAgZmluZFZhbGlkYXRpb25TdW1tYXJ5OiBmaW5kVmFsaWRhdGlvblN1bW1hcnlcclxufTsiLCIvKiogY2hhbmdlUHJvZmlsZVBob3RvLCBpdCB1c2VzICd1cGxvYWRlcicgdXNpbmcgaHRtbDUsIGFqYXggYW5kIGEgc3BlY2lmaWMgcGFnZVxyXG4gIHRvIG1hbmFnZSBzZXJ2ZXItc2lkZSB1cGxvYWQgb2YgYSBuZXcgdXNlciBwcm9maWxlIHBob3RvLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuLy8gVE9ETzogcmVpbXBsZW1lbnQgdGhpcyBhbmQgdGhlIHNlcnZlci1zaWRlIGZpbGUgdG8gYXZvaWQgaWZyYW1lcyBhbmQgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyxcclxuLy8gZGlyZWN0IEFQSSB1c2Ugd2l0aG91dCBpZnJhbWUtbm9ybWFsIHBvc3Qgc3VwcG9ydCAoY3VycmVudCBicm93c2VyIG1hdHJpeCBhbGxvdyB1cyB0aGlzPylcclxuLy8gVE9ETzogaW1wbGVtZW50IGFzIHJlYWwgbW9kdWxhciwgbmV4dCBhcmUgdGhlIGtub3dlZCBtb2R1bGVzIGluIHVzZSBidXQgbm90IGxvYWRpbmcgdGhhdCBhcmUgZXhwZWN0ZWRcclxuLy8gdG8gYmUgaW4gc2NvcGUgcmlnaHQgbm93IGJ1dCBtdXN0IGJlIHVzZWQgd2l0aCB0aGUgbmV4dCBjb2RlIHVuY29tbWVudGVkLlxyXG4vLyByZXF1aXJlKCd1cGxvYWRlcicpO1xyXG4vLyByZXF1aXJlKCdMY1VybCcpO1xyXG4vLyB2YXIgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJylcclxuLy8gdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gICRjLm9uKCdjbGljaycsICdbaHJlZj1cIiNjaGFuZ2UtcHJvZmlsZS1waG90b1wiXScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ05ld0Rhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8nLCB7IHdpZHRoOiAyNDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOT1RFOiBXZSBhcmUgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyBmcm9tIGhlcmUgYmVjYXVzZSB0aGUgc2VydmVyIHBhZ2UvaWZyYW1lIGV4cGVjdHMgdGhpc1xyXG4gIC8vIHRvIHdvcmsuXHJcbiAgLy8gVE9ETzogcmVmYWN0b3IgdG8gYXZvaWQgdGhpcyB3YXkuXHJcbiAgd2luZG93LnJlbG9hZFVzZXJQaG90byA9IGZ1bmN0aW9uIHJlbG9hZFVzZXJQaG90bygpIHtcclxuICAgICRjLmZpbmQoJy5EYXNoYm9hcmRQdWJsaWNCaW8tcGhvdG8gLmF2YXRhcicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc3JjID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xyXG4gICAgICAvLyBhdm9pZCBjYWNoZSB0aGlzIHRpbWVcclxuICAgICAgc3JjID0gc3JjICsgXCI/dj1cIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgd2luZG93LmRlbGV0ZVVzZXJQaG90byA9IGZ1bmN0aW9uIGRlbGV0ZVVzZXJQaG90bygpIHtcclxuICAgICQuYmxvY2tVSShMQy5ibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICB1cmw6IExjVXJsLkxhbmdVcmwgKyBcIk5ld0Rhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8/ZGVsZXRlPXRydWVcIixcclxuICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5pbmZvKGRhdGEuUmVzdWx0KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5lcnJvcihkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UpKTtcclxuICAgICAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IH0pO1xyXG4gICAgICAgIHJlbG9hZFVzZXJQaG90bygpO1xyXG4gICAgICB9LFxyXG4gICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxufTtcclxuIiwiLyoqIEVkdWNhdGlvbiBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vcmVxdWlyZSgnTEMvanF1ZXJ5Lnh0c2gnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgZWR1Y2F0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZEVkdWNhdGlvbicsXHJcbiAgICAkb3RoZXJzID0gJGMuZmluZChlZHVjYXRpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJykuc2libGluZ3MoKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGVkdWNhdGlvblNlbGVjdG9yKTtcclxuICAvL2NydWRsLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10gPSB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmFjdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKCkuYWRkKCRsaWNlbnNlcy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobGljZW5zZXNTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmFjdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIExvY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBtYXBSZWFkeSA9IHJlcXVpcmUoJ0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcbi8vIEluZGlyZWN0bHkgdXNlZDogcmVxdWlyZSgnTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBsb2NhdGlvbnNTZWxlY3RvciA9ICcuRGFzaGJvYXJkTG9jYXRpb25zJyxcclxuICAgICRsb2NhdGlvbnMgPSAkYy5maW5kKGxvY2F0aW9uc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkbG9jYXRpb25zLnNpYmxpbmdzKCkuYWRkKCRsb2NhdGlvbnMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxvY2F0aW9uc1NlbGVjdG9yKTtcclxuXHJcbiAgdmFyIGxvY2F0aW9uTWFwO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIC8vRm9yY2UgZXhlY3V0aW9uIG9mIHRoZSAnaGFzLWNvbmZpcm0nIHNjcmlwdFxyXG4gICAgJGVkaXRvci5maW5kKCdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JykuY2hhbmdlKCk7XHJcblxyXG4gICAgbG9jYXRpb25NYXAgPSBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgaWYgKGxvY2F0aW9uTWFwKVxyXG4gICAgICBtYXBSZWFkeS5yZWZyZXNoTWFwKGxvY2F0aW9uTWFwKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKiBMb2NhdGUgdXNlciBwb3NpdGlvbiBvciB0cmFuc2xhdGUgYWRkcmVzcyB0ZXh0IGludG8gYSBnZW9jb2RlIHVzaW5nXHJcbiAgYnJvd3NlciBhbmQgR29vZ2xlIE1hcHMgc2VydmljZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpIHtcclxuICB2YXIgbWFwO1xyXG4gIG1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBpZiB1c2VyIHNlbGVjdHMgb3Igd3JpdGVzIGEgcG9zaXRpb24gKHRvIG5vdCBvdmVyd3JpdGUgaXQgd2l0aCBhdXRvbWF0aWMgcG9zaXRpb25pbmcpXHJcbiAgICB2YXIgcG9zaXRpb25lZEJ5VXNlciA9IGZhbHNlO1xyXG4gICAgLy8gU29tZSBjb25mc1xyXG4gICAgdmFyIGRldGFpbGVkWm9vbUxldmVsID0gMTc7XHJcbiAgICB2YXIgZ2VuZXJhbFpvb21MZXZlbCA9IDk7XHJcbiAgICB2YXIgZm91bmRMb2NhdGlvbnMgPSB7XHJcbiAgICAgIGJ5VXNlcjogbnVsbCxcclxuICAgICAgYnlHZW9sb2NhdGlvbjogbnVsbCxcclxuICAgICAgYnlHZW9jb2RlOiBudWxsLFxyXG4gICAgICBvcmlnaW5hbDogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbCA9ICRlZGl0b3IuZmluZCgnLmxvY2F0aW9uLW1hcCcpO1xyXG4gICAgdmFyIG0gPSBsLmZpbmQoJy5tYXAtc2VsZWN0b3IgPiAuZ29vZ2xlLW1hcCcpLmdldCgwKTtcclxuICAgIHZhciAkbGF0ID0gbC5maW5kKCdbbmFtZT1sYXRpdHVkZV0nKTtcclxuICAgIHZhciAkbG5nID0gbC5maW5kKCdbbmFtZT1sb25naXR1ZGVdJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgcG9zaXRpb24gY29vcmRpbmF0ZXNcclxuICAgIHZhciBteUxhdGxuZztcclxuICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBfbGF0X3ZhbHVlID0gJGxhdC52YWwoKSwgX2xuZ192YWx1ZSA9ICRsbmcudmFsKCk7XHJcbiAgICAgIGlmIChfbGF0X3ZhbHVlICYmIF9sbmdfdmFsdWUpIHtcclxuICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoJGxhdC52YWwoKSwgJGxuZy52YWwoKSk7XHJcbiAgICAgICAgLy8gV2UgY29uc2lkZXIgYXMgJ3Bvc2l0aW9uZWQgYnkgdXNlcicgd2hlbiB0aGVyZSB3YXMgYSBzYXZlZCB2YWx1ZSBmb3IgdGhlIHBvc2l0aW9uIGNvb3JkaW5hdGVzICh3ZSBhcmUgZWRpdGluZyBhIGxvY2F0aW9uKVxyXG4gICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSAobXlMYXRsbmcubGF0KCkgIT09IDAgJiYgbXlMYXRsbmcubG5nKCkgIT09IDApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIERlZmF1bHQgcG9zaXRpb24gd2hlbiB0aGVyZSBhcmUgbm90IG9uZSAoU2FuIEZyYW5jaXNjbyBqdXN0IG5vdyk6XHJcbiAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM3Ljc1MzM0NDM5MjI2Mjk4LCAtMTIyLjQyNTQ2MDYwMzUxNTYpO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgLy8gUmVtZW1iZXIgb3JpZ2luYWwgZm9ybSBsb2NhdGlvblxyXG4gICAgZm91bmRMb2NhdGlvbnMub3JpZ2luYWwgPSBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBteUxhdGxuZztcclxuXHJcbiAgICAvLyBDcmVhdGUgbWFwXHJcbiAgICB2YXIgbWFwT3B0aW9ucyA9IHtcclxuICAgICAgem9vbTogKHBvc2l0aW9uZWRCeVVzZXIgPyBkZXRhaWxlZFpvb21MZXZlbCA6IGdlbmVyYWxab29tTGV2ZWwpLCAvLyBCZXN0IGRldGFpbCB3aGVuIHdlIGFscmVhZHkgaGFkIGEgbG9jYXRpb25cclxuICAgICAgY2VudGVyOiBteUxhdGxuZyxcclxuICAgICAgbWFwVHlwZUlkOiBnb29nbGUubWFwcy5NYXBUeXBlSWQuUk9BRE1BUFxyXG4gICAgfTtcclxuICAgIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobSwgbWFwT3B0aW9ucyk7XHJcbiAgICAvLyBDcmVhdGUgdGhlIHBvc2l0aW9uIG1hcmtlclxyXG4gICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogbXlMYXRsbmcsXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBkcmFnZ2FibGU6IGZhbHNlLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QXHJcbiAgICB9KTtcclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2xpY2tzIG1hcCBvciBtb3ZlIHRoZSBtYXJrZXIgdG8gbW92ZSBtYXJrZXIgb3Igc2V0IHBvc2l0aW9uIGluIHRoZSBmb3JtXHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdkcmFnZW5kJywgc2F2ZUNvb3JkaW5hdGVzKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmICghbWFya2VyLmdldERyYWdnYWJsZSgpKSByZXR1cm47XHJcbiAgICAgIHBsYWNlTWFya2VyKGV2ZW50LmxhdExuZyk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBldmVudC5sYXRMbmc7XHJcbiAgICB9KTtcclxuICAgIGZ1bmN0aW9uIHBsYWNlTWFya2VyKGxhdGxuZywgZG96b29tLCBhdXRvc2F2ZSkge1xyXG4gICAgICBtYXJrZXIuc2V0UG9zaXRpb24obGF0bG5nKTtcclxuICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgbWFwLnBhblRvKGxhdGxuZyk7XHJcbiAgICAgIHNhdmVDb29yZGluYXRlcyhhdXRvc2F2ZSk7XHJcbiAgICAgIGlmIChkb3pvb20pXHJcbiAgICAgIC8vIFNldCB6b29tIHRvIHNvbWV0aGluZyBtb3JlIGRldGFpbGVkXHJcbiAgICAgICAgbWFwLnNldFpvb20oZGV0YWlsZWRab29tTGV2ZWwpO1xyXG4gICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gc2F2ZUNvb3JkaW5hdGVzKGluRm9ybSkge1xyXG4gICAgICB2YXIgbGF0TG5nID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBsYXRMbmc7XHJcbiAgICAgIGlmIChpbkZvcm0gPT09IHRydWUpIHtcclxuICAgICAgICAkbGF0LnZhbChsYXRMbmcubGF0KCkpOyAvL21hcmtlci5wb3NpdGlvbi5YYVxyXG4gICAgICAgICRsbmcudmFsKGxhdExuZy5sbmcoKSk7IC8vbWFya2VyLnBvc2l0aW9uLllhXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2hhbmdlcyBmb3JtIGNvb3JkaW5hdGVzIHZhbHVlcyB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgJGxhdC5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICRsbmcuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICBmdW5jdGlvbiB1cGRhdGVNYXBNYXJrZXIoKSB7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICB2YXIgbmV3UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgLy8gTW92ZSBtYXJrZXJcclxuICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ld1Bvcyk7XHJcbiAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgIG1hcC5wYW5UbyhuZXdQb3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qPT09PT09PT09PT09PT09PT09PVxyXG4gICAgKiBBVVRPIFBPU0lUSU9OSU5HXHJcbiAgICAqL1xyXG4gICAgZnVuY3Rpb24gdXNlR2VvbG9jYXRpb24oZm9yY2UsIGF1dG9zYXZlKSB7XHJcbiAgICAgIHZhciBvdmVycmlkZSA9IGZvcmNlIHx8ICFwb3NpdGlvbmVkQnlVc2VyO1xyXG4gICAgICAvLyBVc2UgYnJvd3NlciBnZW9sb2NhdGlvbiBzdXBwb3J0IHRvIGdldCBhbiBhdXRvbWF0aWMgbG9jYXRpb24gaWYgdGhlcmUgaXMgbm8gYSBsb2NhdGlvbiBzZWxlY3RlZCBieSB1c2VyXHJcbiAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgZ2VvbG9jYXRpb24uXHJcbiAgICAgIGlmIChvdmVycmlkZSAmJiBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbG9jYXRpb24gbWFya2VyIHRoYXQgd2Ugd2lsbCBiZSB1c2luZ1xyXG4gICAgICAgIC8vIG9uIHRoZSBtYXAuIExldCdzIHN0b3JlIGEgcmVmZXJlbmNlIHRvIGl0IGhlcmUgc29cclxuICAgICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1cGRhdGVkIGluIHNldmVyYWwgcGxhY2VzLlxyXG4gICAgICAgIHZhciBsb2NhdGlvbk1hcmtlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgbG9jYXRpb24gb2YgdGhlIHVzZXIncyBicm93c2VyIHVzaW5nIHRoZVxyXG4gICAgICAgIC8vIG5hdGl2ZSBnZW9sb2NhdGlvbiBzZXJ2aWNlLiBXaGVuIHdlIGludm9rZSB0aGlzIG1ldGhvZFxyXG4gICAgICAgIC8vIG9ubHkgdGhlIGZpcnN0IGNhbGxiYWNrIGlzIHJlcXVpZWQuIFRoZSBzZWNvbmRcclxuICAgICAgICAvLyBjYWxsYmFjayAtIHRoZSBlcnJvciBoYW5kbGVyIC0gYW5kIHRoZSB0aGlyZFxyXG4gICAgICAgIC8vIGFyZ3VtZW50IC0gb3VyIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyAtIGFyZSBvcHRpb25hbC5cclxuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKFxyXG4gICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgbG9jYXRpb24uXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgYnVnIGluIEZpcmVGb3ggd2hlcmUgdGhpcyBnZXRzXHJcbiAgICAgICAgICAgIC8vIGludm9rZWQgbW9yZSB0aGFuIG9uY2Ugd2l0aCBhIGNhY2hlZCByZXN1bHQuXHJcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk1hcmtlcikge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXIgdG8gdGhlIG1hcCB1c2luZyB0aGUgcG9zaXRpb24sIG9ubHkgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coXCJTb21ldGhpbmcgd2VudCB3cm9uZzogXCIsIGVycm9yKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpbWVvdXQ6ICg1ICogMTAwMCksXHJcbiAgICAgICAgICAgIG1heGltdW1BZ2U6ICgxMDAwICogNjAgKiAxNSksXHJcbiAgICAgICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeTogdHJ1ZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG5cclxuICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFza2VkIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIsXHJcbiAgICAgICAgLy8gbGV0J3Mgd2F0Y2ggdGhlIHBvc2l0aW9uIHRvIHNlZSBpZiBpdCB1cGRhdGVzLiBUaGlzXHJcbiAgICAgICAgLy8gY2FuIGhhcHBlbiBpZiB0aGUgdXNlciBwaHlzaWNhbGx5IG1vdmVzLCBvZiBpZiBtb3JlXHJcbiAgICAgICAgLy8gYWNjdXJhdGUgbG9jYXRpb24gaW5mb3JtYXRpb24gaGFzIGJlZW4gZm91bmQgKGV4LlxyXG4gICAgICAgIC8vIEdQUyB2cy4gSVAgYWRkcmVzcykuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBOT1RFOiBUaGlzIGFjdHMgbXVjaCBsaWtlIHRoZSBuYXRpdmUgc2V0SW50ZXJ2YWwoKSxcclxuICAgICAgICAvLyBpbnZva2luZyB0aGUgZ2l2ZW4gY2FsbGJhY2sgYSBudW1iZXIgb2YgdGltZXMgdG9cclxuICAgICAgICAvLyBtb25pdG9yIHRoZSBwb3NpdGlvbi4gQXMgc3VjaCwgaXQgcmV0dXJucyBhIFwidGltZXIgSURcIlxyXG4gICAgICAgIC8vIHRoYXQgY2FuIGJlIHVzZWQgdG8gbGF0ZXIgc3RvcCB0aGUgbW9uaXRvcmluZy5cclxuICAgICAgICB2YXIgcG9zaXRpb25UaW1lciA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIGFnYWluIHRvIHRoZSBuZXcgb3IgYWNjdXJhdGVkIHBvc2l0aW9uLCBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25NYXJrZXIgPSBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgdXBkYXRlZCB3aXRoaW4gNSBtaW51dGVzLCBzdG9wXHJcbiAgICAgICAgLy8gbW9uaXRvcmluZyB0aGUgcG9zaXRpb24gZm9yIGNoYW5nZXMuXHJcbiAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBwb3NpdGlvbiB3YXRjaGVyLlxyXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAoMTAwMCAqIDYwICogNSlcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICB9IC8vIEVuZHMgZ2VvbG9jYXRpb24gcG9zaXRpb25cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHVzZUdtYXBzR2VvY29kZShpbml0aWFsTG9va3VwLCBhdXRvc2F2ZSkge1xyXG4gICAgICB2YXIgZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcclxuXHJcbiAgICAgIC8vIGxvb2t1cCBvbiBhZGRyZXNzIGZpZWxkcyBjaGFuZ2VzIHdpdGggY29tcGxldGUgaW5mb3JtYXRpb25cclxuICAgICAgdmFyICRmb3JtID0gJGVkaXRvci5maW5kKCcuY3J1ZGwtZm9ybScpLCBmb3JtID0gJGZvcm0uZ2V0KDApO1xyXG4gICAgICBmdW5jdGlvbiBnZXRGb3JtQWRkcmVzcygpIHtcclxuICAgICAgICB2YXIgYWQgPSBbXTtcclxuICAgICAgICBmdW5jdGlvbiBhZGQoZmllbGQpIHtcclxuICAgICAgICAgIGlmIChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSkgYWQucHVzaChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFkZCgnYWRkcmVzc2xpbmUxJyk7XHJcbiAgICAgICAgYWRkKCdhZGRyZXNzbGluZTInKTtcclxuICAgICAgICBhZGQoJ2NpdHknKTtcclxuICAgICAgICBhZGQoJ3Bvc3RhbGNvZGUnKTtcclxuICAgICAgICB2YXIgcyA9IGZvcm0uZWxlbWVudHMuc3RhdGU7XHJcbiAgICAgICAgaWYgKHMudmFsdWUpIGFkLnB1c2gocy5vcHRpb25zW3Muc2VsZWN0ZWRJbmRleF0ubGFiZWwpO1xyXG4gICAgICAgIGFkLnB1c2goJ1VTQScpO1xyXG4gICAgICAgIC8vIE1pbmltdW0gZm9yIHZhbGlkIGFkZHJlc3M6IDQgZmllbGRzIGZpbGxlZCBvdXRcclxuICAgICAgICByZXR1cm4gYWQubGVuZ3RoID49IDUgPyBhZC5qb2luKCcsICcpIDogbnVsbDtcclxuICAgICAgfVxyXG4gICAgICAkZm9ybS5vbignY2hhbmdlJywgJ1tuYW1lPWFkZHJlc3NsaW5lMV0sIFtuYW1lPWFkZHJlc3NsaW5lMl0sIFtuYW1lPWNpdHldLCBbbmFtZT1wb3N0YWxjb2RlXSwgW25hbWU9c3RhdGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICBpZiAoYWRkcmVzcylcclxuICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgZmFsc2UpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWwgbG9va3VwXHJcbiAgICAgIGlmIChpbml0aWFsTG9va3VwKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBvdmVycmlkZSkge1xyXG4gICAgICAgIGdlb2NvZGVyLmdlb2NvZGUoeyAnYWRkcmVzcyc6IGFkZHJlc3MgfSwgZnVuY3Rpb24gKHJlc3VsdHMsIHN0YXR1cykge1xyXG4gICAgICAgICAgaWYgKHN0YXR1cyA9PSBnb29nbGUubWFwcy5HZW9jb2RlclN0YXR1cy5PSykge1xyXG4gICAgICAgICAgICB2YXIgbGF0TG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbjtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oJ0dlb2NvZGUgcmV0cmlldmVkOiAnICsgbGF0TG5nICsgJyBmb3IgYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSA9IGxhdExuZztcclxuXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignR2VvY29kZSB3YXMgbm90IHN1Y2Nlc3NmdWwgZm9yIHRoZSBmb2xsb3dpbmcgcmVhc29uOiAnICsgc3RhdHVzICsgJyBvbiBhZGRyZXNzIFwiJyArIGFkZHJlc3MgKyAnXCInKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4ZWN1dGluZyBhdXRvIHBvc2l0aW9uaW5nIChjaGFuZ2VkIHRvIGF1dG9zYXZlOnRydWUgdG8gYWxsIHRpbWUgc2F2ZSB0aGUgbG9jYXRpb24pOlxyXG4gICAgLy91c2VHZW9sb2NhdGlvbih0cnVlLCBmYWxzZSk7XHJcbiAgICB1c2VHbWFwc0dlb2NvZGUoZmFsc2UsIHRydWUpO1xyXG5cclxuICAgIC8vIExpbmsgb3B0aW9ucyBsaW5rczpcclxuICAgIGwub24oJ2NsaWNrJywgJy5vcHRpb25zIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKS5zdWJzdHIoMSk7XHJcbiAgICAgIHN3aXRjaCAodGFyZ2V0KSB7XHJcbiAgICAgICAgY2FzZSAnZ2VvbG9jYXRpb24nOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24sIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1c2VHZW9sb2NhdGlvbih0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2dlb2NvZGUnOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSlcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXNlR21hcHNHZW9jb2RlKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnY29uZmlybSc6XHJcbiAgICAgICAgICBzYXZlQ29vcmRpbmF0ZXModHJ1ZSk7XHJcbiAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGZhbHNlKTtcclxuICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgbC5maW5kKCcuZ3BzLWxhdCwgLmdwcy1sbmcsIC5hZHZpY2UsIC5maW5kLWFkZHJlc3MtZ2VvY29kZScpLmhpZGUoJ2Zhc3QnKTtcclxuICAgICAgICAgIHZhciBlZGl0ID0gbC5maW5kKCcuZWRpdC1hY3Rpb24nKTtcclxuICAgICAgICAgIGVkaXQudGV4dChlZGl0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdlZGl0Y29vcmRpbmF0ZXMnOlxyXG4gICAgICAgICAgdmFyIGEgPSBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJyk7XHJcbiAgICAgICAgICB2YXIgYiA9ICFhLmlzKCc6dmlzaWJsZScpO1xyXG4gICAgICAgICAgbWFya2VyLnNldERyYWdnYWJsZShiKTtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAkdC5kYXRhKCdlZGl0LWxhYmVsJywgJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdjYW5jZWwtbGFiZWwnKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgbG9jYXRpb246XHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhLnRvZ2dsZSgnZmFzdCcpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbWFwO1xyXG59IiwiLyoqIFVJIGxvZ2ljIHRvIG1hbmFnZSBwcm92aWRlciBwaG90b3MgKHlvdXItd29yay9waG90b3MpLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkUGhvdG9zJztcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgc2V0dXBDcnVkbERlbGVnYXRlcygkYyk7XHJcblxyXG4gIGluaXRFbGVtZW50cygkYyk7XHJcblxyXG4gIC8vIEFueSB0aW1lIHRoYXQgdGhlIGZvcm0gY29udGVudCBodG1sIGlzIHJlbG9hZGVkLFxyXG4gIC8vIHJlLWluaXRpYWxpemUgZWxlbWVudHNcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgaW5pdEVsZW1lbnRzKCRjKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qIFNldHVwIHRoZSBjb2RlIHRoYXQgd29ya3Mgb24gdGhlIGRpZmZlcmVudCBDUlVETCBhY3Rpb25zIG9uIHRoZSBwaG90b3MuXHJcbiAgQWxsIHRoaXMgYXJlIGRlbGVnYXRlcywgb25seSBuZWVkIHRvIGJlIHNldHVwIG9uY2Ugb24gdGhlIHBhZ2VcclxuICAoaWYgdGhlIGNvbnRhaW5lciAkYyBpcyBub3QgcmVwbGFjZWQsIG9ubHkgdGhlIGNvbnRlbnRzLCBkb2Vzbid0IG5lZWQgdG8gY2FsbCBhZ2FpbiB0aGlzKS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBDcnVkbERlbGVnYXRlcygkYykge1xyXG4gICRjXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtdG9vbHMtdXBsb2FkID4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBwb3NJRCA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2lucHV0W25hbWU9cG9zaXRpb25JRF0nKS52YWwoKTtcclxuICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ05ld0Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgcG9zSUQsICdzbWFsbCcpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZ2FsbGVyeSBsaSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmb3JtID0gJHQuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcblxyXG4gICAgLy8gSWYgdGhlIGZvcm0gaGFkIGNoYW5nZXMsIHN1Ym1pdCBpdCB0byBzYXZlIGl0OlxyXG4gICAgLy8gUmVtb3ZlIHRoZSBmb2N1cyBvZiBjdXJyZW50IGZvY3VzZWQgZWxlbWVudCB0byBhdm9pZCBcclxuICAgIC8vIGNoYW5nZWQgZWxlbWVudHMgbm90IG5vdGlmeSB0aGUgY2hhbmdlIHN0YXR1c1xyXG4gICAgJCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgdmFyIGYgPSBlZGl0UGFuZWwuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG4gICAgdmFyIGNoYW5nZWRFbHMgPSBmLmZpbmQoJy5jaGFuZ2VkOmlucHV0JykubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLm5hbWU7IH0pLmdldCgpO1xyXG4gICAgaWYgKGNoYW5nZWRFbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAvLyBNYXJrIGNoYW5nZXMgYXJlIHNhdmVkXHJcbiAgICAgIGYub25lKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIGNoYW5nZWRFbHMpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEZvcmNlIGEgZmllbGRzZXQuYWpheCBzdWJtaXQ6XHJcbiAgICAgIGYuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIH1cclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbChmb3JtKTtcclxuICAgIC8vIFNldCB0aGlzIHBob3RvIGFzIHNlbGVjdGVkXHJcbiAgICB2YXIgc2VsZWN0ZWQgPSAkdC5jbG9zZXN0KCdsaScpO1xyXG4gICAgc2VsZWN0ZWQuYWRkQ2xhc3MoJ3NlbGVjdGVkJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgIC8vdmFyIHNlbGVjdGVkID0gJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpLnNlbGVjdGVkJywgZm9ybSk7XHJcbiAgICBpZiAoc2VsZWN0ZWQgIT09IG51bGwgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgIC8vIE1vdmluZyBzZWxlY3RlZCB0byBiZSBlZGl0IHBhbmVsXHJcbiAgICAgIHZhciBwaG90b0lEID0gc2VsZWN0ZWQuYXR0cignaWQnKS5tYXRjaCgvXlVzZXJQaG90by0oXFxkKykkLylbMV07XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsIHNlbEltZy5hdHRyKCdzcmMnKSk7XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbChzZWxJbWcuYXR0cignYWx0JykpO1xyXG4gICAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dW3ZhbHVlPScgKyBpc1ByaW1hcnlWYWx1ZSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZWRpdC1kZWxldGUgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBlZGl0UGFuZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAvLyBDaGFuZ2UgdGhlIGZpZWxkIGRlbGV0ZS1waG90byB0byBUcnVlIGFuZCBzZW5kIGZvcm0gZm9yIGFuIGFqYXggcmVxdWVzdCB3aXRoXHJcbiAgICAvLyBzZXJ2ZXIgZGVsZXRlIHRhc2sgYW5kIGNvbnRlbnQgcmVsb2FkXHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9ZGVsZXRlLXBob3RvXScpLnZhbCgnVHJ1ZScpO1xyXG4gICAgLy8gRm9yY2UgYSBmaWVsZHNldC5hamF4IHN1Ym1pdDpcclxuICAgIGVkaXRQYW5lbC5jbG9zZXN0KCdmaWVsZHNldC5hamF4JykuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuLyogSW5pdGlhbGl6ZSB0aGUgcGhvdG9zIGVsZW1lbnRzIHRvIGJlIHNvcnRhYmxlcywgc2V0IHRoZSBwcmltYXJ5IHBob3RvXHJcbiAgaW4gdGhlIGhpZ2hsaWdodGVkIGFyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgJ2RlbGV0ZSBwaG90bycgZmxhZy5cclxuICBUaGlzIGlzIHJlcXVpcmVkIHRvIGJlIGV4ZWN1dGVkIGFueSB0aW1lIHRoZSBlbGVtZW50cyBodG1sIGlzIHJlcGxhY2VkXHJcbiAgYmVjYXVzZSBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gZWxlbWVudHMuXHJcbiovXHJcbmZ1bmN0aW9uIGluaXRFbGVtZW50cyhmb3JtKSB7XHJcbiAgLy8gUHJlcGFyZSBzb3J0YWJsZSBzY3JpcHRcclxuICAkKFwiLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbFwiLCBmb3JtKS5zb3J0YWJsZSh7XHJcbiAgICBwbGFjZWhvbGRlcjogXCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBHZXQgcGhvdG8gb3JkZXIsIGEgY29tbWEgc2VwYXJhdGVkIHZhbHVlIG9mIGl0ZW1zIElEc1xyXG4gICAgICB2YXIgb3JkZXIgPSAkKHRoaXMpLnNvcnRhYmxlKFwidG9BcnJheVwiKS50b1N0cmluZygpO1xyXG4gICAgICAvLyBTZXQgb3JkZXIgaW4gdGhlIGZvcm0gZWxlbWVudCwgdG8gYmUgc2VudCBsYXRlciB3aXRoIHRoZSBmb3JtXHJcbiAgICAgICQodGhpcykuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpLmZpbmQoJ1tuYW1lPWdhbGxlcnktb3JkZXJdJykudmFsKG9yZGVyKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gU2V0IHByaW1hcnkgcGhvdG8gdG8gYmUgZWRpdGVkXHJcbiAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcbiAgLy8gTG9vayBmb3IgYSBzZWxlY3RlZCBwaG90byBpbiB0aGUgbGlzdFxyXG4gIHZhciBzZWxlY3RlZCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaS5zZWxlY3RlZCcsIGZvcm0pO1xyXG4gIGlmIChzZWxlY3RlZCAhPT0gbnVsbCAmJiBzZWxlY3RlZC5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAvLyBNb3Zpbmcgc2VsZWN0ZWQgdG8gYmUgZWRpdCBwYW5lbFxyXG4gICAgdmFyIHBob3RvSUQgPSBzZWxlY3RlZC5hdHRyKCdpZCcpLm1hdGNoKC9eVXNlclBob3RvLShcXGQrKSQvKVsxXTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCBzZWxJbWcuYXR0cignc3JjJykpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKHNlbEltZy5hdHRyKCdhbHQnKSk7XHJcbiAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b11bdmFsdWU9JyArIGlzUHJpbWFyeVZhbHVlICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChmb3JtLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXBob3RvcycpLCBlZGl0UGFuZWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc21vb3RoQm94QmxvY2sub3Blbihmb3JtLmZpbmQoJy5uby1wcmltYXJ5LXBob3RvJyksIGVkaXRQYW5lbCk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIG1hbnVhbGx5IHRvIGF2b2lkIGJyb3dzZXIgbWVtb3J5IGJyZWFraW5nIHRoaW5nc1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKCcnKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgnJyk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gIH1cclxuICAvLyBSZXNldCBkZWxldGUgb3B0aW9uXHJcbiAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWRlbGV0ZS1waG90b10nKS52YWwoJ0ZhbHNlJyk7XHJcblxyXG59XHJcbiIsIi8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBmb3JtYXR0ZXJzIG9uIHBhZ2UtcmVhZHkuLlxyXG4gIHZhciBmaW5pdCA9IGZ1bmN0aW9uICgpIHsgaW5pdEZvcm1hdHRlcnMoJGMpOyB9O1xyXG4gICQoZmluaXQpO1xyXG4gIC8vIGFuZCBhbnkgYWpheC1wb3N0IG9mIHRoZSBmb3JtIHRoYXQgcmV0dXJucyBuZXcgaHRtbDpcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZmluaXQpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgdGhlIGZpZWxkIGZvcm1hdHRlcnMgcmVxdWlyZWQgYnkgdGhlIHBheW1lbnQtYWNjb3VudC1mb3JtLCBiYXNlZFxyXG4gIG9uIHRoZSBmaWVsZHMgbmFtZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0Rm9ybWF0dGVycygkY29udGFpbmVyKSB7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImJpcnRoZGF0ZVwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5fX0ve3s5OX19L3t7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwic3NuXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTk5fX0te3s5OX19LXt7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxufSIsIi8qKiBQcmljaW5nIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnTEMvVGltZVNwYW4nKTtcclxucmVxdWlyZSgnTEMvVGltZVNwYW5FeHRyYScpLnBsdWdJbihUaW1lU3Bhbik7XHJcbnZhciB1cGRhdGVUb29sdGlwcyA9IHJlcXVpcmUoJ0xDL3Rvb2x0aXBzJykudXBkYXRlVG9vbHRpcHM7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgcHJpY2luZ1NlbGVjdG9yID0gJy5EYXNoYm9hcmRQcmljaW5nJyxcclxuICAgICRwcmljaW5nID0gJGMuZmluZChwcmljaW5nU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRwcmljaW5nLnNpYmxpbmdzKCkuYWRkKCRwcmljaW5nLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChwcmljaW5nU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcik7XHJcbiAgICBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcik7XHJcbiAgICB1cGRhdGVUb29sdGlwcygpO1xyXG4gICAgc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpO1xyXG5cclxuICB9KTtcclxufTtcclxuXHJcbi8qIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCBvbiAnbm90IHRvIHN0YXRlIHByaWNlIHJhdGUnLCB1cGRhdGluZyByZWxhdGVkIHByaWNlIHJhdGUgZmllbGRzLlxyXG4gIEl0cyBzZXR1cGVkIHBlciBlZGl0b3IgaW5zdGFuY2UsIG5vdCBhcyBhbiBldmVudCBkZWxlZ2F0ZS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcikge1xyXG4gIHZhciBcclxuICAgIHByID0gJGVkaXRvci5maW5kKCdbbmFtZT1wcmljZS1yYXRlXSxbbmFtZT1wcmljZS1yYXRlLXVuaXRdJyksXHJcbiAgICBucHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPW5vLXByaWNlLXJhdGVdJyk7XHJcbiAgbnByLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBwci5wcm9wKCdkaXNhYmxlZCcsIG5wci5wcm9wKCdjaGVja2VkJykpO1xyXG4gIH0pO1xyXG4gIC8vIEluaXRpYWwgc3RhdGU6XHJcbiAgbnByLmNoYW5nZSgpO1xyXG59XHJcblxyXG4vKiogU2V0dXAgdGhlIFVJIFNsaWRlcnMgb24gdGhlIGVkaXRvci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKSB7XHJcblxyXG4gIC8qIEhvdXNlZWtlZXBlciBwcmljaW5nICovXHJcbiAgZnVuY3Rpb24gdXBkYXRlQXZlcmFnZSgkYywgbWludXRlcykge1xyXG4gICAgJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpLnZhbChtaW51dGVzKTtcclxuICAgIG1pbnV0ZXMgPSBwYXJzZUludChtaW51dGVzKTtcclxuICAgICRjLmZpbmQoJy5wcmV2aWV3IC50aW1lJykudGV4dChUaW1lU3Bhbi5mcm9tTWludXRlcyhtaW51dGVzKS50b1NtYXJ0U3RyaW5nKCkpO1xyXG4gIH1cclxuXHJcbiAgJGVkaXRvci5maW5kKFwiLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZS1zbGlkZXJcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJGMgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXNsaWRlci12YWx1ZV0nKTtcclxuICAgIHZhciBhdmVyYWdlID0gJGMuZGF0YSgnc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgIHN0ZXAgPSAkYy5kYXRhKCdzbGlkZXItc3RlcCcpIHx8IDE7XHJcbiAgICBpZiAoIWF2ZXJhZ2UpIHJldHVybjtcclxuICAgIHZhciBzZXR1cCA9IHtcclxuICAgICAgcmFuZ2U6IFwibWluXCIsXHJcbiAgICAgIHZhbHVlOiBhdmVyYWdlLFxyXG4gICAgICBtaW46IGF2ZXJhZ2UgLSAzICogc3RlcCxcclxuICAgICAgbWF4OiBhdmVyYWdlICsgMyAqIHN0ZXAsXHJcbiAgICAgIHN0ZXA6IHN0ZXAsXHJcbiAgICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgdXBkYXRlQXZlcmFnZSgkYywgdWkudmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdmFyIHNsaWRlciA9ICQodGhpcykuc2xpZGVyKHNldHVwKTtcclxuXHJcbiAgICAkYy5maW5kKCcucHJvdmlkZXItYXZlcmFnZS10aW1lJykub24oJ2NsaWNrJywgJ2xhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICBpZiAoJHQuaGFzQ2xhc3MoJ2JlbG93LWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1pbik7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC52YWx1ZSk7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhYm92ZS1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5tYXgpO1xyXG4gICAgICB1cGRhdGVBdmVyYWdlKCRjLCBzbGlkZXIuc2xpZGVyKCd2YWx1ZScpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldHVwIHRoZSBpbnB1dCBmaWVsZCwgaGlkZGVuIGFuZCB3aXRoIGluaXRpYWwgdmFsdWUgc3luY2hyb25pemVkIHdpdGggc2xpZGVyXHJcbiAgICB2YXIgZmllbGQgPSAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJyk7XHJcbiAgICBmaWVsZC5oaWRlKCk7XHJcbiAgICB2YXIgY3VycmVudFZhbHVlID0gZmllbGQudmFsKCkgfHwgYXZlcmFnZTtcclxuICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBUaGUgaW4tZWRpdG9yIGxpbmsgI3Nob3ctbW9yZS1hdHRyaWJ1dGVzIG11c3Qgc2hvdy9oaWRlIHRoZSBjb250YWluZXIgb2ZcclxuICBleHRyYSBhdHRyaWJ1dGVzIGZvciB0aGUgcGFja2FnZS9wcmljaW5nLWl0ZW0uIFRoaXMgc2V0dXBzIHRoZSByZXF1aXJlZCBoYW5kbGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpIHtcclxuICAvLyBIYW5kbGVyIGZvciAnc2hvdy1tb3JlLWF0dHJpYnV0ZXMnIGJ1dHRvbiAodXNlZCBvbmx5IG9uIGVkaXQgYSBwYWNrYWdlKVxyXG4gICRlZGl0b3IuZmluZCgnLnNob3ctbW9yZS1hdHRyaWJ1dGVzJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBhdHRzID0gJHQuc2libGluZ3MoJy5zZXJ2aWNlcy1ub3QtY2hlY2tlZCcpO1xyXG4gICAgaWYgKGF0dHMuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdzaG93LXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLmhpZGUoJ2Zhc3QnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnaGlkZS10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5zaG93KCdmYXN0Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn0iLCIvKipcclxuICBwcml2YWN5U2V0dGluZ3M6IFNldHVwIGZvciB0aGUgc3BlY2lmaWMgcGFnZS1mb3JtIGRhc2hib2FyZC9wcml2YWN5L3ByaXZhY3lzZXR0aW5nc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gVE9ETyBJbXBsZW1lbnQgZGVwZW5kZW5jaWVzIGNvbW1pbmcgZnJvbSBhcHAuanMgaW5zdGVhZCBvZiBkaXJlY3QgbGlua1xyXG4vL3ZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ3Ntb290aEJveEJsb2NrJyk7XHJcbi8vIFRPRE8gUmVwbGFjZSBkb20tcmVzc291cmNlcyBieSBpMThuLmdldFRleHRcclxuXHJcbnZhciBwcml2YWN5ID0ge1xyXG4gIGFjY291bnRMaW5rc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3lTZXR0aW5ncy1teUFjY291bnQgYScsXHJcbiAgcmVzc291cmNlc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3ktYWNjb3VudFJlc3NvdXJjZXMnXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByaXZhY3k7XHJcblxyXG5wcml2YWN5Lm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICcuY2FuY2VsLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKCRjKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZnVuY3Rpb24gKCkge1xyXG4gICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG4gIFxyXG4gICRjLm9uKCdjbGljaycsIHByaXZhY3kuYWNjb3VudExpbmtzU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgYixcclxuICAgICAgbHJlcyA9ICRjLmZpbmQocHJpdmFjeS5yZXNzb3VyY2VzU2VsZWN0b3IpO1xyXG5cclxuICAgIHN3aXRjaCAoJCh0aGlzKS5hdHRyKCdocmVmJykpIHtcclxuICAgICAgY2FzZSAnI2RlbGV0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVsZXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI2RlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjcmVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcucmVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoYikge1xyXG4gICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IGIub2Zmc2V0KCkudG9wIH0sIDUwMCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG59OyIsIi8qKiBTZXJ2aWNlIEF0dHJpYnV0ZXMgVmFsaWRhdGlvbjogaW1wbGVtZW50cyB2YWxpZGF0aW9ucyB0aHJvdWdoIHRoZSBcclxuICAnY3VzdG9tVmFsaWRhdGlvbicgYXBwcm9hY2ggZm9yICdwb3NpdGlvbiBzZXJ2aWNlIGF0dHJpYnV0ZXMnLlxyXG4gIEl0IHZhbGlkYXRlcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGNhdGVnb3J5LCBhbG1vc3Qtb25lIG9yIHNlbGVjdC1vbmUgbW9kZXMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJ0xDL2dldFRleHQnKTtcclxudmFyIHZoID0gcmVxdWlyZSgnTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJ0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbi8qKiBFbmFibGUgdmFsaWRhdGlvbiBvZiByZXF1aXJlZCBzZXJ2aWNlIGF0dHJpYnV0ZXMgb25cclxuICB0aGUgZm9ybShzKSBzcGVjaWZpZWQgYnkgdGhlIHNlbGVjdG9yIG9yIHByb3ZpZGVkXHJcbioqL1xyXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gc2V0dXBTZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24oY29udGFpbmVyU2VsZWN0b3IsIG9wdGlvbnMpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgcmVxdWlyZWRTZWxlY3RvcjogJy5EYXNoYm9hcmRTZXJ2aWNlcy1hdHRyaWJ1dGVzLWNhdGVnb3J5LmlzLXJlcXVpcmVkJyxcclxuICAgIHNlbGVjdE9uZUNsYXNzOiAnanMtdmFsaWRhdGlvblNlbGVjdE9uZScsXHJcbiAgICBncm91cEVycm9yQ2xhc3M6ICdpcy1lcnJvcicsXHJcbiAgICB2YWxFcnJvclRleHRLZXk6ICdyZXF1aXJlZC1hdHRyaWJ1dGUtY2F0ZWdvcnktZXJyb3InXHJcbiAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICRjLmVhY2goZnVuY3Rpb24gdmFsaWRhdGVTZXJ2aWNlQXR0cmlidXRlcygpIHtcclxuICAgIHZhciBmID0gJCh0aGlzKTtcclxuICAgIGlmICghZi5pcygnZm9ybScpKSB7XHJcbiAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBlbGVtZW50IHRvIGFwcGx5IHZhbGlkYXRpb24gbXVzdCBiZSBhIGZvcm0nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGYuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicsIHtcclxuICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsaWQgPSB0cnVlLCBsYXN0VmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIHZhciB2ID0gdmguZmluZFZhbGlkYXRpb25TdW1tYXJ5KGYpO1xyXG5cclxuICAgICAgICBmLmZpbmQob3B0aW9ucy5yZXF1aXJlZFNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBmcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgY2F0ID0gZnMuY2hpbGRyZW4oJ2xlZ2VuZCcpLnRleHQoKTtcclxuICAgICAgICAgIC8vIFdoYXQgdHlwZSBvZiB2YWxpZGF0aW9uIGFwcGx5P1xyXG4gICAgICAgICAgaWYgKGZzLmlzKCcuJyArIG9wdGlvbnMuc2VsZWN0T25lQ2xhc3MpKVxyXG4gICAgICAgICAgLy8gaWYgdGhlIGNhdCBpcyBhICd2YWxpZGF0aW9uLXNlbGVjdC1vbmUnLCBhICdzZWxlY3QnIGVsZW1lbnQgd2l0aCBhICdwb3NpdGl2ZSdcclxuICAgICAgICAgIC8vIDpzZWxlY3RlZCB2YWx1ZSBtdXN0IGJlIGNoZWNrZWRcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gISEoZnMuZmluZCgnb3B0aW9uOnNlbGVjdGVkJykudmFsKCkpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBsb29rIGZvciAnYWxtb3N0IG9uZScgY2hlY2tlZCB2YWx1ZXM6XHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9IChmcy5maW5kKCdpbnB1dDpjaGVja2VkJykubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXN0VmFsaWQpIHtcclxuICAgICAgICAgICAgdmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZnMuYWRkQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gZ2V0VGV4dChvcHRpb25zLnZhbEVycm9yVGV4dEtleSwgY2F0KTtcclxuICAgICAgICAgICAgaWYgKHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICB2LmNoaWxkcmVuKCd1bCcpLmFwcGVuZCgkKCc8bGkvPicpLnRleHQoZXJyKS5hdHRyKCd0aXRsZScsIGNhdCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoZik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihmKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbGlkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBJdCBwcm92aWRlcyB0aGUgY29kZSBmb3IgdGhlIGFjdGlvbnMgb2YgdGhlIFZlcmlmaWNhdGlvbnMgc2VjdGlvbi5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbi8vdmFyIExjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuLy92YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG5cclxudmFyIGFjdGlvbnMgPSBleHBvcnRzLmFjdGlvbnMgPSB7fTtcclxuXHJcbmFjdGlvbnMuZmFjZWJvb2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLyogRmFjZWJvb2sgY29ubmVjdCAqL1xyXG4gIHZhciBGYWNlYm9va0Nvbm5lY3QgPSByZXF1aXJlKCdMQy9GYWNlYm9va0Nvbm5lY3QnKTtcclxuICB2YXIgZmIgPSBuZXcgRmFjZWJvb2tDb25uZWN0KHtcclxuICAgIHJlc3VsdFR5cGU6ICdqc29uJyxcclxuICAgIHVybFNlY3Rpb246ICdWZXJpZnknLFxyXG4gICAgYXBwSWQ6ICQoJ2h0bWwnKS5kYXRhKCdmYi1hcHBpZCcpLFxyXG4gICAgcGVybWlzc2lvbnM6ICdlbWFpbCx1c2VyX2Fib3V0X21lJyxcclxuICAgIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnXHJcbiAgfSk7XHJcbiAgJChkb2N1bWVudCkub24oZmIuY29ubmVjdGVkRXZlbnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdwb3B1cC1jbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZmIuY29ubmVjdCgpO1xyXG59O1xyXG5cclxuYWN0aW9ucy5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcclxuICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdBY2NvdW50LyRSZXNlbmRDb25maXJtYXRpb25FbWFpbC9ub3cvJywgcG9wdXAuc2l6ZSgnc21hbGwnKSk7XHJcbn07XHJcblxyXG52YXIgbGlua3MgPSBleHBvcnRzLmxpbmtzID0ge1xyXG4gICcjY29ubmVjdC13aXRoLWZhY2Vib29rJzogYWN0aW9ucy5mYWNlYm9vayxcclxuICAnI2NvbmZpcm0tZW1haWwnOiBhY3Rpb25zLmVtYWlsXHJcbn07XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2V0IHRoZSBhY3Rpb24gbGluayBvciBlbXB0eVxyXG4gICAgdmFyIGxpbmsgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xyXG5cclxuICAgIC8vIEV4ZWN1dGUgdGhlIGFjdGlvbiBhdHRhY2hlZCB0byB0aGF0IGxpbmtcclxuICAgIHZhciBhY3Rpb24gPSBsaW5rc1tsaW5rXSB8fCBudWxsO1xyXG4gICAgaWYgKHR5cGVvZiAoYWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBhY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFVzZXIgcHJpdmF0ZSBkYXNoYm9hcmQgc2VjdGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIENvZGUgb24gcGFnZSByZWFkeVxyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAvKiBTaWRlYmFyICovXHJcbiAgdmFyIFxyXG4gICAgdG9nZ2xlID0gcmVxdWlyZSgnLi4vTEMvdG9nZ2xlJyksXHJcbiAgICBQcm92aWRlclBvc2l0aW9uID0gcmVxdWlyZSgnLi4vTEMvUHJvdmlkZXJQb3NpdGlvbicpO1xyXG4gIC8vIEF0dGFjaGluZyAnY2hhbmdlIHBvc2l0aW9uJyBhY3Rpb24gdG8gdGhlIHNpZGViYXIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIFxyXG4gICAgICAkdCA9ICQodGhpcyksXHJcbiAgICAgIHYgPSAkdC50ZXh0KCksXHJcbiAgICAgIG4gPSB0b2dnbGUodiwgWydvbicsICdvZmYnXSksXHJcbiAgICAgIHBvc2l0aW9uSWQgPSAkdC5jbG9zZXN0KCdbZGF0YS1wb3NpdGlvbi1pZF0nKS5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG5cclxuICAgIHZhciBwb3MgPSBuZXcgUHJvdmlkZXJQb3NpdGlvbihwb3NpdGlvbklkKTtcclxuICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICR0LnRleHQoc3RhdGUpO1xyXG4gICAgfSlcclxuICAgIC5jaGFuZ2VTdGF0ZShuKTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8qIFByb21vdGUgKi9cclxuICB2YXIgZ2VuZXJhdGVCb29rTm93QnV0dG9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uJyk7XHJcbiAgLy8gTGlzdGVuIG9uIERhc2hib2FyZFByb21vdGUgaW5zdGVhZCBvZiB0aGUgbW9yZSBjbG9zZSBjb250YWluZXIgRGFzaGJvYXJkQm9va05vd0J1dHRvblxyXG4gIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbi5vbignLkRhc2hib2FyZFByb21vdGUnKTsgLy8nLkRhc2hib2FyZEJvb2tOb3dCdXR0b24nXHJcblxyXG4gIC8qIFByaXZhY3kgKi9cclxuICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgcHJpdmFjeVNldHRpbmdzLm9uKCcuRGFzaGJvYXJkUHJpdmFjeScpO1xyXG5cclxuICAvKiBQYXltZW50cyAqL1xyXG4gIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgcGF5bWVudEFjY291bnQub24oJy5EYXNoYm9hcmRQYXltZW50cycpO1xyXG5cclxuICAvKiBQcm9maWxlIHBob3RvICovXHJcbiAgdmFyIGNoYW5nZVByb2ZpbGVQaG90byA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90bycpO1xyXG4gIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gIC8qIEFib3V0IHlvdSAvIGVkdWNhdGlvbiAqL1xyXG4gIHZhciBlZHVjYXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9lZHVjYXRpb25DcnVkbCcpO1xyXG4gIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gIC8qIEFib3V0IHlvdSAvIHZlcmlmaWNhdGlvbnMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQWN0aW9ucycpLm9uKCcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbicpLnNldHVwKCQoJy5EYXNoYm9hcmRZb3VyV29yayBmb3JtJykpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBwcmljaW5nICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9sb2NhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gbGljZW5zZXMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBwaG90b3MgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSScpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxufSk7Il19
