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
    $others = $crudlContainer.siblings().add($crudlContainer.find('.DashboardSection-page-section-introduction'));

  var crudl = initCrudl(crudlSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
  });

};

},{}],17:[function(require,module,exports){
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
      if (data && data.Code === 0)
        field.val(data.Result)[0].select();
      else
        onerror();
    }).fail(onerror);

    return false;
  });

};

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');

exports.on = function () {

  var workHoursList = availabilityCalendar.WorkHours.enableAll();
  
  $.each(workHoursList, function (i, v) {
    var workhours = this;

    // Setuping the WorkHours calendar data save when the form is submitted
    var form = workhours.$el.closest('form.ajax, fieldset.ajax');
    var field = form.find('[name=workhours]');
    if (field.length === 0)
      field = $('<input type="hidden" name="workhours" />').appendTo(form);
    form.on('presubmit', function () {
      field.val(JSON.stringify(workhours.data));
    });

    // Disabling calendar on field alltime
    form.find('[name=alltime]').on('change', function () {
      var $t = $(this),
        cl = workhours.classes.disabled;
      if (cl)
        workhours.$el.toggleClass(cl, $t.prop('checked'));
    });

  });
};

},{}],30:[function(require,module,exports){
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

  /* Availabilty */
  require('./dashboard/weeklySchedule').on();
  require('./dashboard/calendarSync').on();
  require('./dashboard/appointmentsCrudl').on('.DashboardAvailability');
});
},{"../LC/ProviderPosition":2,"../LC/toggle":14,"./dashboard/appointmentsCrudl":16,"./dashboard/calendarSync":17,"./dashboard/changeProfilePhoto":18,"./dashboard/educationCrudl":19,"./dashboard/generateBookNowButton":20,"./dashboard/licensesCrudl":21,"./dashboard/locationsCrudl":22,"./dashboard/managePhotosUI":23,"./dashboard/paymentAccount":24,"./dashboard/pricingCrudl":25,"./dashboard/privacySettings":26,"./dashboard/serviceAttributesValidation":27,"./dashboard/verificationsActions":28,"./dashboard/weeklySchedule":29}]},{},[30])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1Byb3ZpZGVyUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheENhbGxiYWNrcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcmVhdGVJZnJhbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zbW9vdGhCb3hCbG9jay5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy90b2dnbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvY2FsZW5kYXJTeW5jLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvY2hhbmdlUHJvZmlsZVBob3RvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbG9jYXRpb25zQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcHJpY2luZ0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbmV3LWRhc2hib2FyZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqIEltcGxlbWVudHMgYSBzaW1pbGFyIExjVXJsIG9iamVjdCBsaWtlIHRoZSBzZXJ2ZXItc2lkZSBvbmUsIGJhc2luZ1xyXG4gICAgaW4gdGhlIGluZm9ybWF0aW9uIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBhdCAnaHRtbCcgdGFnIGluIHRoZSBcclxuICAgICdkYXRhLWJhc2UtdXJsJyBhdHRyaWJ1dGUgKHRoYXRzIHZhbHVlIGlzIHRoZSBlcXVpdmFsZW50IGZvciBBcHBQYXRoKSxcclxuICAgIGFuZCB0aGUgbGFuZyBpbmZvcm1hdGlvbiBhdCAnZGF0YS1jdWx0dXJlJy5cclxuICAgIFRoZSByZXN0IG9mIFVSTHMgYXJlIGJ1aWx0IGZvbGxvd2luZyB0aGUgd2luZG93LmxvY2F0aW9uIGFuZCBzYW1lIHJ1bGVzXHJcbiAgICB0aGFuIGluIHRoZSBzZXJ2ZXItc2lkZSBvYmplY3QuXHJcbioqL1xyXG5cclxudmFyIGJhc2UgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdXJsJyksXHJcbiAgICBsYW5nID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyksXHJcbiAgICBsID0gd2luZG93LmxvY2F0aW9uLFxyXG4gICAgdXJsID0gbC5wcm90b2NvbCArICcvLycgKyBsLmhvc3Q7XHJcbi8vIGxvY2F0aW9uLmhvc3QgaW5jbHVkZXMgcG9ydCwgaWYgaXMgbm90IHRoZSBkZWZhdWx0LCB2cyBsb2NhdGlvbi5ob3N0bmFtZVxyXG5cclxuYmFzZSA9IGJhc2UgfHwgJy8nO1xyXG5cclxudmFyIExjVXJsID0ge1xyXG4gICAgU2l0ZVVybDogdXJsLFxyXG4gICAgQXBwUGF0aDogYmFzZSxcclxuICAgIEFwcFVybDogdXJsICsgYmFzZSxcclxuICAgIExhbmdJZDogbGFuZyxcclxuICAgIExhbmdQYXRoOiBiYXNlICsgbGFuZyArICcvJyxcclxuICAgIExhbmdVcmw6IHVybCArIGJhc2UgKyBsYW5nXHJcbn07XHJcbkxjVXJsLkxhbmdVcmwgPSB1cmwgKyBMY1VybC5MYW5nUGF0aDtcclxuTGNVcmwuSnNvblBhdGggPSBMY1VybC5MYW5nUGF0aCArICdKU09OLyc7XHJcbkxjVXJsLkpzb25VcmwgPSB1cmwgKyBMY1VybC5Kc29uUGF0aDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNVcmw7IiwiLyoqIFByb3ZpZGVyUG9zaXRpb24gY2xhc3NcclxuICBJdCBwcm92aWRlcyBtaW5pbXVuIGxpa2UtanF1ZXJ5IGV2ZW50IGxpc3RlbmVyc1xyXG4gIHdpdGggbWV0aG9kcyAnb24nIGFuZCAnb2ZmJywgYW5kIGludGVybmFsbHkgJ3RoaXMuZXZlbnRzJ1xyXG4gIGJlaW5nIGEgalF1ZXJ5LkNhbGxiYWNrcy5cclxuKiovXHJcbnZhciBcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgTGNVcmwgPSByZXF1aXJlKCcuL0xjVXJsJyksXHJcbiAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yXHJcbioqL1xyXG52YXIgUHJvdmlkZXJQb3NpdGlvbiA9IGZ1bmN0aW9uIChwb3NpdGlvbklkKSB7XHJcbiAgdGhpcy5wb3NpdGlvbklkID0gcG9zaXRpb25JZDtcclxuXHJcbiAgLy8gRXZlbnRzIHN1cHBvcnQgdGhyb3VnaCBqcXVlcnkuQ2FsbGJhY2tcclxuICB0aGlzLmV2ZW50cyA9ICQuQ2FsbGJhY2tzKCk7XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMuYWRkLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLnJlbW92ZS5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG59O1xyXG5cclxuLy8gVXNpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uIGFzIHByb3RvdHlwZVxyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZSA9IHtcclxuICBkZWNsaW5lZE1lc3NhZ2VDbGFzczogJ2luZm8nLFxyXG4gIGRlY2xpbmVkUG9wdXBDbGFzczogJ3Bvc2l0aW9uLXN0YXRlLWNoYW5nZScsXHJcbiAgc3RhdGVDaGFuZ2VkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkJyxcclxuICBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50OiAnc3RhdGUtY2hhbmdlZC1kZWNsaW5lZCdcclxufTtcclxuXHJcbi8qKiBjaGFuZ2VTdGF0ZSB0byB0aGUgb25lIGdpdmVuLCBpdCB3aWxsIHJhaXNlIGEgc3RhdGVDaGFuZ2VkRXZlbnQgb24gc3VjY2Vzc1xyXG4gIG9yIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQgb24gZXJyb3IuXHJcbiAgQHN0YXRlOiAnb24nIG9yICdvZmYnXHJcbioqL1xyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZS5jaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uIGNoYW5nZVBvc2l0aW9uU3RhdGUoc3RhdGUpIHtcclxuICB2YXIgcGFnZSA9IHN0YXRlID09ICdvbicgPyAnJFJlYWN0aXZhdGUnIDogJyREZWFjdGl2YXRlJztcclxuICB2YXIgJGQgPSAkKGRvY3VtZW50KTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIGN0eCA9IHsgZm9ybTogJGQsIGJveDogJGQgfTtcclxuICAkLmFqYXgoe1xyXG4gICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICdOZXdEYXNoYm9hcmQvUG9zaXRpb24vJyArIHBhZ2UgKyAnLz9Qb3NpdGlvbklEPScgKyB0aGlzLnBvc2l0aW9uSWQsXHJcbiAgICBjb250ZXh0OiBjdHgsXHJcbiAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAkZC5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSwgdCwgaiwgY3R4KSB7XHJcbiAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDEwMSkge1xyXG4gICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHN0YXRlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICQoJzxkaXYvPicpLmFkZENsYXNzKHRoYXQuZGVjbGluZWRNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihtc2csIHBvcywgdGhhdC5kZWNsaW5lZFBvcHVwQ2xhc3MsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogZmFsc2UsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgLy8gUHJvY2VzcyB0aGUgcmVzdWx0LCB0aGF0IGV2ZW50dWFsbHkgd2lsbCBjYWxsIGFqYXhTdWNjZXNzUG9zdFxyXG4gICAgICBhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJQb3NpdGlvbjsiLCIvKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgIHZhciBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiLmlzKCcuYWpheC1ib3gnKSA/IGpiLmNvbnRlbnRzKCkgOiBqYik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdHguYm94SXNDb250YWluZXIpIHtcclxuICAgICAgICAgICAgLy8gamIgaXMgY29udGVudCBvZiB0aGUgYm94IGNvbnRhaW5lcjpcclxuICAgICAgICAgICAgY3R4LmJveC5odG1sKGpiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBib3ggaXMgY29udGVudCB0aGF0IG11c3QgYmUgcmVwbGFjZWQgYnkgdGhlIG5ldyBjb250ZW50OlxyXG4gICAgICAgICAgICBjdHguYm94LnJlcGxhY2VXaXRoKGpiKTtcclxuICAgICAgICAgICAgLy8gYW5kIHJlZnJlc2ggdGhlIHJlZmVyZW5jZSB0byBib3ggd2l0aCB0aGUgbmV3IGVsZW1lbnRcclxuICAgICAgICAgICAgY3R4LmJveCA9IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSXQgc3VwcG9ydHMgbm9ybWFsIGFqYXggZm9ybXMgYW5kIHN1YmZvcm1zIHRocm91Z2ggZmllbGRzZXQuYWpheFxyXG4gICAgICAgIGlmIChjdHguYm94LmlzKCdmb3JtLmFqYXgnKSB8fCBjdHguYm94LmlzKCdmaWVsZHNldC5hamF4JykpXHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3g7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZm9ybS5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoY3R4LmZvcm0ubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZmllbGRzZXQuYWpheDplcSgwKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE1vdmUgZm9jdXMgdG8gdGhlIGVycm9ycyBhcHBlYXJlZCBvbiB0aGUgcGFnZSAoaWYgdGhlcmUgYXJlKTpcclxuICAgICAgICB2YXIgdmFsaWRhdGlvblN1bW1hcnkgPSBqYi5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0aW9uU3VtbWFyeS5sZW5ndGgpXHJcbiAgICAgICAgICBtb3ZlRm9jdXNUbyh2YWxpZGF0aW9uU3VtbWFyeSk7XHJcbiAgICAgICAgLy8gVE9ETzogSXQgc2VlbXMgdGhhdCBpdCByZXR1cm5zIGEgZG9jdW1lbnQtZnJhZ21lbnQgaW5zdGVhZCBvZiBhIGVsZW1lbnQgYWxyZWFkeSBpbiBkb2N1bWVudFxyXG4gICAgICAgIC8vIGZvciBjdHguZm9ybSAobWF5YmUgamIgdG9vPykgd2hlbiB1c2luZyAqIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCcgKiBcclxuICAgICAgICAvLyAobWF5YmUgb24gb3RoZXIgY2FzZXMgdG9vPykuXHJcbiAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBbamIsIGN0eC5mb3JtLCBqeF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgY3R4LmZvcm0uZGF0YSgnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnKSB8fCAnRG9uZSEnO1xyXG4gICAgY3R4LmJveC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgIGNzczogcG9wdXAuc3R5bGUocG9wdXAuc2l6ZSgnc21hbGwnKSlcclxuICAgIH0pKVxyXG4gICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IFxyXG4gICAgfSk7XHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYgY2xhc3M9XCJvay1nby1ib3hcIi8+Jyk7XHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3MtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5TdWNjZXNzTWVzc2FnZSkpO1xyXG4gICAgaWYgKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpXHJcbiAgICAgICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFkZGl0aW9uYWwtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSkpO1xyXG5cclxuICAgIHZhciBva0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIG9rLWFjdGlvbiBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI29rXCIvPicpLmFwcGVuZChkYXRhLk9rTGFiZWwpO1xyXG4gICAgdmFyIGdvQnRuID0gJyc7XHJcbiAgICBpZiAoZGF0YS5Hb1VSTCAmJiBkYXRhLkdvTGFiZWwpIHtcclxuICAgICAgICBnb0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIGdvLWFjdGlvblwiLz4nKS5hdHRyKCdocmVmJywgZGF0YS5Hb1VSTCkuYXBwZW5kKGRhdGEuR29MYWJlbCk7XHJcbiAgICAgICAgLy8gRm9yY2luZyB0aGUgJ2Nsb3NlLWFjdGlvbicgaW4gc3VjaCBhIHdheSB0aGF0IGZvciBpbnRlcm5hbCBsaW5rcyB0aGUgcG9wdXAgZ2V0cyBjbG9zZWQgaW4gYSBzYWZlIHdheTpcclxuICAgICAgICBnb0J0bi5jbGljayhmdW5jdGlvbiAoKSB7IG9rQnRuLmNsaWNrKCk7IGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhY3Rpb25zIGNsZWFyZml4XCIvPicpLmFwcGVuZChva0J0bikuYXBwZW5kKGdvQnRuKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjdHguYm94LCBudWxsLCB7XHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICAvLyBJZiBpcyBhIEpTT04gcmVzdWx0OlxyXG4gICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgaWYgKGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKj0gQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzc1xyXG4qIHRvIG5vdGlmeSB1c2VyIGFib3V0IGNoYW5nZXMgaW4gZm9ybXMsXHJcbiogdGFicywgdGhhdCB3aWxsIGJlIGxvc3QgaWYgZ28gYXdheSBmcm9tXHJcbiogdGhlIHBhZ2UuIEl0IGtub3dzIHdoZW4gYSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4qIGFuZCBzYXZlZCB0byBkaXNhYmxlIG5vdGlmaWNhdGlvbiwgYW5kIGdpdmVzXHJcbiogbWV0aG9kcyBmb3Igb3RoZXIgc2NyaXB0cyB0byBub3RpZnkgY2hhbmdlc1xyXG4qIG9yIHNhdmluZy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSB7XHJcbiAgICBjaGFuZ2VzTGlzdDoge30sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIHRhcmdldDogbnVsbCxcclxuICAgICAgICBnZW5lcmljQ2hhbmdlU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICBnZW5lcmljU3VibWl0U3VwcG9ydDogZmFsc2UsXHJcbiAgICAgICAgY2hhbmdlZEZvcm1DbGFzczogJ2hhcy1jaGFuZ2VzJyxcclxuICAgICAgICBjaGFuZ2VkRWxlbWVudENsYXNzOiAnY2hhbmdlZCcsXHJcbiAgICAgICAgbm90aWZ5Q2xhc3M6ICdub3RpZnktY2hhbmdlcydcclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vIFVzZXIgbm90aWZpY2F0aW9uIHRvIHByZXZlbnQgbG9zdCBjaGFuZ2VzIGRvbmVcclxuICAgICAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZXNOb3RpZmljYXRpb24ubm90aWZ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY0NoYW5nZVN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdjaGFuZ2UnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKSA6aW5wdXRbbmFtZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKCQodGhpcykuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNTdWJtaXRTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignc3VibWl0JywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSh0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbm90aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gQWRkIG5vdGlmaWNhdGlvbiBjbGFzcyB0byB0aGUgZG9jdW1lbnRcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5ub3RpZnlDbGFzcyk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBjaGFuZ2UgaW4gdGhlIHByb3BlcnR5IGxpc3QgcmV0dXJuaW5nIHRoZSBtZXNzYWdlOlxyXG4gICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFuZ2VzTGlzdClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpdE1lc3NhZ2UgfHwgKHRoaXMucXVpdE1lc3NhZ2UgPSAkKCcjbGNyZXMtcXVpdC13aXRob3V0LXNhdmUnKS50ZXh0KCkpIHx8ICcnO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbiAoZiwgZSkge1xyXG4gICAgICAgIGlmICghZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIHZhciBmbCA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gfHwgW107XHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShlKSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGUubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2hhbmdlKGYsIGVbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuID0gZTtcclxuICAgICAgICBpZiAodHlwZW9mIChlKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbiA9IGUubmFtZTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcmVhbGx5IHRoZXJlIHdhcyBhIGNoYW5nZSBjaGVja2luZyBkZWZhdWx0IGVsZW1lbnQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZS5kZWZhdWx0VmFsdWUpICE9ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuY2hlY2tlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5zZWxlY3RlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIGUudmFsdWUgPT0gZS5kZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIHdhcyBubyBjaGFuZ2UsIG5vIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgbWF5YmUgaXMgYSByZWdyZXNzaW9uIGZyb20gYSBjaGFuZ2UgYW5kIG5vdyB0aGUgb3JpZ2luYWwgdmFsdWUgYWdhaW5cclxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZW1vdmUgZnJvbSBjaGFuZ2VzIGxpc3QgZG9pbmcgcmVnaXN0ZXJTYXZlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2F2ZShmLCBbbl0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQoZSkuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobiBpbiBmbCkpXHJcbiAgICAgICAgICAgIGZsLnB1c2gobik7XHJcbiAgICAgICAgJChmKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50IG5hbWUgY2hhbmdlZCwgZm9ybSBlbGVtZW50IGNoYW5nZWQgKHRoaXMgY2FuIGJlIG51bGwpXHJcbiAgICAgICAgLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBbZiwgbiwgZV0pO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyU2F2ZTogZnVuY3Rpb24gKGYsIGVscykge1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pIHJldHVybjtcclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgICAgICQoZikucmVtb3ZlQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdO1xyXG4gICAgICAgICAgICAvLyBsaW5rIGVsZW1lbnRzIGZyb20gZWxzIHRvIGNsZWFuLXVwIGl0cyBjbGFzc2VzXHJcbiAgICAgICAgICAgIGVscyA9IHByZXZFbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscywgcl0pO1xyXG4gICAgICAgIHZhciBsY2huID0gdGhpcztcclxuICAgICAgICBpZiAoZWxzKSAkLmVhY2goZWxzLCBmdW5jdGlvbiAoKSB7ICQoJ1tuYW1lPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUodGhpcykgKyAnXCJdJykucmVtb3ZlQ2xhc3MobGNobi5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTsgfSk7XHJcbiAgICAgICAgcmV0dXJuIHByZXZFbHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNoYW5nZXNOb3RpZmljYXRpb247XHJcbn0iLCIvKiBVdGlsaXR5IHRvIGNyZWF0ZSBpZnJhbWUgd2l0aCBpbmplY3RlZCBodG1sL2NvbnRlbnQgaW5zdGVhZCBvZiBVUkwuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUlmcmFtZShjb250ZW50LCBzaXplKSB7XHJcbiAgICB2YXIgJGlmcmFtZSA9ICQoJzxpZnJhbWUgd2lkdGg9XCInICsgc2l6ZS53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgc2l6ZS5oZWlnaHQgKyAnXCIgc3R5bGU9XCJib3JkZXI6bm9uZTtcIj48L2lmcmFtZT4nKTtcclxuICAgIHZhciBpZnJhbWUgPSAkaWZyYW1lLmdldCgwKTtcclxuICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyByZWFkeVxyXG4gICAgdmFyIGlmcmFtZWxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBVc2luZyBpZnJhbWVsb2FkZWQgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcclxuICAgICAgICBpZiAoIWlmcmFtZWxvYWRlZCkge1xyXG4gICAgICAgICAgICBpZnJhbWVsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAkaWZyYW1lO1xyXG59O1xyXG5cclxuLyogUHV0cyBmdWxsIGh0bWwgaW5zaWRlIHRoZSBpZnJhbWUgZWxlbWVudCBwYXNzZWQgaW4gYSBzZWN1cmUgYW5kIGNvbXBsaWFudCBtb2RlICovXHJcbmZ1bmN0aW9uIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBodG1sKSB7XHJcbiAgICAvLyBwdXQgYWpheCBkYXRhIGluc2lkZSBpZnJhbWUgcmVwbGFjaW5nIGFsbCB0aGVpciBodG1sIGluIHNlY3VyZSBcclxuICAgIC8vIGNvbXBsaWFudCBtb2RlICgkLmh0bWwgZG9uJ3Qgd29ya3MgdG8gaW5qZWN0IDxodG1sPjxoZWFkPiBjb250ZW50KVxyXG5cclxuICAgIC8qIGRvY3VtZW50IEFQSSB2ZXJzaW9uIChwcm9ibGVtcyB3aXRoIElFLCBkb24ndCBleGVjdXRlIGlmcmFtZS1odG1sIHNjcmlwdHMpICovXHJcbiAgICAvKnZhciBpZnJhbWVEb2MgPVxyXG4gICAgLy8gVzNDIGNvbXBsaWFudDogbnMsIGZpcmVmb3gtZ2Vja28sIGNocm9tZS9zYWZhcmktd2Via2l0LCBvcGVyYSwgaWU5XHJcbiAgICBpZnJhbWUuY29udGVudERvY3VtZW50IHx8XHJcbiAgICAvLyBvbGQgSUUgKDUuNSspXHJcbiAgICAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgPyBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudCA6IG51bGwpIHx8XHJcbiAgICAvLyBmYWxsYmFjayAodmVyeSBvbGQgSUU/KVxyXG4gICAgZG9jdW1lbnQuZnJhbWVzW2lmcmFtZS5pZF0uZG9jdW1lbnQ7XHJcbiAgICBpZnJhbWVEb2Mub3BlbigpO1xyXG4gICAgaWZyYW1lRG9jLndyaXRlKGh0bWwpO1xyXG4gICAgaWZyYW1lRG9jLmNsb3NlKCk7Ki9cclxuXHJcbiAgICAvKiBqYXZhc2NyaXB0IFVSSSB2ZXJzaW9uICh3b3JrcyBmaW5lIGV2ZXJ5d2hlcmUhKSAqL1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuY29udGVudHMgPSBodG1sO1xyXG4gICAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0OndpbmRvd1tcImNvbnRlbnRzXCJdJztcclxuXHJcbiAgICAvLyBBYm91dCB0aGlzIHRlY2huaXF1ZSwgdGhpcyBodHRwOi8vc3BhcmVjeWNsZXMud29yZHByZXNzLmNvbS8yMDEyLzAzLzA4L2luamVjdC1jb250ZW50LWludG8tYS1uZXctaWZyYW1lL1xyXG59XHJcblxyXG4iLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsImZ1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCA1MDAsIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKVxyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeVxyXG59OyIsIi8qKiBBdmFpbGFiaWxpdHk6IGNhbGVuZGFyIGFwcG9pbnRtZW50cyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG5cclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGNydWRsU2VsZWN0b3IgPSAnLkRhc2hib2FyZEFwcG9pbnRtZW50cycsXHJcbiAgICAkY3J1ZGxDb250YWluZXIgPSAkYy5maW5kKGNydWRsU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRjcnVkbENvbnRhaW5lci5zaWJsaW5ncygpLmFkZCgkY3J1ZGxDb250YWluZXIuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGNydWRsU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBDYWxlbmRhciBTeW5jIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgY29udGFpbmVyU2VsZWN0b3IgPSBjb250YWluZXJTZWxlY3RvciB8fCAnLkRhc2hib2FyZENhbGVuZGFyU3luYyc7XHJcbiAgdmFyIGNvbnRhaW5lciA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgICBmaWVsZFNlbGVjdG9yID0gJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMtcHJpdmF0ZVVybEZpZWxkJyxcclxuICAgICAgYnV0dG9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1yZXNldC1hY3Rpb24nO1xyXG5cclxuICAvLyBTZWxlY3RpbmcgcHJpdmF0ZS11cmwgZmllbGQgdmFsdWUgb24gZm9jdXMgYW5kIGNsaWNrOlxyXG4gIGNvbnRhaW5lci5maW5kKGZpZWxkU2VsZWN0b3IpLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2VsZWN0KCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFJlc2V0aW5nIHByaXZhdGUtdXJsXHJcbiAgY29udGFpbmVyXHJcbiAgLm9uKCdjbGljaycsIGJ1dHRvblNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICB1cmwgPSB0LmF0dHIoJ2hyZWYnKSxcclxuICAgICAgZmllbGQgPSBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKTtcclxuXHJcbiAgICBmaWVsZC52YWwoJycpO1xyXG5cclxuICAgIGZ1bmN0aW9uIG9uZXJyb3IoKSB7XHJcbiAgICAgIGZpZWxkLnZhbChmaWVsZC5kYXRhKCdlcnJvci1tZXNzYWdlJykpO1xyXG4gICAgfVxyXG5cclxuICAgICQuZ2V0SlNPTih1cmwsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICBmaWVsZC52YWwoZGF0YS5SZXN1bHQpWzBdLnNlbGVjdCgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgb25lcnJvcigpO1xyXG4gICAgfSkuZmFpbChvbmVycm9yKTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG59O1xyXG4iLCIvKiogY2hhbmdlUHJvZmlsZVBob3RvLCBpdCB1c2VzICd1cGxvYWRlcicgdXNpbmcgaHRtbDUsIGFqYXggYW5kIGEgc3BlY2lmaWMgcGFnZVxyXG4gIHRvIG1hbmFnZSBzZXJ2ZXItc2lkZSB1cGxvYWQgb2YgYSBuZXcgdXNlciBwcm9maWxlIHBob3RvLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuLy8gVE9ETzogcmVpbXBsZW1lbnQgdGhpcyBhbmQgdGhlIHNlcnZlci1zaWRlIGZpbGUgdG8gYXZvaWQgaWZyYW1lcyBhbmQgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyxcclxuLy8gZGlyZWN0IEFQSSB1c2Ugd2l0aG91dCBpZnJhbWUtbm9ybWFsIHBvc3Qgc3VwcG9ydCAoY3VycmVudCBicm93c2VyIG1hdHJpeCBhbGxvdyB1cyB0aGlzPylcclxuLy8gVE9ETzogaW1wbGVtZW50IGFzIHJlYWwgbW9kdWxhciwgbmV4dCBhcmUgdGhlIGtub3dlZCBtb2R1bGVzIGluIHVzZSBidXQgbm90IGxvYWRpbmcgdGhhdCBhcmUgZXhwZWN0ZWRcclxuLy8gdG8gYmUgaW4gc2NvcGUgcmlnaHQgbm93IGJ1dCBtdXN0IGJlIHVzZWQgd2l0aCB0aGUgbmV4dCBjb2RlIHVuY29tbWVudGVkLlxyXG4vLyByZXF1aXJlKCd1cGxvYWRlcicpO1xyXG4vLyByZXF1aXJlKCdMY1VybCcpO1xyXG4vLyB2YXIgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJylcclxuLy8gdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gICRjLm9uKCdjbGljaycsICdbaHJlZj1cIiNjaGFuZ2UtcHJvZmlsZS1waG90b1wiXScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ05ld0Rhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8nLCB7IHdpZHRoOiAyNDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOT1RFOiBXZSBhcmUgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyBmcm9tIGhlcmUgYmVjYXVzZSB0aGUgc2VydmVyIHBhZ2UvaWZyYW1lIGV4cGVjdHMgdGhpc1xyXG4gIC8vIHRvIHdvcmsuXHJcbiAgLy8gVE9ETzogcmVmYWN0b3IgdG8gYXZvaWQgdGhpcyB3YXkuXHJcbiAgd2luZG93LnJlbG9hZFVzZXJQaG90byA9IGZ1bmN0aW9uIHJlbG9hZFVzZXJQaG90bygpIHtcclxuICAgICRjLmZpbmQoJy5EYXNoYm9hcmRQdWJsaWNCaW8tcGhvdG8gLmF2YXRhcicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc3JjID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xyXG4gICAgICAvLyBhdm9pZCBjYWNoZSB0aGlzIHRpbWVcclxuICAgICAgc3JjID0gc3JjICsgXCI/dj1cIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgd2luZG93LmRlbGV0ZVVzZXJQaG90byA9IGZ1bmN0aW9uIGRlbGV0ZVVzZXJQaG90bygpIHtcclxuICAgICQuYmxvY2tVSShMQy5ibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICB1cmw6IExjVXJsLkxhbmdVcmwgKyBcIk5ld0Rhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8/ZGVsZXRlPXRydWVcIixcclxuICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5pbmZvKGRhdGEuUmVzdWx0KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5lcnJvcihkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UpKTtcclxuICAgICAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IH0pO1xyXG4gICAgICAgIHJlbG9hZFVzZXJQaG90bygpO1xyXG4gICAgICB9LFxyXG4gICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxufTtcclxuIiwiLyoqIEVkdWNhdGlvbiBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vcmVxdWlyZSgnTEMvanF1ZXJ5Lnh0c2gnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgZWR1Y2F0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZEVkdWNhdGlvbicsXHJcbiAgICAkb3RoZXJzID0gJGMuZmluZChlZHVjYXRpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJykuc2libGluZ3MoKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGVkdWNhdGlvblNlbGVjdG9yKTtcclxuICAvL2NydWRsLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10gPSB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmFjdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKCkuYWRkKCRsaWNlbnNlcy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobGljZW5zZXNTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmFjdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIExvY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBtYXBSZWFkeSA9IHJlcXVpcmUoJ0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcbi8vIEluZGlyZWN0bHkgdXNlZDogcmVxdWlyZSgnTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBsb2NhdGlvbnNTZWxlY3RvciA9ICcuRGFzaGJvYXJkTG9jYXRpb25zJyxcclxuICAgICRsb2NhdGlvbnMgPSAkYy5maW5kKGxvY2F0aW9uc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkbG9jYXRpb25zLnNpYmxpbmdzKCkuYWRkKCRsb2NhdGlvbnMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxvY2F0aW9uc1NlbGVjdG9yKTtcclxuXHJcbiAgdmFyIGxvY2F0aW9uTWFwO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIC8vRm9yY2UgZXhlY3V0aW9uIG9mIHRoZSAnaGFzLWNvbmZpcm0nIHNjcmlwdFxyXG4gICAgJGVkaXRvci5maW5kKCdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JykuY2hhbmdlKCk7XHJcblxyXG4gICAgbG9jYXRpb25NYXAgPSBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgaWYgKGxvY2F0aW9uTWFwKVxyXG4gICAgICBtYXBSZWFkeS5yZWZyZXNoTWFwKGxvY2F0aW9uTWFwKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKiBMb2NhdGUgdXNlciBwb3NpdGlvbiBvciB0cmFuc2xhdGUgYWRkcmVzcyB0ZXh0IGludG8gYSBnZW9jb2RlIHVzaW5nXHJcbiAgYnJvd3NlciBhbmQgR29vZ2xlIE1hcHMgc2VydmljZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpIHtcclxuICB2YXIgbWFwO1xyXG4gIG1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBpZiB1c2VyIHNlbGVjdHMgb3Igd3JpdGVzIGEgcG9zaXRpb24gKHRvIG5vdCBvdmVyd3JpdGUgaXQgd2l0aCBhdXRvbWF0aWMgcG9zaXRpb25pbmcpXHJcbiAgICB2YXIgcG9zaXRpb25lZEJ5VXNlciA9IGZhbHNlO1xyXG4gICAgLy8gU29tZSBjb25mc1xyXG4gICAgdmFyIGRldGFpbGVkWm9vbUxldmVsID0gMTc7XHJcbiAgICB2YXIgZ2VuZXJhbFpvb21MZXZlbCA9IDk7XHJcbiAgICB2YXIgZm91bmRMb2NhdGlvbnMgPSB7XHJcbiAgICAgIGJ5VXNlcjogbnVsbCxcclxuICAgICAgYnlHZW9sb2NhdGlvbjogbnVsbCxcclxuICAgICAgYnlHZW9jb2RlOiBudWxsLFxyXG4gICAgICBvcmlnaW5hbDogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbCA9ICRlZGl0b3IuZmluZCgnLmxvY2F0aW9uLW1hcCcpO1xyXG4gICAgdmFyIG0gPSBsLmZpbmQoJy5tYXAtc2VsZWN0b3IgPiAuZ29vZ2xlLW1hcCcpLmdldCgwKTtcclxuICAgIHZhciAkbGF0ID0gbC5maW5kKCdbbmFtZT1sYXRpdHVkZV0nKTtcclxuICAgIHZhciAkbG5nID0gbC5maW5kKCdbbmFtZT1sb25naXR1ZGVdJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgcG9zaXRpb24gY29vcmRpbmF0ZXNcclxuICAgIHZhciBteUxhdGxuZztcclxuICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBfbGF0X3ZhbHVlID0gJGxhdC52YWwoKSwgX2xuZ192YWx1ZSA9ICRsbmcudmFsKCk7XHJcbiAgICAgIGlmIChfbGF0X3ZhbHVlICYmIF9sbmdfdmFsdWUpIHtcclxuICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoJGxhdC52YWwoKSwgJGxuZy52YWwoKSk7XHJcbiAgICAgICAgLy8gV2UgY29uc2lkZXIgYXMgJ3Bvc2l0aW9uZWQgYnkgdXNlcicgd2hlbiB0aGVyZSB3YXMgYSBzYXZlZCB2YWx1ZSBmb3IgdGhlIHBvc2l0aW9uIGNvb3JkaW5hdGVzICh3ZSBhcmUgZWRpdGluZyBhIGxvY2F0aW9uKVxyXG4gICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSAobXlMYXRsbmcubGF0KCkgIT09IDAgJiYgbXlMYXRsbmcubG5nKCkgIT09IDApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIERlZmF1bHQgcG9zaXRpb24gd2hlbiB0aGVyZSBhcmUgbm90IG9uZSAoU2FuIEZyYW5jaXNjbyBqdXN0IG5vdyk6XHJcbiAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM3Ljc1MzM0NDM5MjI2Mjk4LCAtMTIyLjQyNTQ2MDYwMzUxNTYpO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgLy8gUmVtZW1iZXIgb3JpZ2luYWwgZm9ybSBsb2NhdGlvblxyXG4gICAgZm91bmRMb2NhdGlvbnMub3JpZ2luYWwgPSBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBteUxhdGxuZztcclxuXHJcbiAgICAvLyBDcmVhdGUgbWFwXHJcbiAgICB2YXIgbWFwT3B0aW9ucyA9IHtcclxuICAgICAgem9vbTogKHBvc2l0aW9uZWRCeVVzZXIgPyBkZXRhaWxlZFpvb21MZXZlbCA6IGdlbmVyYWxab29tTGV2ZWwpLCAvLyBCZXN0IGRldGFpbCB3aGVuIHdlIGFscmVhZHkgaGFkIGEgbG9jYXRpb25cclxuICAgICAgY2VudGVyOiBteUxhdGxuZyxcclxuICAgICAgbWFwVHlwZUlkOiBnb29nbGUubWFwcy5NYXBUeXBlSWQuUk9BRE1BUFxyXG4gICAgfTtcclxuICAgIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobSwgbWFwT3B0aW9ucyk7XHJcbiAgICAvLyBDcmVhdGUgdGhlIHBvc2l0aW9uIG1hcmtlclxyXG4gICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogbXlMYXRsbmcsXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBkcmFnZ2FibGU6IGZhbHNlLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QXHJcbiAgICB9KTtcclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2xpY2tzIG1hcCBvciBtb3ZlIHRoZSBtYXJrZXIgdG8gbW92ZSBtYXJrZXIgb3Igc2V0IHBvc2l0aW9uIGluIHRoZSBmb3JtXHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdkcmFnZW5kJywgc2F2ZUNvb3JkaW5hdGVzKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmICghbWFya2VyLmdldERyYWdnYWJsZSgpKSByZXR1cm47XHJcbiAgICAgIHBsYWNlTWFya2VyKGV2ZW50LmxhdExuZyk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBldmVudC5sYXRMbmc7XHJcbiAgICB9KTtcclxuICAgIGZ1bmN0aW9uIHBsYWNlTWFya2VyKGxhdGxuZywgZG96b29tLCBhdXRvc2F2ZSkge1xyXG4gICAgICBtYXJrZXIuc2V0UG9zaXRpb24obGF0bG5nKTtcclxuICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgbWFwLnBhblRvKGxhdGxuZyk7XHJcbiAgICAgIHNhdmVDb29yZGluYXRlcyhhdXRvc2F2ZSk7XHJcbiAgICAgIGlmIChkb3pvb20pXHJcbiAgICAgIC8vIFNldCB6b29tIHRvIHNvbWV0aGluZyBtb3JlIGRldGFpbGVkXHJcbiAgICAgICAgbWFwLnNldFpvb20oZGV0YWlsZWRab29tTGV2ZWwpO1xyXG4gICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gc2F2ZUNvb3JkaW5hdGVzKGluRm9ybSkge1xyXG4gICAgICB2YXIgbGF0TG5nID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBsYXRMbmc7XHJcbiAgICAgIGlmIChpbkZvcm0gPT09IHRydWUpIHtcclxuICAgICAgICAkbGF0LnZhbChsYXRMbmcubGF0KCkpOyAvL21hcmtlci5wb3NpdGlvbi5YYVxyXG4gICAgICAgICRsbmcudmFsKGxhdExuZy5sbmcoKSk7IC8vbWFya2VyLnBvc2l0aW9uLllhXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2hhbmdlcyBmb3JtIGNvb3JkaW5hdGVzIHZhbHVlcyB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgJGxhdC5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICRsbmcuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICBmdW5jdGlvbiB1cGRhdGVNYXBNYXJrZXIoKSB7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICB2YXIgbmV3UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgLy8gTW92ZSBtYXJrZXJcclxuICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ld1Bvcyk7XHJcbiAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgIG1hcC5wYW5UbyhuZXdQb3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qPT09PT09PT09PT09PT09PT09PVxyXG4gICAgKiBBVVRPIFBPU0lUSU9OSU5HXHJcbiAgICAqL1xyXG4gICAgZnVuY3Rpb24gdXNlR2VvbG9jYXRpb24oZm9yY2UsIGF1dG9zYXZlKSB7XHJcbiAgICAgIHZhciBvdmVycmlkZSA9IGZvcmNlIHx8ICFwb3NpdGlvbmVkQnlVc2VyO1xyXG4gICAgICAvLyBVc2UgYnJvd3NlciBnZW9sb2NhdGlvbiBzdXBwb3J0IHRvIGdldCBhbiBhdXRvbWF0aWMgbG9jYXRpb24gaWYgdGhlcmUgaXMgbm8gYSBsb2NhdGlvbiBzZWxlY3RlZCBieSB1c2VyXHJcbiAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgZ2VvbG9jYXRpb24uXHJcbiAgICAgIGlmIChvdmVycmlkZSAmJiBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbG9jYXRpb24gbWFya2VyIHRoYXQgd2Ugd2lsbCBiZSB1c2luZ1xyXG4gICAgICAgIC8vIG9uIHRoZSBtYXAuIExldCdzIHN0b3JlIGEgcmVmZXJlbmNlIHRvIGl0IGhlcmUgc29cclxuICAgICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1cGRhdGVkIGluIHNldmVyYWwgcGxhY2VzLlxyXG4gICAgICAgIHZhciBsb2NhdGlvbk1hcmtlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgbG9jYXRpb24gb2YgdGhlIHVzZXIncyBicm93c2VyIHVzaW5nIHRoZVxyXG4gICAgICAgIC8vIG5hdGl2ZSBnZW9sb2NhdGlvbiBzZXJ2aWNlLiBXaGVuIHdlIGludm9rZSB0aGlzIG1ldGhvZFxyXG4gICAgICAgIC8vIG9ubHkgdGhlIGZpcnN0IGNhbGxiYWNrIGlzIHJlcXVpZWQuIFRoZSBzZWNvbmRcclxuICAgICAgICAvLyBjYWxsYmFjayAtIHRoZSBlcnJvciBoYW5kbGVyIC0gYW5kIHRoZSB0aGlyZFxyXG4gICAgICAgIC8vIGFyZ3VtZW50IC0gb3VyIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyAtIGFyZSBvcHRpb25hbC5cclxuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKFxyXG4gICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgbG9jYXRpb24uXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgYnVnIGluIEZpcmVGb3ggd2hlcmUgdGhpcyBnZXRzXHJcbiAgICAgICAgICAgIC8vIGludm9rZWQgbW9yZSB0aGFuIG9uY2Ugd2l0aCBhIGNhY2hlZCByZXN1bHQuXHJcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk1hcmtlcikge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXIgdG8gdGhlIG1hcCB1c2luZyB0aGUgcG9zaXRpb24sIG9ubHkgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coXCJTb21ldGhpbmcgd2VudCB3cm9uZzogXCIsIGVycm9yKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpbWVvdXQ6ICg1ICogMTAwMCksXHJcbiAgICAgICAgICAgIG1heGltdW1BZ2U6ICgxMDAwICogNjAgKiAxNSksXHJcbiAgICAgICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeTogdHJ1ZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG5cclxuICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFza2VkIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIsXHJcbiAgICAgICAgLy8gbGV0J3Mgd2F0Y2ggdGhlIHBvc2l0aW9uIHRvIHNlZSBpZiBpdCB1cGRhdGVzLiBUaGlzXHJcbiAgICAgICAgLy8gY2FuIGhhcHBlbiBpZiB0aGUgdXNlciBwaHlzaWNhbGx5IG1vdmVzLCBvZiBpZiBtb3JlXHJcbiAgICAgICAgLy8gYWNjdXJhdGUgbG9jYXRpb24gaW5mb3JtYXRpb24gaGFzIGJlZW4gZm91bmQgKGV4LlxyXG4gICAgICAgIC8vIEdQUyB2cy4gSVAgYWRkcmVzcykuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBOT1RFOiBUaGlzIGFjdHMgbXVjaCBsaWtlIHRoZSBuYXRpdmUgc2V0SW50ZXJ2YWwoKSxcclxuICAgICAgICAvLyBpbnZva2luZyB0aGUgZ2l2ZW4gY2FsbGJhY2sgYSBudW1iZXIgb2YgdGltZXMgdG9cclxuICAgICAgICAvLyBtb25pdG9yIHRoZSBwb3NpdGlvbi4gQXMgc3VjaCwgaXQgcmV0dXJucyBhIFwidGltZXIgSURcIlxyXG4gICAgICAgIC8vIHRoYXQgY2FuIGJlIHVzZWQgdG8gbGF0ZXIgc3RvcCB0aGUgbW9uaXRvcmluZy5cclxuICAgICAgICB2YXIgcG9zaXRpb25UaW1lciA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIGFnYWluIHRvIHRoZSBuZXcgb3IgYWNjdXJhdGVkIHBvc2l0aW9uLCBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25NYXJrZXIgPSBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgdXBkYXRlZCB3aXRoaW4gNSBtaW51dGVzLCBzdG9wXHJcbiAgICAgICAgLy8gbW9uaXRvcmluZyB0aGUgcG9zaXRpb24gZm9yIGNoYW5nZXMuXHJcbiAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBwb3NpdGlvbiB3YXRjaGVyLlxyXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAoMTAwMCAqIDYwICogNSlcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICB9IC8vIEVuZHMgZ2VvbG9jYXRpb24gcG9zaXRpb25cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHVzZUdtYXBzR2VvY29kZShpbml0aWFsTG9va3VwLCBhdXRvc2F2ZSkge1xyXG4gICAgICB2YXIgZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcclxuXHJcbiAgICAgIC8vIGxvb2t1cCBvbiBhZGRyZXNzIGZpZWxkcyBjaGFuZ2VzIHdpdGggY29tcGxldGUgaW5mb3JtYXRpb25cclxuICAgICAgdmFyICRmb3JtID0gJGVkaXRvci5maW5kKCcuY3J1ZGwtZm9ybScpLCBmb3JtID0gJGZvcm0uZ2V0KDApO1xyXG4gICAgICBmdW5jdGlvbiBnZXRGb3JtQWRkcmVzcygpIHtcclxuICAgICAgICB2YXIgYWQgPSBbXTtcclxuICAgICAgICBmdW5jdGlvbiBhZGQoZmllbGQpIHtcclxuICAgICAgICAgIGlmIChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSkgYWQucHVzaChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFkZCgnYWRkcmVzc2xpbmUxJyk7XHJcbiAgICAgICAgYWRkKCdhZGRyZXNzbGluZTInKTtcclxuICAgICAgICBhZGQoJ2NpdHknKTtcclxuICAgICAgICBhZGQoJ3Bvc3RhbGNvZGUnKTtcclxuICAgICAgICB2YXIgcyA9IGZvcm0uZWxlbWVudHMuc3RhdGU7XHJcbiAgICAgICAgaWYgKHMudmFsdWUpIGFkLnB1c2gocy5vcHRpb25zW3Muc2VsZWN0ZWRJbmRleF0ubGFiZWwpO1xyXG4gICAgICAgIGFkLnB1c2goJ1VTQScpO1xyXG4gICAgICAgIC8vIE1pbmltdW0gZm9yIHZhbGlkIGFkZHJlc3M6IDQgZmllbGRzIGZpbGxlZCBvdXRcclxuICAgICAgICByZXR1cm4gYWQubGVuZ3RoID49IDUgPyBhZC5qb2luKCcsICcpIDogbnVsbDtcclxuICAgICAgfVxyXG4gICAgICAkZm9ybS5vbignY2hhbmdlJywgJ1tuYW1lPWFkZHJlc3NsaW5lMV0sIFtuYW1lPWFkZHJlc3NsaW5lMl0sIFtuYW1lPWNpdHldLCBbbmFtZT1wb3N0YWxjb2RlXSwgW25hbWU9c3RhdGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICBpZiAoYWRkcmVzcylcclxuICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgZmFsc2UpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWwgbG9va3VwXHJcbiAgICAgIGlmIChpbml0aWFsTG9va3VwKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBvdmVycmlkZSkge1xyXG4gICAgICAgIGdlb2NvZGVyLmdlb2NvZGUoeyAnYWRkcmVzcyc6IGFkZHJlc3MgfSwgZnVuY3Rpb24gKHJlc3VsdHMsIHN0YXR1cykge1xyXG4gICAgICAgICAgaWYgKHN0YXR1cyA9PSBnb29nbGUubWFwcy5HZW9jb2RlclN0YXR1cy5PSykge1xyXG4gICAgICAgICAgICB2YXIgbGF0TG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbjtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oJ0dlb2NvZGUgcmV0cmlldmVkOiAnICsgbGF0TG5nICsgJyBmb3IgYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSA9IGxhdExuZztcclxuXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignR2VvY29kZSB3YXMgbm90IHN1Y2Nlc3NmdWwgZm9yIHRoZSBmb2xsb3dpbmcgcmVhc29uOiAnICsgc3RhdHVzICsgJyBvbiBhZGRyZXNzIFwiJyArIGFkZHJlc3MgKyAnXCInKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4ZWN1dGluZyBhdXRvIHBvc2l0aW9uaW5nIChjaGFuZ2VkIHRvIGF1dG9zYXZlOnRydWUgdG8gYWxsIHRpbWUgc2F2ZSB0aGUgbG9jYXRpb24pOlxyXG4gICAgLy91c2VHZW9sb2NhdGlvbih0cnVlLCBmYWxzZSk7XHJcbiAgICB1c2VHbWFwc0dlb2NvZGUoZmFsc2UsIHRydWUpO1xyXG5cclxuICAgIC8vIExpbmsgb3B0aW9ucyBsaW5rczpcclxuICAgIGwub24oJ2NsaWNrJywgJy5vcHRpb25zIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKS5zdWJzdHIoMSk7XHJcbiAgICAgIHN3aXRjaCAodGFyZ2V0KSB7XHJcbiAgICAgICAgY2FzZSAnZ2VvbG9jYXRpb24nOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24sIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1c2VHZW9sb2NhdGlvbih0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2dlb2NvZGUnOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSlcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXNlR21hcHNHZW9jb2RlKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnY29uZmlybSc6XHJcbiAgICAgICAgICBzYXZlQ29vcmRpbmF0ZXModHJ1ZSk7XHJcbiAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGZhbHNlKTtcclxuICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgbC5maW5kKCcuZ3BzLWxhdCwgLmdwcy1sbmcsIC5hZHZpY2UsIC5maW5kLWFkZHJlc3MtZ2VvY29kZScpLmhpZGUoJ2Zhc3QnKTtcclxuICAgICAgICAgIHZhciBlZGl0ID0gbC5maW5kKCcuZWRpdC1hY3Rpb24nKTtcclxuICAgICAgICAgIGVkaXQudGV4dChlZGl0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdlZGl0Y29vcmRpbmF0ZXMnOlxyXG4gICAgICAgICAgdmFyIGEgPSBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJyk7XHJcbiAgICAgICAgICB2YXIgYiA9ICFhLmlzKCc6dmlzaWJsZScpO1xyXG4gICAgICAgICAgbWFya2VyLnNldERyYWdnYWJsZShiKTtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAkdC5kYXRhKCdlZGl0LWxhYmVsJywgJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdjYW5jZWwtbGFiZWwnKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgbG9jYXRpb246XHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhLnRvZ2dsZSgnZmFzdCcpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbWFwO1xyXG59IiwiLyoqIFVJIGxvZ2ljIHRvIG1hbmFnZSBwcm92aWRlciBwaG90b3MgKHlvdXItd29yay9waG90b3MpLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkUGhvdG9zJztcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgc2V0dXBDcnVkbERlbGVnYXRlcygkYyk7XHJcblxyXG4gIGluaXRFbGVtZW50cygkYyk7XHJcblxyXG4gIC8vIEFueSB0aW1lIHRoYXQgdGhlIGZvcm0gY29udGVudCBodG1sIGlzIHJlbG9hZGVkLFxyXG4gIC8vIHJlLWluaXRpYWxpemUgZWxlbWVudHNcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgaW5pdEVsZW1lbnRzKCRjKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qIFNldHVwIHRoZSBjb2RlIHRoYXQgd29ya3Mgb24gdGhlIGRpZmZlcmVudCBDUlVETCBhY3Rpb25zIG9uIHRoZSBwaG90b3MuXHJcbiAgQWxsIHRoaXMgYXJlIGRlbGVnYXRlcywgb25seSBuZWVkIHRvIGJlIHNldHVwIG9uY2Ugb24gdGhlIHBhZ2VcclxuICAoaWYgdGhlIGNvbnRhaW5lciAkYyBpcyBub3QgcmVwbGFjZWQsIG9ubHkgdGhlIGNvbnRlbnRzLCBkb2Vzbid0IG5lZWQgdG8gY2FsbCBhZ2FpbiB0aGlzKS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBDcnVkbERlbGVnYXRlcygkYykge1xyXG4gICRjXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtdG9vbHMtdXBsb2FkID4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBwb3NJRCA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2lucHV0W25hbWU9cG9zaXRpb25JRF0nKS52YWwoKTtcclxuICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ05ld0Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgcG9zSUQsICdzbWFsbCcpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZ2FsbGVyeSBsaSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmb3JtID0gJHQuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcblxyXG4gICAgLy8gSWYgdGhlIGZvcm0gaGFkIGNoYW5nZXMsIHN1Ym1pdCBpdCB0byBzYXZlIGl0OlxyXG4gICAgLy8gUmVtb3ZlIHRoZSBmb2N1cyBvZiBjdXJyZW50IGZvY3VzZWQgZWxlbWVudCB0byBhdm9pZCBcclxuICAgIC8vIGNoYW5nZWQgZWxlbWVudHMgbm90IG5vdGlmeSB0aGUgY2hhbmdlIHN0YXR1c1xyXG4gICAgJCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgdmFyIGYgPSBlZGl0UGFuZWwuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG4gICAgdmFyIGNoYW5nZWRFbHMgPSBmLmZpbmQoJy5jaGFuZ2VkOmlucHV0JykubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLm5hbWU7IH0pLmdldCgpO1xyXG4gICAgaWYgKGNoYW5nZWRFbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAvLyBNYXJrIGNoYW5nZXMgYXJlIHNhdmVkXHJcbiAgICAgIGYub25lKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIGNoYW5nZWRFbHMpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEZvcmNlIGEgZmllbGRzZXQuYWpheCBzdWJtaXQ6XHJcbiAgICAgIGYuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIH1cclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbChmb3JtKTtcclxuICAgIC8vIFNldCB0aGlzIHBob3RvIGFzIHNlbGVjdGVkXHJcbiAgICB2YXIgc2VsZWN0ZWQgPSAkdC5jbG9zZXN0KCdsaScpO1xyXG4gICAgc2VsZWN0ZWQuYWRkQ2xhc3MoJ3NlbGVjdGVkJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgIC8vdmFyIHNlbGVjdGVkID0gJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpLnNlbGVjdGVkJywgZm9ybSk7XHJcbiAgICBpZiAoc2VsZWN0ZWQgIT09IG51bGwgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgIC8vIE1vdmluZyBzZWxlY3RlZCB0byBiZSBlZGl0IHBhbmVsXHJcbiAgICAgIHZhciBwaG90b0lEID0gc2VsZWN0ZWQuYXR0cignaWQnKS5tYXRjaCgvXlVzZXJQaG90by0oXFxkKykkLylbMV07XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsIHNlbEltZy5hdHRyKCdzcmMnKSk7XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbChzZWxJbWcuYXR0cignYWx0JykpO1xyXG4gICAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dW3ZhbHVlPScgKyBpc1ByaW1hcnlWYWx1ZSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZWRpdC1kZWxldGUgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBlZGl0UGFuZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAvLyBDaGFuZ2UgdGhlIGZpZWxkIGRlbGV0ZS1waG90byB0byBUcnVlIGFuZCBzZW5kIGZvcm0gZm9yIGFuIGFqYXggcmVxdWVzdCB3aXRoXHJcbiAgICAvLyBzZXJ2ZXIgZGVsZXRlIHRhc2sgYW5kIGNvbnRlbnQgcmVsb2FkXHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9ZGVsZXRlLXBob3RvXScpLnZhbCgnVHJ1ZScpO1xyXG4gICAgLy8gRm9yY2UgYSBmaWVsZHNldC5hamF4IHN1Ym1pdDpcclxuICAgIGVkaXRQYW5lbC5jbG9zZXN0KCdmaWVsZHNldC5hamF4JykuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuLyogSW5pdGlhbGl6ZSB0aGUgcGhvdG9zIGVsZW1lbnRzIHRvIGJlIHNvcnRhYmxlcywgc2V0IHRoZSBwcmltYXJ5IHBob3RvXHJcbiAgaW4gdGhlIGhpZ2hsaWdodGVkIGFyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgJ2RlbGV0ZSBwaG90bycgZmxhZy5cclxuICBUaGlzIGlzIHJlcXVpcmVkIHRvIGJlIGV4ZWN1dGVkIGFueSB0aW1lIHRoZSBlbGVtZW50cyBodG1sIGlzIHJlcGxhY2VkXHJcbiAgYmVjYXVzZSBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gZWxlbWVudHMuXHJcbiovXHJcbmZ1bmN0aW9uIGluaXRFbGVtZW50cyhmb3JtKSB7XHJcbiAgLy8gUHJlcGFyZSBzb3J0YWJsZSBzY3JpcHRcclxuICAkKFwiLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbFwiLCBmb3JtKS5zb3J0YWJsZSh7XHJcbiAgICBwbGFjZWhvbGRlcjogXCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBHZXQgcGhvdG8gb3JkZXIsIGEgY29tbWEgc2VwYXJhdGVkIHZhbHVlIG9mIGl0ZW1zIElEc1xyXG4gICAgICB2YXIgb3JkZXIgPSAkKHRoaXMpLnNvcnRhYmxlKFwidG9BcnJheVwiKS50b1N0cmluZygpO1xyXG4gICAgICAvLyBTZXQgb3JkZXIgaW4gdGhlIGZvcm0gZWxlbWVudCwgdG8gYmUgc2VudCBsYXRlciB3aXRoIHRoZSBmb3JtXHJcbiAgICAgICQodGhpcykuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpLmZpbmQoJ1tuYW1lPWdhbGxlcnktb3JkZXJdJykudmFsKG9yZGVyKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gU2V0IHByaW1hcnkgcGhvdG8gdG8gYmUgZWRpdGVkXHJcbiAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcbiAgLy8gTG9vayBmb3IgYSBzZWxlY3RlZCBwaG90byBpbiB0aGUgbGlzdFxyXG4gIHZhciBzZWxlY3RlZCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaS5zZWxlY3RlZCcsIGZvcm0pO1xyXG4gIGlmIChzZWxlY3RlZCAhPT0gbnVsbCAmJiBzZWxlY3RlZC5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAvLyBNb3Zpbmcgc2VsZWN0ZWQgdG8gYmUgZWRpdCBwYW5lbFxyXG4gICAgdmFyIHBob3RvSUQgPSBzZWxlY3RlZC5hdHRyKCdpZCcpLm1hdGNoKC9eVXNlclBob3RvLShcXGQrKSQvKVsxXTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCBzZWxJbWcuYXR0cignc3JjJykpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKHNlbEltZy5hdHRyKCdhbHQnKSk7XHJcbiAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b11bdmFsdWU9JyArIGlzUHJpbWFyeVZhbHVlICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChmb3JtLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXBob3RvcycpLCBlZGl0UGFuZWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc21vb3RoQm94QmxvY2sub3Blbihmb3JtLmZpbmQoJy5uby1wcmltYXJ5LXBob3RvJyksIGVkaXRQYW5lbCk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIG1hbnVhbGx5IHRvIGF2b2lkIGJyb3dzZXIgbWVtb3J5IGJyZWFraW5nIHRoaW5nc1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKCcnKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgnJyk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gIH1cclxuICAvLyBSZXNldCBkZWxldGUgb3B0aW9uXHJcbiAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWRlbGV0ZS1waG90b10nKS52YWwoJ0ZhbHNlJyk7XHJcblxyXG59XHJcbiIsIi8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBmb3JtYXR0ZXJzIG9uIHBhZ2UtcmVhZHkuLlxyXG4gIHZhciBmaW5pdCA9IGZ1bmN0aW9uICgpIHsgaW5pdEZvcm1hdHRlcnMoJGMpOyB9O1xyXG4gICQoZmluaXQpO1xyXG4gIC8vIGFuZCBhbnkgYWpheC1wb3N0IG9mIHRoZSBmb3JtIHRoYXQgcmV0dXJucyBuZXcgaHRtbDpcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZmluaXQpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgdGhlIGZpZWxkIGZvcm1hdHRlcnMgcmVxdWlyZWQgYnkgdGhlIHBheW1lbnQtYWNjb3VudC1mb3JtLCBiYXNlZFxyXG4gIG9uIHRoZSBmaWVsZHMgbmFtZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0Rm9ybWF0dGVycygkY29udGFpbmVyKSB7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImJpcnRoZGF0ZVwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5fX0ve3s5OX19L3t7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwic3NuXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTk5fX0te3s5OX19LXt7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxufSIsIi8qKiBQcmljaW5nIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnTEMvVGltZVNwYW4nKTtcclxucmVxdWlyZSgnTEMvVGltZVNwYW5FeHRyYScpLnBsdWdJbihUaW1lU3Bhbik7XHJcbnZhciB1cGRhdGVUb29sdGlwcyA9IHJlcXVpcmUoJ0xDL3Rvb2x0aXBzJykudXBkYXRlVG9vbHRpcHM7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgcHJpY2luZ1NlbGVjdG9yID0gJy5EYXNoYm9hcmRQcmljaW5nJyxcclxuICAgICRwcmljaW5nID0gJGMuZmluZChwcmljaW5nU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRwcmljaW5nLnNpYmxpbmdzKCkuYWRkKCRwcmljaW5nLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChwcmljaW5nU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYWN0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcik7XHJcbiAgICBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcik7XHJcbiAgICB1cGRhdGVUb29sdGlwcygpO1xyXG4gICAgc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpO1xyXG5cclxuICB9KTtcclxufTtcclxuXHJcbi8qIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCBvbiAnbm90IHRvIHN0YXRlIHByaWNlIHJhdGUnLCB1cGRhdGluZyByZWxhdGVkIHByaWNlIHJhdGUgZmllbGRzLlxyXG4gIEl0cyBzZXR1cGVkIHBlciBlZGl0b3IgaW5zdGFuY2UsIG5vdCBhcyBhbiBldmVudCBkZWxlZ2F0ZS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcikge1xyXG4gIHZhciBcclxuICAgIHByID0gJGVkaXRvci5maW5kKCdbbmFtZT1wcmljZS1yYXRlXSxbbmFtZT1wcmljZS1yYXRlLXVuaXRdJyksXHJcbiAgICBucHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPW5vLXByaWNlLXJhdGVdJyk7XHJcbiAgbnByLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBwci5wcm9wKCdkaXNhYmxlZCcsIG5wci5wcm9wKCdjaGVja2VkJykpO1xyXG4gIH0pO1xyXG4gIC8vIEluaXRpYWwgc3RhdGU6XHJcbiAgbnByLmNoYW5nZSgpO1xyXG59XHJcblxyXG4vKiogU2V0dXAgdGhlIFVJIFNsaWRlcnMgb24gdGhlIGVkaXRvci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKSB7XHJcblxyXG4gIC8qIEhvdXNlZWtlZXBlciBwcmljaW5nICovXHJcbiAgZnVuY3Rpb24gdXBkYXRlQXZlcmFnZSgkYywgbWludXRlcykge1xyXG4gICAgJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpLnZhbChtaW51dGVzKTtcclxuICAgIG1pbnV0ZXMgPSBwYXJzZUludChtaW51dGVzKTtcclxuICAgICRjLmZpbmQoJy5wcmV2aWV3IC50aW1lJykudGV4dChUaW1lU3Bhbi5mcm9tTWludXRlcyhtaW51dGVzKS50b1NtYXJ0U3RyaW5nKCkpO1xyXG4gIH1cclxuXHJcbiAgJGVkaXRvci5maW5kKFwiLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZS1zbGlkZXJcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJGMgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXNsaWRlci12YWx1ZV0nKTtcclxuICAgIHZhciBhdmVyYWdlID0gJGMuZGF0YSgnc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgIHN0ZXAgPSAkYy5kYXRhKCdzbGlkZXItc3RlcCcpIHx8IDE7XHJcbiAgICBpZiAoIWF2ZXJhZ2UpIHJldHVybjtcclxuICAgIHZhciBzZXR1cCA9IHtcclxuICAgICAgcmFuZ2U6IFwibWluXCIsXHJcbiAgICAgIHZhbHVlOiBhdmVyYWdlLFxyXG4gICAgICBtaW46IGF2ZXJhZ2UgLSAzICogc3RlcCxcclxuICAgICAgbWF4OiBhdmVyYWdlICsgMyAqIHN0ZXAsXHJcbiAgICAgIHN0ZXA6IHN0ZXAsXHJcbiAgICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgdXBkYXRlQXZlcmFnZSgkYywgdWkudmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdmFyIHNsaWRlciA9ICQodGhpcykuc2xpZGVyKHNldHVwKTtcclxuXHJcbiAgICAkYy5maW5kKCcucHJvdmlkZXItYXZlcmFnZS10aW1lJykub24oJ2NsaWNrJywgJ2xhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICBpZiAoJHQuaGFzQ2xhc3MoJ2JlbG93LWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1pbik7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC52YWx1ZSk7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhYm92ZS1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5tYXgpO1xyXG4gICAgICB1cGRhdGVBdmVyYWdlKCRjLCBzbGlkZXIuc2xpZGVyKCd2YWx1ZScpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldHVwIHRoZSBpbnB1dCBmaWVsZCwgaGlkZGVuIGFuZCB3aXRoIGluaXRpYWwgdmFsdWUgc3luY2hyb25pemVkIHdpdGggc2xpZGVyXHJcbiAgICB2YXIgZmllbGQgPSAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJyk7XHJcbiAgICBmaWVsZC5oaWRlKCk7XHJcbiAgICB2YXIgY3VycmVudFZhbHVlID0gZmllbGQudmFsKCkgfHwgYXZlcmFnZTtcclxuICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBUaGUgaW4tZWRpdG9yIGxpbmsgI3Nob3ctbW9yZS1hdHRyaWJ1dGVzIG11c3Qgc2hvdy9oaWRlIHRoZSBjb250YWluZXIgb2ZcclxuICBleHRyYSBhdHRyaWJ1dGVzIGZvciB0aGUgcGFja2FnZS9wcmljaW5nLWl0ZW0uIFRoaXMgc2V0dXBzIHRoZSByZXF1aXJlZCBoYW5kbGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpIHtcclxuICAvLyBIYW5kbGVyIGZvciAnc2hvdy1tb3JlLWF0dHJpYnV0ZXMnIGJ1dHRvbiAodXNlZCBvbmx5IG9uIGVkaXQgYSBwYWNrYWdlKVxyXG4gICRlZGl0b3IuZmluZCgnLnNob3ctbW9yZS1hdHRyaWJ1dGVzJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBhdHRzID0gJHQuc2libGluZ3MoJy5zZXJ2aWNlcy1ub3QtY2hlY2tlZCcpO1xyXG4gICAgaWYgKGF0dHMuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdzaG93LXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLmhpZGUoJ2Zhc3QnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnaGlkZS10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5zaG93KCdmYXN0Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn0iLCIvKipcclxuICBwcml2YWN5U2V0dGluZ3M6IFNldHVwIGZvciB0aGUgc3BlY2lmaWMgcGFnZS1mb3JtIGRhc2hib2FyZC9wcml2YWN5L3ByaXZhY3lzZXR0aW5nc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gVE9ETyBJbXBsZW1lbnQgZGVwZW5kZW5jaWVzIGNvbW1pbmcgZnJvbSBhcHAuanMgaW5zdGVhZCBvZiBkaXJlY3QgbGlua1xyXG4vL3ZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ3Ntb290aEJveEJsb2NrJyk7XHJcbi8vIFRPRE8gUmVwbGFjZSBkb20tcmVzc291cmNlcyBieSBpMThuLmdldFRleHRcclxuXHJcbnZhciBwcml2YWN5ID0ge1xyXG4gIGFjY291bnRMaW5rc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3lTZXR0aW5ncy1teUFjY291bnQgYScsXHJcbiAgcmVzc291cmNlc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3ktYWNjb3VudFJlc3NvdXJjZXMnXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByaXZhY3k7XHJcblxyXG5wcml2YWN5Lm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICcuY2FuY2VsLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKCRjKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZnVuY3Rpb24gKCkge1xyXG4gICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG4gIFxyXG4gICRjLm9uKCdjbGljaycsIHByaXZhY3kuYWNjb3VudExpbmtzU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgYixcclxuICAgICAgbHJlcyA9ICRjLmZpbmQocHJpdmFjeS5yZXNzb3VyY2VzU2VsZWN0b3IpO1xyXG5cclxuICAgIHN3aXRjaCAoJCh0aGlzKS5hdHRyKCdocmVmJykpIHtcclxuICAgICAgY2FzZSAnI2RlbGV0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVsZXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI2RlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjcmVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcucmVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoYikge1xyXG4gICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IGIub2Zmc2V0KCkudG9wIH0sIDUwMCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG59OyIsIi8qKiBTZXJ2aWNlIEF0dHJpYnV0ZXMgVmFsaWRhdGlvbjogaW1wbGVtZW50cyB2YWxpZGF0aW9ucyB0aHJvdWdoIHRoZSBcclxuICAnY3VzdG9tVmFsaWRhdGlvbicgYXBwcm9hY2ggZm9yICdwb3NpdGlvbiBzZXJ2aWNlIGF0dHJpYnV0ZXMnLlxyXG4gIEl0IHZhbGlkYXRlcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGNhdGVnb3J5LCBhbG1vc3Qtb25lIG9yIHNlbGVjdC1vbmUgbW9kZXMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJ0xDL2dldFRleHQnKTtcclxudmFyIHZoID0gcmVxdWlyZSgnTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJ0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbi8qKiBFbmFibGUgdmFsaWRhdGlvbiBvZiByZXF1aXJlZCBzZXJ2aWNlIGF0dHJpYnV0ZXMgb25cclxuICB0aGUgZm9ybShzKSBzcGVjaWZpZWQgYnkgdGhlIHNlbGVjdG9yIG9yIHByb3ZpZGVkXHJcbioqL1xyXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gc2V0dXBTZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24oY29udGFpbmVyU2VsZWN0b3IsIG9wdGlvbnMpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgcmVxdWlyZWRTZWxlY3RvcjogJy5EYXNoYm9hcmRTZXJ2aWNlcy1hdHRyaWJ1dGVzLWNhdGVnb3J5LmlzLXJlcXVpcmVkJyxcclxuICAgIHNlbGVjdE9uZUNsYXNzOiAnanMtdmFsaWRhdGlvblNlbGVjdE9uZScsXHJcbiAgICBncm91cEVycm9yQ2xhc3M6ICdpcy1lcnJvcicsXHJcbiAgICB2YWxFcnJvclRleHRLZXk6ICdyZXF1aXJlZC1hdHRyaWJ1dGUtY2F0ZWdvcnktZXJyb3InXHJcbiAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICRjLmVhY2goZnVuY3Rpb24gdmFsaWRhdGVTZXJ2aWNlQXR0cmlidXRlcygpIHtcclxuICAgIHZhciBmID0gJCh0aGlzKTtcclxuICAgIGlmICghZi5pcygnZm9ybScpKSB7XHJcbiAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBlbGVtZW50IHRvIGFwcGx5IHZhbGlkYXRpb24gbXVzdCBiZSBhIGZvcm0nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGYuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicsIHtcclxuICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsaWQgPSB0cnVlLCBsYXN0VmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIHZhciB2ID0gdmguZmluZFZhbGlkYXRpb25TdW1tYXJ5KGYpO1xyXG5cclxuICAgICAgICBmLmZpbmQob3B0aW9ucy5yZXF1aXJlZFNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBmcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgY2F0ID0gZnMuY2hpbGRyZW4oJ2xlZ2VuZCcpLnRleHQoKTtcclxuICAgICAgICAgIC8vIFdoYXQgdHlwZSBvZiB2YWxpZGF0aW9uIGFwcGx5P1xyXG4gICAgICAgICAgaWYgKGZzLmlzKCcuJyArIG9wdGlvbnMuc2VsZWN0T25lQ2xhc3MpKVxyXG4gICAgICAgICAgLy8gaWYgdGhlIGNhdCBpcyBhICd2YWxpZGF0aW9uLXNlbGVjdC1vbmUnLCBhICdzZWxlY3QnIGVsZW1lbnQgd2l0aCBhICdwb3NpdGl2ZSdcclxuICAgICAgICAgIC8vIDpzZWxlY3RlZCB2YWx1ZSBtdXN0IGJlIGNoZWNrZWRcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gISEoZnMuZmluZCgnb3B0aW9uOnNlbGVjdGVkJykudmFsKCkpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBsb29rIGZvciAnYWxtb3N0IG9uZScgY2hlY2tlZCB2YWx1ZXM6XHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9IChmcy5maW5kKCdpbnB1dDpjaGVja2VkJykubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXN0VmFsaWQpIHtcclxuICAgICAgICAgICAgdmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZnMuYWRkQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gZ2V0VGV4dChvcHRpb25zLnZhbEVycm9yVGV4dEtleSwgY2F0KTtcclxuICAgICAgICAgICAgaWYgKHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICB2LmNoaWxkcmVuKCd1bCcpLmFwcGVuZCgkKCc8bGkvPicpLnRleHQoZXJyKS5hdHRyKCd0aXRsZScsIGNhdCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoZik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihmKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbGlkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBJdCBwcm92aWRlcyB0aGUgY29kZSBmb3IgdGhlIGFjdGlvbnMgb2YgdGhlIFZlcmlmaWNhdGlvbnMgc2VjdGlvbi5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbi8vdmFyIExjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuLy92YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG5cclxudmFyIGFjdGlvbnMgPSBleHBvcnRzLmFjdGlvbnMgPSB7fTtcclxuXHJcbmFjdGlvbnMuZmFjZWJvb2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLyogRmFjZWJvb2sgY29ubmVjdCAqL1xyXG4gIHZhciBGYWNlYm9va0Nvbm5lY3QgPSByZXF1aXJlKCdMQy9GYWNlYm9va0Nvbm5lY3QnKTtcclxuICB2YXIgZmIgPSBuZXcgRmFjZWJvb2tDb25uZWN0KHtcclxuICAgIHJlc3VsdFR5cGU6ICdqc29uJyxcclxuICAgIHVybFNlY3Rpb246ICdWZXJpZnknLFxyXG4gICAgYXBwSWQ6ICQoJ2h0bWwnKS5kYXRhKCdmYi1hcHBpZCcpLFxyXG4gICAgcGVybWlzc2lvbnM6ICdlbWFpbCx1c2VyX2Fib3V0X21lJyxcclxuICAgIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnXHJcbiAgfSk7XHJcbiAgJChkb2N1bWVudCkub24oZmIuY29ubmVjdGVkRXZlbnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdwb3B1cC1jbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZmIuY29ubmVjdCgpO1xyXG59O1xyXG5cclxuYWN0aW9ucy5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcclxuICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdBY2NvdW50LyRSZXNlbmRDb25maXJtYXRpb25FbWFpbC9ub3cvJywgcG9wdXAuc2l6ZSgnc21hbGwnKSk7XHJcbn07XHJcblxyXG52YXIgbGlua3MgPSBleHBvcnRzLmxpbmtzID0ge1xyXG4gICcjY29ubmVjdC13aXRoLWZhY2Vib29rJzogYWN0aW9ucy5mYWNlYm9vayxcclxuICAnI2NvbmZpcm0tZW1haWwnOiBhY3Rpb25zLmVtYWlsXHJcbn07XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2V0IHRoZSBhY3Rpb24gbGluayBvciBlbXB0eVxyXG4gICAgdmFyIGxpbmsgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xyXG5cclxuICAgIC8vIEV4ZWN1dGUgdGhlIGFjdGlvbiBhdHRhY2hlZCB0byB0aGF0IGxpbmtcclxuICAgIHZhciBhY3Rpb24gPSBsaW5rc1tsaW5rXSB8fCBudWxsO1xyXG4gICAgaWYgKHR5cGVvZiAoYWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBhY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciB3b3JrSG91cnNMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV29ya0hvdXJzLmVuYWJsZUFsbCgpO1xyXG4gIFxyXG4gICQuZWFjaCh3b3JrSG91cnNMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgdmFyIHdvcmtob3VycyA9IHRoaXM7XHJcblxyXG4gICAgLy8gU2V0dXBpbmcgdGhlIFdvcmtIb3VycyBjYWxlbmRhciBkYXRhIHNhdmUgd2hlbiB0aGUgZm9ybSBpcyBzdWJtaXR0ZWRcclxuICAgIHZhciBmb3JtID0gd29ya2hvdXJzLiRlbC5jbG9zZXN0KCdmb3JtLmFqYXgsIGZpZWxkc2V0LmFqYXgnKTtcclxuICAgIHZhciBmaWVsZCA9IGZvcm0uZmluZCgnW25hbWU9d29ya2hvdXJzXScpO1xyXG4gICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ3b3JraG91cnNcIiAvPicpLmFwcGVuZFRvKGZvcm0pO1xyXG4gICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERpc2FibGluZyBjYWxlbmRhciBvbiBmaWVsZCBhbGx0aW1lXHJcbiAgICBmb3JtLmZpbmQoJ1tuYW1lPWFsbHRpbWVdJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICBjbCA9IHdvcmtob3Vycy5jbGFzc2VzLmRpc2FibGVkO1xyXG4gICAgICBpZiAoY2wpXHJcbiAgICAgICAgd29ya2hvdXJzLiRlbC50b2dnbGVDbGFzcyhjbCwgJHQucHJvcCgnY2hlY2tlZCcpKTtcclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VyIHByaXZhdGUgZGFzaGJvYXJkIHNlY3Rpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBDb2RlIG9uIHBhZ2UgcmVhZHlcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgLyogU2lkZWJhciAqL1xyXG4gIHZhciBcclxuICAgIHRvZ2dsZSA9IHJlcXVpcmUoJy4uL0xDL3RvZ2dsZScpLFxyXG4gICAgUHJvdmlkZXJQb3NpdGlvbiA9IHJlcXVpcmUoJy4uL0xDL1Byb3ZpZGVyUG9zaXRpb24nKTtcclxuICAvLyBBdHRhY2hpbmcgJ2NoYW5nZSBwb3NpdGlvbicgYWN0aW9uIHRvIHRoZSBzaWRlYmFyIGxpbmtzXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ1tocmVmID0gXCIjdG9nZ2xlUG9zaXRpb25TdGF0ZVwiXScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBcclxuICAgICAgJHQgPSAkKHRoaXMpLFxyXG4gICAgICB2ID0gJHQudGV4dCgpLFxyXG4gICAgICBuID0gdG9nZ2xlKHYsIFsnb24nLCAnb2ZmJ10pLFxyXG4gICAgICBwb3NpdGlvbklkID0gJHQuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuXHJcbiAgICB2YXIgcG9zID0gbmV3IFByb3ZpZGVyUG9zaXRpb24ocG9zaXRpb25JZCk7XHJcbiAgICBwb3NcclxuICAgIC5vbihwb3Muc3RhdGVDaGFuZ2VkRXZlbnQsIGZ1bmN0aW9uIChzdGF0ZSkge1xyXG4gICAgICAkdC50ZXh0KHN0YXRlKTtcclxuICAgIH0pXHJcbiAgICAuY2hhbmdlU3RhdGUobik7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvKiBQcm9tb3RlICovXHJcbiAgdmFyIGdlbmVyYXRlQm9va05vd0J1dHRvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2dlbmVyYXRlQm9va05vd0J1dHRvbicpO1xyXG4gIC8vIExpc3RlbiBvbiBEYXNoYm9hcmRQcm9tb3RlIGluc3RlYWQgb2YgdGhlIG1vcmUgY2xvc2UgY29udGFpbmVyIERhc2hib2FyZEJvb2tOb3dCdXR0b25cclxuICAvLyBhbGxvd3MgdG8gY29udGludWUgd29ya2luZyB3aXRob3V0IHJlLWF0dGFjaG1lbnQgYWZ0ZXIgaHRtbC1hamF4LXJlbG9hZHMgZnJvbSBhamF4Rm9ybS5cclxuICBnZW5lcmF0ZUJvb2tOb3dCdXR0b24ub24oJy5EYXNoYm9hcmRQcm9tb3RlJyk7IC8vJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uJ1xyXG5cclxuICAvKiBQcml2YWN5ICovXHJcbiAgdmFyIHByaXZhY3lTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncycpO1xyXG4gIHByaXZhY3lTZXR0aW5ncy5vbignLkRhc2hib2FyZFByaXZhY3knKTtcclxuXHJcbiAgLyogUGF5bWVudHMgKi9cclxuICB2YXIgcGF5bWVudEFjY291bnQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudCcpO1xyXG4gIHBheW1lbnRBY2NvdW50Lm9uKCcuRGFzaGJvYXJkUGF5bWVudHMnKTtcclxuXHJcbiAgLyogUHJvZmlsZSBwaG90byAqL1xyXG4gIHZhciBjaGFuZ2VQcm9maWxlUGhvdG8gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8nKTtcclxuICBjaGFuZ2VQcm9maWxlUGhvdG8ub24oJy5EYXNoYm9hcmRBYm91dFlvdScpO1xyXG5cclxuICAvKiBBYm91dCB5b3UgLyBlZHVjYXRpb24gKi9cclxuICB2YXIgZWR1Y2F0aW9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwnKTtcclxuICBlZHVjYXRpb24ub24oJy5EYXNoYm9hcmRBYm91dFlvdScpO1xyXG5cclxuICAvKiBBYm91dCB5b3UgLyB2ZXJpZmljYXRpb25zICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMnKS5vbignLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gc2VydmljZXMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9zZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24nKS5zZXR1cCgkKCcuRGFzaGJvYXJkWW91cldvcmsgZm9ybScpKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gcHJpY2luZyAqL1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ByaWNpbmdDcnVkbCcpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gbG9jYXRpb25zICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbG9jYXRpb25zQ3J1ZGwnKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gIC8qIFlvdXIgd29yayAvIGxpY2Vuc2VzICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gcGhvdG9zICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUknKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gIC8qIFlvdXIgd29yayAvIHJldmlld3MgKi9cclxuICAkKCcuRGFzaGJvYXJkWW91cldvcmsnKS5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0nLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuICAgIC8vIFJlc2V0aW5nIHRoZSBlbWFpbCBhZGRyZXNzZXMgb24gc3VjY2VzcyB0byBhdm9pZCByZXNlbmQgYWdhaW4gbWVzc2FnZXMgYmVjYXVzZVxyXG4gICAgLy8gbWlzdGFrZSBvZiBhIHNlY29uZCBzdWJtaXQuXHJcbiAgICB2YXIgdGIgPSAkKCcuRGFzaGJvYXJkUmV2aWV3cyBbbmFtZT1jbGllbnRzZW1haWxzXScpO1xyXG4gICAgLy8gT25seSBpZiB0aGVyZSB3YXMgYSB2YWx1ZTpcclxuICAgIGlmICh0Yi52YWwoKSkge1xyXG4gICAgICB0YlxyXG4gICAgICAudmFsKCcnKVxyXG4gICAgICAuYXR0cigncGxhY2Vob2xkZXInLCB0Yi5kYXRhKCdzdWNjZXNzLW1lc3NhZ2UnKSlcclxuICAgICAgLy8gc3VwcG9ydCBmb3IgSUUsICdub24tcGxhY2Vob2xkZXItYnJvd3NlcnMnXHJcbiAgICAgIC5wbGFjZWhvbGRlcigpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKiBBdmFpbGFiaWx0eSAqL1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3dlZWtseVNjaGVkdWxlJykub24oKTtcclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9jYWxlbmRhclN5bmMnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsJykub24oJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKTtcclxufSk7Il19
