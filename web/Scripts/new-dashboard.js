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

        // Support for reload, avoiding important bugs with reloading boxes that contains forms:
        // If operation is a reload, don't check the ajax-box
        var jb = newhtml;
        if (!ctx.isReload) {
          // Check if the returned element is the ajax-box, if not, find
          // the element in the newhtml:
          jb = newhtml.filter('.ajax-box');
          if (jb.length === 0)
            jb = newhtml;
          if (!ctx.boxIsContainer && !jb.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
          if (!jb || jb.length === 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
          }

          if (replaceBoxContent)
            // Replace the box content with the content of the returned box
            // or all if there is no ajax-box in the result.
            jb = jb.is('.ajax-box') ? jb.contents() : jb;
        }

        if (replaceBoxContent) {
          ctx.box.empty().append(jb);
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
  console.log('init crudl appoit', containerSelector);
  var $c = $(containerSelector),
    crudlSelector = '.DashboardAppointments',
    $crudlContainer = $c.find(crudlSelector).closest('.DashboardSection-page-section'),
    $others = $crudlContainer.siblings().add($crudlContainer.find('.DashboardSection-page-section-introduction'));

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
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
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
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1Byb3ZpZGVyUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheENhbGxiYWNrcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcmVhdGVJZnJhbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zbW9vdGhCb3hCbG9jay5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy90b2dnbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvY2FsZW5kYXJTeW5jLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvY2hhbmdlUHJvZmlsZVBob3RvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbG9jYXRpb25zQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcHJpY2luZ0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbmV3LWRhc2hib2FyZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qKiBQcm92aWRlclBvc2l0aW9uIGNsYXNzXHJcbiAgSXQgcHJvdmlkZXMgbWluaW11biBsaWtlLWpxdWVyeSBldmVudCBsaXN0ZW5lcnNcclxuICB3aXRoIG1ldGhvZHMgJ29uJyBhbmQgJ29mZicsIGFuZCBpbnRlcm5hbGx5ICd0aGlzLmV2ZW50cydcclxuICBiZWluZyBhIGpRdWVyeS5DYWxsYmFja3MuXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKTtcclxuXHJcbi8qKiBDb25zdHJ1Y3RvclxyXG4qKi9cclxudmFyIFByb3ZpZGVyUG9zaXRpb24gPSBmdW5jdGlvbiAocG9zaXRpb25JZCkge1xyXG4gIHRoaXMucG9zaXRpb25JZCA9IHBvc2l0aW9uSWQ7XHJcblxyXG4gIC8vIEV2ZW50cyBzdXBwb3J0IHRocm91Z2gganF1ZXJ5LkNhbGxiYWNrXHJcbiAgdGhpcy5ldmVudHMgPSAkLkNhbGxiYWNrcygpO1xyXG4gIHRoaXMub24gPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLmFkZC5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG4gIHRoaXMub2ZmID0gZnVuY3Rpb24gKCkgeyB0aGlzLmV2ZW50cy5yZW1vdmUuYXBwbHkodGhpcy5ldmVudHMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpOyByZXR1cm4gdGhpczsgfTtcclxufTtcclxuXHJcbi8vIFVzaW5nIGRlZmF1bHQgY29uZmlndXJhdGlvbiBhcyBwcm90b3R5cGVcclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUgPSB7XHJcbiAgZGVjbGluZWRNZXNzYWdlQ2xhc3M6ICdpbmZvJyxcclxuICBkZWNsaW5lZFBvcHVwQ2xhc3M6ICdwb3NpdGlvbi1zdGF0ZS1jaGFuZ2UnLFxyXG4gIHN0YXRlQ2hhbmdlZEV2ZW50OiAnc3RhdGUtY2hhbmdlZCcsXHJcbiAgc3RhdGVDaGFuZ2VkRGVjbGluZWRFdmVudDogJ3N0YXRlLWNoYW5nZWQtZGVjbGluZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJChkb2N1bWVudCk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciBjdHggPSB7IGZvcm06ICRkLCBib3g6ICRkIH07XHJcbiAgJC5hamF4KHtcclxuICAgIHVybDogTGNVcmwuTGFuZ1BhdGggKyAnTmV3RGFzaGJvYXJkL1Bvc2l0aW9uLycgKyBwYWdlICsgJy8/UG9zaXRpb25JRD0nICsgdGhpcy5wb3NpdGlvbklkLFxyXG4gICAgY29udGV4dDogY3R4LFxyXG4gICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgJGQub25lKCdhamF4U3VjY2Vzc1Bvc3QnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEsIHQsIGosIGN0eCkge1xyXG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSAxMDEpIHtcclxuICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZShzdGF0ZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBTaG93IG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcyh0aGF0LmRlY2xpbmVkTWVzc2FnZUNsYXNzKS5hcHBlbmQoZGF0YS5SZXN1bHQuTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obXNnLCBwb3MsIHRoYXQuZGVjbGluZWRQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIC8vIFByb2Nlc3MgdGhlIHJlc3VsdCwgdGhhdCBldmVudHVhbGx5IHdpbGwgY2FsbCBhamF4U3VjY2Vzc1Bvc3RcclxuICAgICAgYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247IiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBmb3IgcmVsb2FkLCBhdm9pZGluZyBpbXBvcnRhbnQgYnVncyB3aXRoIHJlbG9hZGluZyBib3hlcyB0aGF0IGNvbnRhaW5zIGZvcm1zOlxyXG4gICAgICAgIC8vIElmIG9wZXJhdGlvbiBpcyBhIHJlbG9hZCwgZG9uJ3QgY2hlY2sgdGhlIGFqYXgtYm94XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5pc1JlbG9hZCkge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgICAgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KVxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGpiID0gamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBwcmV2RWxzID0gJC5leHRlbmQoW10sIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKTtcclxuICAgICAgICB2YXIgciA9IHRydWU7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9ICQuZ3JlcCh0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSwgZnVuY3Rpb24gKGVsKSB7IHJldHVybiAoJC5pbkFycmF5KGVsLCBlbHMpID09IC0xKTsgfSk7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHJlbW92ZSAnZicgbGlzdCBpZiBpcyBub3QgZW1wdHlcclxuICAgICAgICAgICAgciA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgJChmKS5yZW1vdmVDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV07XHJcbiAgICAgICAgICAgIC8vIGxpbmsgZWxlbWVudHMgZnJvbSBlbHMgdG8gY2xlYW4tdXAgaXRzIGNsYXNzZXNcclxuICAgICAgICAgICAgZWxzID0gcHJldkVscztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50cyByZWdpc3RlcmVkIGFzIHNhdmUgKHRoaXMgY2FuIGJlIG51bGwpLCBhbmQgJ2Zvcm0gZnVsbHkgc2F2ZWQnIGFzIHRoaXJkIHBhcmFtIChib29sKVxyXG4gICAgICAgICQoZikudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCBbZiwgZWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpICQuZWFjaChlbHMsIGZ1bmN0aW9uICgpIHsgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKS5yZW1vdmVDbGFzcyhsY2huLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpOyB9KTtcclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBnaXZlbiBlbGVtZW50IGluIFhQYXRoIGNvbnZlbnRpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXRYUGF0aChlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LmlkKVxyXG4gICAgICAgIHJldHVybiAnLy8qW0BpZD1cIicgKyBlbGVtZW50LmlkICsgJ1wiXSc7XHJcbiAgICB2YXIgeHBhdGggPSAnJztcclxuICAgIGZvciAoOyBlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT0gMTsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIHZhciBpZCA9ICQoZWxlbWVudC5wYXJlbnROb2RlKS5jaGlsZHJlbihlbGVtZW50LnRhZ05hbWUpLmluZGV4KGVsZW1lbnQpICsgMTtcclxuICAgICAgICBpZCA9IChpZCA+IDEgPyAnWycgKyBpZCArICddJyA6ICcnKTtcclxuICAgICAgICB4cGF0aCA9ICcvJyArIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgaWQgKyB4cGF0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB4cGF0aDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRYUGF0aDtcclxuIiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIDUwMCwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qIFBvcHVwIGZ1bmN0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKipcclxuKiBQb3B1cCByZWxhdGVkIFxyXG4qIGZ1bmN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBwb3B1cFNpemUoc2l6ZSkge1xyXG4gICAgdmFyIHMgPSAoc2l6ZSA9PSAnbGFyZ2UnID8gMC44IDogKHNpemUgPT0gJ21lZGl1bScgPyAwLjUgOiAoc2l6ZSA9PSAnc21hbGwnID8gMC4yIDogc2l6ZSB8fCAwLjUpKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKCQod2luZG93KS53aWR0aCgpICogcyksXHJcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKCQod2luZG93KS5oZWlnaHQoKSAqIHMpLFxyXG4gICAgICAgIHNpemVGYWN0b3I6IHNcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXBTdHlsZShzaXplKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxyXG4gICAgICAgIHdpZHRoOiBzaXplLndpZHRoICsgJ3B4JyxcclxuICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKCgkKHdpbmRvdykud2lkdGgoKSAtIHNpemUud2lkdGgpIC8gMikgLSAyNSArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodCArICdweCcsXHJcbiAgICAgICAgdG9wOiBNYXRoLnJvdW5kKCgkKHdpbmRvdykuaGVpZ2h0KCkgLSBzaXplLmhlaWdodCkgLyAyKSAtIDMyICsgJ3B4JyxcclxuICAgICAgICBwYWRkaW5nOiAnMzRweCAyNXB4IDMwcHgnLFxyXG4gICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgJy1tb3otYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmcnLFxyXG4gICAgICAgICctd2Via2l0LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCcsXHJcbiAgICAgICAgJ2JhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCdcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXAodXJsLCBzaXplLCBjb21wbGV0ZSwgbG9hZGluZ1RleHQsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgKHVybCkgPT09ICdvYmplY3QnKVxyXG4gICAgICAgIG9wdGlvbnMgPSB1cmw7XHJcblxyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHVybDogdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICcnLFxyXG4gICAgICAgIHNpemU6IHNpemUgfHwgeyB3aWR0aDogMCwgaGVpZ2h0OiAwIH0sXHJcbiAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlLFxyXG4gICAgICAgIGxvYWRpbmdUZXh0OiBsb2FkaW5nVGV4dCxcclxuICAgICAgICBjbG9zYWJsZToge1xyXG4gICAgICAgICAgICBvbkxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBhZnRlckxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9TaXplOiBmYWxzZSxcclxuICAgICAgICBjb250YWluZXJDbGFzczogJycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNpemUgYW5kIGxvYWRpbmdcclxuICAgIG9wdGlvbnMubG9hZGluZ1RleHQgPSBvcHRpb25zLmxvYWRpbmdUZXh0IHx8ICcnO1xyXG4gICAgaWYgKHR5cGVvZiAob3B0aW9ucy5zaXplLndpZHRoKSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgb3B0aW9ucy5zaXplID0gcG9wdXBTaXplKG9wdGlvbnMuc2l6ZSk7XHJcblxyXG4gICAgJC5ibG9ja1VJKHtcclxuICAgICAgICBtZXNzYWdlOiAob3B0aW9ucy5jbG9zYWJsZS5vbkxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgK1xyXG4gICAgICAgJzxpbWcgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgKyBvcHRpb25zLmxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNlbnRlclk6IGZhbHNlLFxyXG4gICAgICAgIGNzczogcG9wdXBTdHlsZShvcHRpb25zLnNpemUpLFxyXG4gICAgICAgIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSxcclxuICAgICAgICBmb2N1c0lucHV0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkaW5nIFVybCB3aXRoIEFqYXggYW5kIHBsYWNlIGNvbnRlbnQgaW5zaWRlIHRoZSBibG9ja2VkLWJveFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxyXG4gICAgICAgIGNvbnRleHQ6IHtcclxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAkKCcuYmxvY2tNc2cnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyLmFkZENsYXNzKG9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG4gICAgICAgICAgICAvLyBBZGQgY2xvc2UgYnV0dG9uIGlmIHJlcXVpcmVzIGl0IG9yIGVtcHR5IG1lc3NhZ2UgY29udGVudCB0byBhcHBlbmQgdGhlbiBtb3JlXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5odG1sKG9wdGlvbnMuY2xvc2FibGUuYWZ0ZXJMb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudEhvbGRlciA9IGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb250ZW50XCIvPicpLmNoaWxkcmVuKCcuY29udGVudCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlICYmIGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBjb2RlLCBzaG93IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBhZ2UgY29udGVudCBnb3QsIHBhc3RlIGludG8gdGhlIHBvcHVwIGlmIGlzIHBhcnRpYWwgaHRtbCAodXJsIHN0YXJ0cyB3aXRoICQpXHJcbiAgICAgICAgICAgICAgICBpZiAoLygoXlxcJCl8KFxcL1xcJCkpLy50ZXN0KG9wdGlvbnMudXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgbWlzY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2V2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldkhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gY29udGVudEhvbGRlclswXS5zY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbEhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udFdpZHRoID0gY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250SGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFXaWR0aCA9IGNvbnRhaW5lci5vdXRlcldpZHRoKHRydWUpIC0gY29udFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFIZWlnaHQgPSBjb250YWluZXIub3V0ZXJIZWlnaHQodHJ1ZSkgLSBjb250SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAtIGV4dHJhV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBleHRyYUhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGFuZCBhcHBseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3R1YWxXaWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggOiBhY3R1YWxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0ID4gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogYWN0dWFsSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hbmltYXRlKHNpemUsIDMwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pc2NhbGN1bGF0aW9ucyBjb3JyZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCBwcmV2V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgcHJldkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbHNlLCBpZiB1cmwgaXMgYSBmdWxsIGh0bWwgcGFnZSAobm9ybWFsIHBhZ2UpLCBwdXQgY29udGVudCBpbnRvIGFuIGlmcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoZGF0YSwgdGhpcy5vcHRpb25zLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBibG9ja2luZyBlbGVtZW50IGNvbnRlbnQgKHRoZSBsb2FkaW5nKSB3aXRoIHRoZSBpZnJhbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBlcnJvcjogZnVuY3Rpb24gKGosIHQsIGV4KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5ibG9ja01zZycpLmh0bWwoKG9wdGlvbnMuY2xvc2FibGUub25FcnJvciA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPlBhZ2Ugbm90IGZvdW5kPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuaW5mbykgY29uc29sZS5pbmZvKFwiUG9wdXAtYWpheCBlcnJvcjogXCIgKyBleCk7XHJcbiAgICAgICAgfSwgY29tcGxldGU6IG9wdGlvbnMuY29tcGxldGVcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXR1cm5lZEJsb2NrID0gJCgnLmJsb2NrVUknKTtcclxuXHJcbiAgICByZXR1cm5lZEJsb2NrLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgIHJldHVybmVkQmxvY2sudHJpZ2dlcigncG9wdXAtY2xvc2VkJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm5lZEJsb2NrLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRCbG9ja0VsZW1lbnQgPSBmdW5jdGlvbiBnZXRCbG9ja0VsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrTXNnJyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldENvbnRlbnRFbGVtZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudEVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbmQoJy5jb250ZW50Jyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldE92ZXJsYXlFbGVtZW50ID0gZnVuY3Rpb24gZ2V0T3ZlcmxheUVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrT3ZlcmxheScpOyB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVkQmxvY2s7XHJcbn1cclxuXHJcbi8qIFNvbWUgcG9wdXAgdXRpbGl0aXRlcy9zaG9ydGhhbmRzICovXHJcbmZ1bmN0aW9uIG1lc3NhZ2VQb3B1cChtZXNzYWdlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYvPicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGNvbnRhaW5lciwgJ21lc3NhZ2UtcG9wdXAgZnVsbC1ibG9jaycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ubmVjdFBvcHVwQWN0aW9uKGFwcGx5VG9TZWxlY3Rvcikge1xyXG4gICAgYXBwbHlUb1NlbGVjdG9yID0gYXBwbHlUb1NlbGVjdG9yIHx8ICcucG9wdXAtYWN0aW9uJztcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGFwcGx5VG9TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuY2xvbmUoKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCBkb2N1bWVudCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUaGUgcG9wdXAgZnVuY3Rpb24gY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgYXMgbWV0aG9kc1xyXG5wb3B1cC5zaXplID0gcG9wdXBTaXplO1xyXG5wb3B1cC5zdHlsZSA9IHBvcHVwU3R5bGU7XHJcbnBvcHVwLmNvbm5lY3RBY3Rpb24gPSBjb25uZWN0UG9wdXBBY3Rpb247XHJcbnBvcHVwLm1lc3NhZ2UgPSBtZXNzYWdlUG9wdXA7XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwb3B1cDsiLCIvKiogQXBwbHkgZXZlciBhIHJlZGlyZWN0IHRvIHRoZSBnaXZlbiBVUkwsIGlmIHRoaXMgaXMgYW4gaW50ZXJuYWwgVVJMIG9yIHNhbWVcclxucGFnZSwgaXQgZm9yY2VzIGEgcGFnZSByZWxvYWQgZm9yIHRoZSBnaXZlbiBVUkwuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWRpcmVjdFRvKHVybCkge1xyXG4gICAgLy8gQmxvY2sgdG8gYXZvaWQgbW9yZSB1c2VyIGludGVyYWN0aW9uczpcclxuICAgICQuYmxvY2tVSSh7IG1lc3NhZ2U6ICcnIH0pOyAvL2xvYWRpbmdCbG9jayk7XHJcbiAgICAvLyBDaGVja2luZyBpZiBpcyBiZWluZyByZWRpcmVjdGluZyBvciBub3RcclxuICAgIHZhciByZWRpcmVjdGVkID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uIGNoZWNrUmVkaXJlY3QoKSB7XHJcbiAgICAgICAgcmVkaXJlY3RlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIC8vIE5hdmlnYXRlIHRvIG5ldyBsb2NhdGlvbjpcclxuICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybDtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIElmIHBhZ2Ugbm90IGNoYW5nZWQgKHNhbWUgdXJsIG9yIGludGVybmFsIGxpbmspLCBwYWdlIGNvbnRpbnVlIGV4ZWN1dGluZyB0aGVuIHJlZnJlc2g6XHJcbiAgICAgICAgaWYgKCFyZWRpcmVjdGVkKVxyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9LCA1MCk7XHJcbn07XHJcbiIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIC8vIEhpZGluZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgICAgYm94Y1xyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uICgpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgbnVsbCwgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJykpOyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuICBJdCB0b2dnbGVzIGEgZ2l2ZW4gdmFsdWUgd2l0aCB0aGUgbmV4dCBpbiB0aGUgZ2l2ZW4gbGlzdCxcclxuICBvciB0aGUgZmlyc3QgaWYgaXMgdGhlIGxhc3Qgb3Igbm90IG1hdGNoZWQuXHJcbiAgVGhlIHJldHVybmVkIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGRpcmVjdGx5IG9yIFxyXG4gIGNhbiBiZSBhdHRhY2hlZCB0byBhbiBhcnJheSAob3IgYXJyYXkgbGlrZSkgb2JqZWN0IGFzIG1ldGhvZFxyXG4gIChvciB0byBhIHByb3RvdHlwZSBhcyBBcnJheS5wcm90b3R5cGUpIGFuZCB1c2UgaXQgcGFzc2luZ1xyXG4gIG9ubHkgdGhlIGZpcnN0IGFyZ3VtZW50LlxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b2dnbGUoY3VycmVudCwgZWxlbWVudHMpIHtcclxuICBpZiAodHlwZW9mIChlbGVtZW50cykgPT09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgIHR5cGVvZiAodGhpcy5sZW5ndGgpID09PSAnbnVtYmVyJylcclxuICAgIGVsZW1lbnRzID0gdGhpcztcclxuXHJcbiAgdmFyIGkgPSBlbGVtZW50cy5pbmRleE9mKGN1cnJlbnQpO1xyXG4gIGlmIChpID4gLTEgJiYgaSA8IGVsZW1lbnRzLmxlbmd0aCAtIDEpXHJcbiAgICByZXR1cm4gZWxlbWVudHNbaSArIDFdO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBlbGVtZW50c1swXTtcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lcikge1xyXG4gIHZhciB2ID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcik7XHJcbiAgdi5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICByZXR1cm4gJCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3I6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcixcclxuICAgIGdvVG9TdW1tYXJ5RXJyb3JzOiBnb1RvU3VtbWFyeUVycm9ycyxcclxuICAgIGZpbmRWYWxpZGF0aW9uU3VtbWFyeTogZmluZFZhbGlkYXRpb25TdW1tYXJ5XHJcbn07IiwiLyoqIEF2YWlsYWJpbGl0eTogY2FsZW5kYXIgYXBwb2ludG1lbnRzIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgY29uc29sZS5sb2coJ2luaXQgY3J1ZGwgYXBwb2l0JywgY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgY3J1ZGxTZWxlY3RvciA9ICcuRGFzaGJvYXJkQXBwb2ludG1lbnRzJyxcclxuICAgICRjcnVkbENvbnRhaW5lciA9ICRjLmZpbmQoY3J1ZGxTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGNydWRsQ29udGFpbmVyLnNpYmxpbmdzKCkuYWRkKCRjcnVkbENvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoY3J1ZGxTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsIGVkaXRvcikge1xyXG4gICAgLy8gRG9uZSBhZnRlciBhIHNtYWxsIGRlbGF5IHRvIGxldCB0aGUgZWRpdG9yIGJlIHZpc2libGVcclxuICAgIC8vIGFuZCBzZXR1cCB3b3JrIGFzIGV4cGVjdGVkXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgZWRpdEZvcm1TZXR1cChlZGl0b3IpO1xyXG4gICAgfSwgMTAwKTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5mdW5jdGlvbiBlZGl0Rm9ybVNldHVwKGYpIHtcclxuICB2YXIgcmVwZWF0ID0gZi5maW5kKCdbbmFtZT1yZXBlYXRdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZi5maW5kKCcucmVwZWF0LW9wdGlvbnMnKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciBhbGxkYXkgPSBmLmZpbmQoJ1tuYW1lPWFsbGRheV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBmXHJcbiAgICAuZmluZCgnW25hbWU9c3RhcnR0aW1lXSxbbmFtZT1lbmR0aW1lXScpXHJcbiAgICAucHJvcCgnZGlzYWJsZWQnLCB0aGlzLmNoZWNrZWQpO1xyXG4gICAgaWYgKHRoaXMuY2hlY2tlZClcclxuICAgICAgYS5oaWRlKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2hvdygnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciByZXBlYXRGcmVxdWVuY3kgPSBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1mcmVxdWVuY3ldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBmcmVxID0gJCh0aGlzKS5jaGlsZHJlbignOnNlbGVjdGVkJyk7XHJcbiAgICB2YXIgdW5pdCA9IGZyZXEuZGF0YSgndW5pdCcpO1xyXG4gICAgZlxyXG4gICAgLmZpbmQoJy5yZXBlYXQtZnJlcXVlbmN5LXVuaXQnKVxyXG4gICAgLnRleHQodW5pdCk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyB1bml0LCB0aGVyZSBpcyBub3QgaW50ZXJ2YWwvcmVwZWF0LWV2ZXJ5IGZpZWxkOlxyXG4gICAgdmFyIGludGVydmFsID0gZi5maW5kKCcucmVwZWF0LWV2ZXJ5Jyk7XHJcbiAgICBpZiAodW5pdClcclxuICAgICAgaW50ZXJ2YWwuc2hvdygnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBpbnRlcnZhbC5oaWRlKCdmYXN0Jyk7XHJcbiAgICAvLyBTaG93IGZyZXF1ZW5jeS1leHRyYSwgaWYgdGhlcmUgaXMgc29tZW9uZVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgIC8vIEhpZGUgYWxsIG90aGVyIGZyZXF1ZW5jeS1leHRyYVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhOm5vdCguZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpICsgJyknKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgfSk7XHJcbiAgLy8gYXV0by1zZWxlY3Qgc29tZSBvcHRpb25zIHdoZW4gaXRzIHZhbHVlIGNoYW5nZVxyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LW9jdXJyZW5jZXNdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZHNdW3ZhbHVlPW9jdXJyZW5jZXNdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gIH0pO1xyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZC1kYXRlXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1kYXRlXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICAvLyBzdGFydC1kYXRlIHRyaWdnZXJcclxuICBmLmZpbmQoJ1tuYW1lPXN0YXJ0ZGF0ZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gYXV0byBmaWxsIGVuZGRhdGUgd2l0aCBzdGFydGRhdGUgd2hlbiB0aGlzIGxhc3QgaXMgdXBkYXRlZFxyXG4gICAgZi5maW5kKCdbbmFtZT1lbmRkYXRlXScpLnZhbCh0aGlzLnZhbHVlKTtcclxuICAgIC8vIGlmIG5vIHdlZWstZGF5cyBvciBvbmx5IG9uZSwgYXV0by1zZWxlY3QgdGhlIGRheSB0aGF0IG1hdGNocyBzdGFydC1kYXRlXHJcbiAgICB2YXIgd2Vla0RheXMgPSBmLmZpbmQoJy53ZWVrbHktZXh0cmEgLndlZWstZGF5cyBpbnB1dCcpO1xyXG4gICAgaWYgKHdlZWtEYXlzLmFyZSgnOmNoZWNrZWQnLCB7IHVudGlsOiAxIH0pKSB7XHJcbiAgICAgIHZhciBkYXRlID0gJCh0aGlzKS5kYXRlcGlja2VyKFwiZ2V0RGF0ZVwiKTtcclxuICAgICAgaWYgKGRhdGUpIHtcclxuICAgICAgICB3ZWVrRGF5cy5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIHdlZWtEYXlzLmZpbHRlcignW3ZhbHVlPScgKyBkYXRlLmdldERheSgpICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gSW5pdDpcclxuICByZXBlYXQuY2hhbmdlKCk7XHJcbiAgYWxsZGF5LmNoYW5nZSgpO1xyXG4gIHJlcGVhdEZyZXF1ZW5jeS5jaGFuZ2UoKTtcclxuICAvLyBhZGQgZGF0ZSBwaWNrZXJzXHJcbiAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbiAgLy8gYWRkIHBsYWNlaG9sZGVyIHN1cHBvcnQgKHBvbHlmaWxsKVxyXG4gIGYuZmluZCgnOmlucHV0JykucGxhY2Vob2xkZXIoKTtcclxufSIsIi8qKiBBdmFpbGFiaWxpdHk6IENhbGVuZGFyIFN5bmMgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICBjb250YWluZXJTZWxlY3RvciA9IGNvbnRhaW5lclNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJztcclxuICB2YXIgY29udGFpbmVyID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICAgIGZpZWxkU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1wcml2YXRlVXJsRmllbGQnLFxyXG4gICAgICBidXR0b25TZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXJlc2V0LWFjdGlvbic7XHJcblxyXG4gIC8vIFNlbGVjdGluZyBwcml2YXRlLXVybCBmaWVsZCB2YWx1ZSBvbiBmb2N1cyBhbmQgY2xpY2s6XHJcbiAgY29udGFpbmVyLmZpbmQoZmllbGRTZWxlY3Rvcikub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZWxlY3QoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gUmVzZXRpbmcgcHJpdmF0ZS11cmxcclxuICBjb250YWluZXJcclxuICAub24oJ2NsaWNrJywgYnV0dG9uU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgdCA9ICQodGhpcyksXHJcbiAgICAgIHVybCA9IHQuYXR0cignaHJlZicpLFxyXG4gICAgICBmaWVsZCA9IGNvbnRhaW5lci5maW5kKGZpZWxkU2VsZWN0b3IpO1xyXG5cclxuICAgIGZpZWxkLnZhbCgnJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gb25lcnJvcigpIHtcclxuICAgICAgZmllbGQudmFsKGZpZWxkLmRhdGEoJ2Vycm9yLW1lc3NhZ2UnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgJC5nZXRKU09OKHVybCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgIGZpZWxkLnZhbChkYXRhLlJlc3VsdClbMF0uc2VsZWN0KCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICBvbmVycm9yKCk7XHJcbiAgICB9KS5mYWlsKG9uZXJyb3IpO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbn07XHJcbiIsIi8qKiBjaGFuZ2VQcm9maWxlUGhvdG8sIGl0IHVzZXMgJ3VwbG9hZGVyJyB1c2luZyBodG1sNSwgYWpheCBhbmQgYSBzcGVjaWZpYyBwYWdlXHJcbiAgdG8gbWFuYWdlIHNlcnZlci1zaWRlIHVwbG9hZCBvZiBhIG5ldyB1c2VyIHByb2ZpbGUgcGhvdG8uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG4vLyBUT0RPOiByZWltcGxlbWVudCB0aGlzIGFuZCB0aGUgc2VydmVyLXNpZGUgZmlsZSB0byBhdm9pZCBpZnJhbWVzIGFuZCBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zLFxyXG4vLyBkaXJlY3QgQVBJIHVzZSB3aXRob3V0IGlmcmFtZS1ub3JtYWwgcG9zdCBzdXBwb3J0IChjdXJyZW50IGJyb3dzZXIgbWF0cml4IGFsbG93IHVzIHRoaXM/KVxyXG4vLyBUT0RPOiBpbXBsZW1lbnQgYXMgcmVhbCBtb2R1bGFyLCBuZXh0IGFyZSB0aGUga25vd2VkIG1vZHVsZXMgaW4gdXNlIGJ1dCBub3QgbG9hZGluZyB0aGF0IGFyZSBleHBlY3RlZFxyXG4vLyB0byBiZSBpbiBzY29wZSByaWdodCBub3cgYnV0IG11c3QgYmUgdXNlZCB3aXRoIHRoZSBuZXh0IGNvZGUgdW5jb21tZW50ZWQuXHJcbi8vIHJlcXVpcmUoJ3VwbG9hZGVyJyk7XHJcbi8vIHJlcXVpcmUoJ0xjVXJsJyk7XHJcbi8vIHZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKVxyXG4vLyB2YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcbiAgJGMub24oJ2NsaWNrJywgJ1tocmVmPVwiI2NoYW5nZS1wcm9maWxlLXBob3RvXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnTmV3RGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLycsIHsgd2lkdGg6IDI0MCwgaGVpZ2h0OiAyNDAgfSk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5PVEU6IFdlIGFyZSBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zIGZyb20gaGVyZSBiZWNhdXNlIHRoZSBzZXJ2ZXIgcGFnZS9pZnJhbWUgZXhwZWN0cyB0aGlzXHJcbiAgLy8gdG8gd29yay5cclxuICAvLyBUT0RPOiByZWZhY3RvciB0byBhdm9pZCB0aGlzIHdheS5cclxuICB3aW5kb3cucmVsb2FkVXNlclBob3RvID0gZnVuY3Rpb24gcmVsb2FkVXNlclBob3RvKCkge1xyXG4gICAgJGMuZmluZCgnLkRhc2hib2FyZFB1YmxpY0Jpby1waG90byAuYXZhdGFyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc3JjJyk7XHJcbiAgICAgIC8vIGF2b2lkIGNhY2hlIHRoaXMgdGltZVxyXG4gICAgICBzcmMgPSBzcmMgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICB3aW5kb3cuZGVsZXRlVXNlclBob3RvID0gZnVuY3Rpb24gZGVsZXRlVXNlclBob3RvKCkge1xyXG4gICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICQuYWpheCh7XHJcbiAgICAgIHVybDogTGNVcmwuTGFuZ1VybCArIFwiTmV3RGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLz9kZWxldGU9dHJ1ZVwiLFxyXG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxyXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAkLmJsb2NrVUkoTEMuYmxvY2tQcmVzZXRzLmluZm8oZGF0YS5SZXN1bHQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAkLmJsb2NrVUkoTEMuYmxvY2tQcmVzZXRzLmVycm9yKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSkpO1xyXG4gICAgICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgfSk7XHJcbiAgICAgICAgcmVsb2FkVXNlclBob3RvKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG59O1xyXG4iLCIvKiogRWR1Y2F0aW9uIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy9yZXF1aXJlKCdMQy9qcXVlcnkueHRzaCcpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBlZHVjYXRpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkRWR1Y2F0aW9uJyxcclxuICAgICRvdGhlcnMgPSAkYy5maW5kKGVkdWNhdGlvblNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKS5zaWJsaW5ncygpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoZWR1Y2F0aW9uU2VsZWN0b3IpO1xyXG4gIC8vY3J1ZGwuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSA9IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9O1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKCkuYWRkKCRsaWNlbnNlcy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobGljZW5zZXNTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBMb2NhdGlvbnMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgbWFwUmVhZHkgPSByZXF1aXJlKCdMQy9nb29nbGVNYXBSZWFkeScpO1xyXG4vLyBJbmRpcmVjdGx5IHVzZWQ6IHJlcXVpcmUoJ0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgbG9jYXRpb25zU2VsZWN0b3IgPSAnLkRhc2hib2FyZExvY2F0aW9ucycsXHJcbiAgICAkbG9jYXRpb25zID0gJGMuZmluZChsb2NhdGlvbnNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxvY2F0aW9ucy5zaWJsaW5ncygpLmFkZCgkbG9jYXRpb25zLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChsb2NhdGlvbnNTZWxlY3Rvcik7XHJcblxyXG4gIHZhciBsb2NhdGlvbk1hcDtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgLy9Gb3JjZSBleGVjdXRpb24gb2YgdGhlICdoYXMtY29uZmlybScgc2NyaXB0XHJcbiAgICAkZWRpdG9yLmZpbmQoJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnKS5jaGFuZ2UoKTtcclxuXHJcbiAgICBsb2NhdGlvbk1hcCA9IHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcik7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICBpZiAobG9jYXRpb25NYXApXHJcbiAgICAgIG1hcFJlYWR5LnJlZnJlc2hNYXAobG9jYXRpb25NYXApO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqIExvY2F0ZSB1c2VyIHBvc2l0aW9uIG9yIHRyYW5zbGF0ZSBhZGRyZXNzIHRleHQgaW50byBhIGdlb2NvZGUgdXNpbmdcclxuICBicm93c2VyIGFuZCBHb29nbGUgTWFwcyBzZXJ2aWNlcy5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcikge1xyXG4gIHZhciBtYXA7XHJcbiAgbWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIGlmIHVzZXIgc2VsZWN0cyBvciB3cml0ZXMgYSBwb3NpdGlvbiAodG8gbm90IG92ZXJ3cml0ZSBpdCB3aXRoIGF1dG9tYXRpYyBwb3NpdGlvbmluZylcclxuICAgIHZhciBwb3NpdGlvbmVkQnlVc2VyID0gZmFsc2U7XHJcbiAgICAvLyBTb21lIGNvbmZzXHJcbiAgICB2YXIgZGV0YWlsZWRab29tTGV2ZWwgPSAxNztcclxuICAgIHZhciBnZW5lcmFsWm9vbUxldmVsID0gOTtcclxuICAgIHZhciBmb3VuZExvY2F0aW9ucyA9IHtcclxuICAgICAgYnlVc2VyOiBudWxsLFxyXG4gICAgICBieUdlb2xvY2F0aW9uOiBudWxsLFxyXG4gICAgICBieUdlb2NvZGU6IG51bGwsXHJcbiAgICAgIG9yaWdpbmFsOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBsID0gJGVkaXRvci5maW5kKCcubG9jYXRpb24tbWFwJyk7XHJcbiAgICB2YXIgbSA9IGwuZmluZCgnLm1hcC1zZWxlY3RvciA+IC5nb29nbGUtbWFwJykuZ2V0KDApO1xyXG4gICAgdmFyICRsYXQgPSBsLmZpbmQoJ1tuYW1lPWxhdGl0dWRlXScpO1xyXG4gICAgdmFyICRsbmcgPSBsLmZpbmQoJ1tuYW1lPWxvbmdpdHVkZV0nKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBwb3NpdGlvbiBjb29yZGluYXRlc1xyXG4gICAgdmFyIG15TGF0bG5nO1xyXG4gICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIF9sYXRfdmFsdWUgPSAkbGF0LnZhbCgpLCBfbG5nX3ZhbHVlID0gJGxuZy52YWwoKTtcclxuICAgICAgaWYgKF9sYXRfdmFsdWUgJiYgX2xuZ192YWx1ZSkge1xyXG4gICAgICAgIG15TGF0bG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgICAvLyBXZSBjb25zaWRlciBhcyAncG9zaXRpb25lZCBieSB1c2VyJyB3aGVuIHRoZXJlIHdhcyBhIHNhdmVkIHZhbHVlIGZvciB0aGUgcG9zaXRpb24gY29vcmRpbmF0ZXMgKHdlIGFyZSBlZGl0aW5nIGEgbG9jYXRpb24pXHJcbiAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IChteUxhdGxuZy5sYXQoKSAhPT0gMCAmJiBteUxhdGxuZy5sbmcoKSAhPT0gMCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRGVmYXVsdCBwb3NpdGlvbiB3aGVuIHRoZXJlIGFyZSBub3Qgb25lIChTYW4gRnJhbmNpc2NvIGp1c3Qgbm93KTpcclxuICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzcuNzUzMzQ0MzkyMjYyOTgsIC0xMjIuNDI1NDYwNjAzNTE1Nik7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgICAvLyBSZW1lbWJlciBvcmlnaW5hbCBmb3JtIGxvY2F0aW9uXHJcbiAgICBmb3VuZExvY2F0aW9ucy5vcmlnaW5hbCA9IGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG15TGF0bG5nO1xyXG5cclxuICAgIC8vIENyZWF0ZSBtYXBcclxuICAgIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgICB6b29tOiAocG9zaXRpb25lZEJ5VXNlciA/IGRldGFpbGVkWm9vbUxldmVsIDogZ2VuZXJhbFpvb21MZXZlbCksIC8vIEJlc3QgZGV0YWlsIHdoZW4gd2UgYWxyZWFkeSBoYWQgYSBsb2NhdGlvblxyXG4gICAgICBjZW50ZXI6IG15TGF0bG5nLFxyXG4gICAgICBtYXBUeXBlSWQ6IGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQXHJcbiAgICB9O1xyXG4gICAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChtLCBtYXBPcHRpb25zKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgcG9zaXRpb24gbWFya2VyXHJcbiAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgIHBvc2l0aW9uOiBteUxhdGxuZyxcclxuICAgICAgbWFwOiBtYXAsXHJcbiAgICAgIGRyYWdnYWJsZTogZmFsc2UsXHJcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1BcclxuICAgIH0pO1xyXG4gICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjbGlja3MgbWFwIG9yIG1vdmUgdGhlIG1hcmtlciB0byBtb3ZlIG1hcmtlciBvciBzZXQgcG9zaXRpb24gaW4gdGhlIGZvcm1cclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2RyYWdlbmQnLCBzYXZlQ29vcmRpbmF0ZXMpO1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKCFtYXJrZXIuZ2V0RHJhZ2dhYmxlKCkpIHJldHVybjtcclxuICAgICAgcGxhY2VNYXJrZXIoZXZlbnQubGF0TG5nKTtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGV2ZW50LmxhdExuZztcclxuICAgIH0pO1xyXG4gICAgZnVuY3Rpb24gcGxhY2VNYXJrZXIobGF0bG5nLCBkb3pvb20sIGF1dG9zYXZlKSB7XHJcbiAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihsYXRsbmcpO1xyXG4gICAgICAvLyBNb3ZlIG1hcFxyXG4gICAgICBtYXAucGFuVG8obGF0bG5nKTtcclxuICAgICAgc2F2ZUNvb3JkaW5hdGVzKGF1dG9zYXZlKTtcclxuICAgICAgaWYgKGRvem9vbSlcclxuICAgICAgLy8gU2V0IHpvb20gdG8gc29tZXRoaW5nIG1vcmUgZGV0YWlsZWRcclxuICAgICAgICBtYXAuc2V0Wm9vbShkZXRhaWxlZFpvb21MZXZlbCk7XHJcbiAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzYXZlQ29vcmRpbmF0ZXMoaW5Gb3JtKSB7XHJcbiAgICAgIHZhciBsYXRMbmcgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGxhdExuZztcclxuICAgICAgaWYgKGluRm9ybSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICRsYXQudmFsKGxhdExuZy5sYXQoKSk7IC8vbWFya2VyLnBvc2l0aW9uLlhhXHJcbiAgICAgICAgJGxuZy52YWwobGF0TG5nLmxuZygpKTsgLy9tYXJrZXIucG9zaXRpb24uWWFcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjaGFuZ2VzIGZvcm0gY29vcmRpbmF0ZXMgdmFsdWVzIHRvIHVwZGF0ZSB0aGUgbWFwXHJcbiAgICAkbGF0LmNoYW5nZSh1cGRhdGVNYXBNYXJrZXIpO1xyXG4gICAgJGxuZy5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgIGZ1bmN0aW9uIHVwZGF0ZU1hcE1hcmtlcigpIHtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIHZhciBuZXdQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAvLyBNb3ZlIG1hcmtlclxyXG4gICAgICBtYXJrZXIuc2V0UG9zaXRpb24obmV3UG9zKTtcclxuICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgbWFwLnBhblRvKG5ld1Bvcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyo9PT09PT09PT09PT09PT09PT09XHJcbiAgICAqIEFVVE8gUE9TSVRJT05JTkdcclxuICAgICovXHJcbiAgICBmdW5jdGlvbiB1c2VHZW9sb2NhdGlvbihmb3JjZSwgYXV0b3NhdmUpIHtcclxuICAgICAgdmFyIG92ZXJyaWRlID0gZm9yY2UgfHwgIXBvc2l0aW9uZWRCeVVzZXI7XHJcbiAgICAgIC8vIFVzZSBicm93c2VyIGdlb2xvY2F0aW9uIHN1cHBvcnQgdG8gZ2V0IGFuIGF1dG9tYXRpYyBsb2NhdGlvbiBpZiB0aGVyZSBpcyBubyBhIGxvY2F0aW9uIHNlbGVjdGVkIGJ5IHVzZXJcclxuICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBnZW9sb2NhdGlvbi5cclxuICAgICAgaWYgKG92ZXJyaWRlICYmIG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xyXG5cclxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBtYXJrZXIgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nXHJcbiAgICAgICAgLy8gb24gdGhlIG1hcC4gTGV0J3Mgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXQgaGVyZSBzb1xyXG4gICAgICAgIC8vIHRoYXQgaXQgY2FuIGJlIHVwZGF0ZWQgaW4gc2V2ZXJhbCBwbGFjZXMuXHJcbiAgICAgICAgdmFyIGxvY2F0aW9uTWFya2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gR2V0IHRoZSBsb2NhdGlvbiBvZiB0aGUgdXNlcidzIGJyb3dzZXIgdXNpbmcgdGhlXHJcbiAgICAgICAgLy8gbmF0aXZlIGdlb2xvY2F0aW9uIHNlcnZpY2UuIFdoZW4gd2UgaW52b2tlIHRoaXMgbWV0aG9kXHJcbiAgICAgICAgLy8gb25seSB0aGUgZmlyc3QgY2FsbGJhY2sgaXMgcmVxdWllZC4gVGhlIHNlY29uZFxyXG4gICAgICAgIC8vIGNhbGxiYWNrIC0gdGhlIGVycm9yIGhhbmRsZXIgLSBhbmQgdGhlIHRoaXJkXHJcbiAgICAgICAgLy8gYXJndW1lbnQgLSBvdXIgY29uZmlndXJhdGlvbiBvcHRpb25zIC0gYXJlIG9wdGlvbmFsLlxyXG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oXHJcbiAgICAgICAgICBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZXJlIGlzIGFscmVhZHkgYSBsb2NhdGlvbi5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSBidWcgaW4gRmlyZUZveCB3aGVyZSB0aGlzIGdldHNcclxuICAgICAgICAgICAgLy8gaW52b2tlZCBtb3JlIHRoYW4gb25jZSB3aXRoIGEgY2FjaGVkIHJlc3VsdC5cclxuICAgICAgICAgICAgaWYgKGxvY2F0aW9uTWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNb3ZlIG1hcmtlciB0byB0aGUgbWFwIHVzaW5nIHRoZSBwb3NpdGlvbiwgb25seSBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgbG9jYXRpb25NYXJrZXIgPSBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uID0gbGF0TG5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nOiBcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGltZW91dDogKDUgKiAxMDAwKSxcclxuICAgICAgICAgICAgbWF4aW11bUFnZTogKDEwMDAgKiA2MCAqIDE1KSxcclxuICAgICAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5OiB0cnVlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgYXNrZWQgZm9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcixcclxuICAgICAgICAvLyBsZXQncyB3YXRjaCB0aGUgcG9zaXRpb24gdG8gc2VlIGlmIGl0IHVwZGF0ZXMuIFRoaXNcclxuICAgICAgICAvLyBjYW4gaGFwcGVuIGlmIHRoZSB1c2VyIHBoeXNpY2FsbHkgbW92ZXMsIG9mIGlmIG1vcmVcclxuICAgICAgICAvLyBhY2N1cmF0ZSBsb2NhdGlvbiBpbmZvcm1hdGlvbiBoYXMgYmVlbiBmb3VuZCAoZXguXHJcbiAgICAgICAgLy8gR1BTIHZzLiBJUCBhZGRyZXNzKS5cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIE5PVEU6IFRoaXMgYWN0cyBtdWNoIGxpa2UgdGhlIG5hdGl2ZSBzZXRJbnRlcnZhbCgpLFxyXG4gICAgICAgIC8vIGludm9raW5nIHRoZSBnaXZlbiBjYWxsYmFjayBhIG51bWJlciBvZiB0aW1lcyB0b1xyXG4gICAgICAgIC8vIG1vbml0b3IgdGhlIHBvc2l0aW9uLiBBcyBzdWNoLCBpdCByZXR1cm5zIGEgXCJ0aW1lciBJRFwiXHJcbiAgICAgICAgLy8gdGhhdCBjYW4gYmUgdXNlZCB0byBsYXRlciBzdG9wIHRoZSBtb25pdG9yaW5nLlxyXG4gICAgICAgIHZhciBwb3NpdGlvblRpbWVyID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE1vdmUgYWdhaW4gdG8gdGhlIG5ldyBvciBhY2N1cmF0ZWQgcG9zaXRpb24sIGlmIHVzZXIgZG9lc24ndCBzZXQgYSBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sYXRpdHVkZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIHBvc2l0aW9uIGhhc24ndCB1cGRhdGVkIHdpdGhpbiA1IG1pbnV0ZXMsIHN0b3BcclxuICAgICAgICAvLyBtb25pdG9yaW5nIHRoZSBwb3NpdGlvbiBmb3IgY2hhbmdlcy5cclxuICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIHBvc2l0aW9uIHdhdGNoZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2gocG9zaXRpb25UaW1lcik7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICgxMDAwICogNjAgKiA1KVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgIH0gLy8gRW5kcyBnZW9sb2NhdGlvbiBwb3NpdGlvblxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdXNlR21hcHNHZW9jb2RlKGluaXRpYWxMb29rdXAsIGF1dG9zYXZlKSB7XHJcbiAgICAgIHZhciBnZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xyXG5cclxuICAgICAgLy8gbG9va3VwIG9uIGFkZHJlc3MgZmllbGRzIGNoYW5nZXMgd2l0aCBjb21wbGV0ZSBpbmZvcm1hdGlvblxyXG4gICAgICB2YXIgJGZvcm0gPSAkZWRpdG9yLmZpbmQoJy5jcnVkbC1mb3JtJyksIGZvcm0gPSAkZm9ybS5nZXQoMCk7XHJcbiAgICAgIGZ1bmN0aW9uIGdldEZvcm1BZGRyZXNzKCkge1xyXG4gICAgICAgIHZhciBhZCA9IFtdO1xyXG4gICAgICAgIGZ1bmN0aW9uIGFkZChmaWVsZCkge1xyXG4gICAgICAgICAgaWYgKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKSBhZC5wdXNoKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWRkKCdhZGRyZXNzbGluZTEnKTtcclxuICAgICAgICBhZGQoJ2FkZHJlc3NsaW5lMicpO1xyXG4gICAgICAgIGFkZCgnY2l0eScpO1xyXG4gICAgICAgIGFkZCgncG9zdGFsY29kZScpO1xyXG4gICAgICAgIHZhciBzID0gZm9ybS5lbGVtZW50cy5zdGF0ZTtcclxuICAgICAgICBpZiAocy52YWx1ZSkgYWQucHVzaChzLm9wdGlvbnNbcy5zZWxlY3RlZEluZGV4XS5sYWJlbCk7XHJcbiAgICAgICAgYWQucHVzaCgnVVNBJyk7XHJcbiAgICAgICAgLy8gTWluaW11bSBmb3IgdmFsaWQgYWRkcmVzczogNCBmaWVsZHMgZmlsbGVkIG91dFxyXG4gICAgICAgIHJldHVybiBhZC5sZW5ndGggPj0gNSA/IGFkLmpvaW4oJywgJykgOiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgICRmb3JtLm9uKCdjaGFuZ2UnLCAnW25hbWU9YWRkcmVzc2xpbmUxXSwgW25hbWU9YWRkcmVzc2xpbmUyXSwgW25hbWU9Y2l0eV0sIFtuYW1lPXBvc3RhbGNvZGVdLCBbbmFtZT1zdGF0ZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBmYWxzZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gSW5pdGlhbCBsb29rdXBcclxuICAgICAgaWYgKGluaXRpYWxMb29rdXApIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IGdldEZvcm1BZGRyZXNzKCk7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIG92ZXJyaWRlKSB7XHJcbiAgICAgICAgZ2VvY29kZXIuZ2VvY29kZSh7ICdhZGRyZXNzJzogYWRkcmVzcyB9LCBmdW5jdGlvbiAocmVzdWx0cywgc3RhdHVzKSB7XHJcbiAgICAgICAgICBpZiAoc3RhdHVzID09IGdvb2dsZS5tYXBzLkdlb2NvZGVyU3RhdHVzLk9LKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXRMbmcgPSByZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbygnR2VvY29kZSByZXRyaWV2ZWQ6ICcgKyBsYXRMbmcgKyAnIGZvciBhZGRyZXNzIFwiJyArIGFkZHJlc3MgKyAnXCInKTtcclxuICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlID0gbGF0TG5nO1xyXG5cclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdHZW9jb2RlIHdhcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgdGhlIGZvbGxvd2luZyByZWFzb246ICcgKyBzdGF0dXMgKyAnIG9uIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRXhlY3V0aW5nIGF1dG8gcG9zaXRpb25pbmcgKGNoYW5nZWQgdG8gYXV0b3NhdmU6dHJ1ZSB0byBhbGwgdGltZSBzYXZlIHRoZSBsb2NhdGlvbik6XHJcbiAgICAvL3VzZUdlb2xvY2F0aW9uKHRydWUsIGZhbHNlKTtcclxuICAgIHVzZUdtYXBzR2VvY29kZShmYWxzZSwgdHJ1ZSk7XHJcblxyXG4gICAgLy8gTGluayBvcHRpb25zIGxpbmtzOlxyXG4gICAgbC5vbignY2xpY2snLCAnLm9wdGlvbnMgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuYXR0cignaHJlZicpLnN1YnN0cigxKTtcclxuICAgICAgc3dpdGNoICh0YXJnZXQpIHtcclxuICAgICAgICBjYXNlICdnZW9sb2NhdGlvbic6XHJcbiAgICAgICAgICBpZiAoZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbilcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVzZUdlb2xvY2F0aW9uKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZ2VvY29kZSc6XHJcbiAgICAgICAgICBpZiAoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlKVxyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1c2VHbWFwc0dlb2NvZGUodHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdjb25maXJtJzpcclxuICAgICAgICAgIHNhdmVDb29yZGluYXRlcyh0cnVlKTtcclxuICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoZmFsc2UpO1xyXG4gICAgICAgICAgZm91bmRMb2NhdGlvbnMuY29uZmlybWVkID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJykuaGlkZSgnZmFzdCcpO1xyXG4gICAgICAgICAgdmFyIGVkaXQgPSBsLmZpbmQoJy5lZGl0LWFjdGlvbicpO1xyXG4gICAgICAgICAgZWRpdC50ZXh0KGVkaXQuZGF0YSgnZWRpdC1sYWJlbCcpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2VkaXRjb29yZGluYXRlcyc6XHJcbiAgICAgICAgICB2YXIgYSA9IGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUnKTtcclxuICAgICAgICAgIHZhciBiID0gIWEuaXMoJzp2aXNpYmxlJyk7XHJcbiAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGIpO1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2VkaXQtbGFiZWwnLCAkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2NhbmNlbC1sYWJlbCcpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICR0LnRleHQoJHQuZGF0YSgnZWRpdC1sYWJlbCcpKTtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSBsb2NhdGlvbjpcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuY29uZmlybWVkLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGEudG9nZ2xlKCdmYXN0Jyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBtYXA7XHJcbn0iLCIvKiogVUkgbG9naWMgdG8gbWFuYWdlIHByb3ZpZGVyIHBob3RvcyAoeW91ci13b3JrL3Bob3RvcykuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnTEMvc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCdMQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRQaG90b3MnO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICBzZXR1cENydWRsRGVsZWdhdGVzKCRjKTtcclxuXHJcbiAgaW5pdEVsZW1lbnRzKCRjKTtcclxuXHJcbiAgLy8gQW55IHRpbWUgdGhhdCB0aGUgZm9ybSBjb250ZW50IGh0bWwgaXMgcmVsb2FkZWQsXHJcbiAgLy8gcmUtaW5pdGlhbGl6ZSBlbGVtZW50c1xyXG4gICRjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpbml0RWxlbWVudHMoJGMpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyogU2V0dXAgdGhlIGNvZGUgdGhhdCB3b3JrcyBvbiB0aGUgZGlmZmVyZW50IENSVURMIGFjdGlvbnMgb24gdGhlIHBob3Rvcy5cclxuICBBbGwgdGhpcyBhcmUgZGVsZWdhdGVzLCBvbmx5IG5lZWQgdG8gYmUgc2V0dXAgb25jZSBvbiB0aGUgcGFnZVxyXG4gIChpZiB0aGUgY29udGFpbmVyICRjIGlzIG5vdCByZXBsYWNlZCwgb25seSB0aGUgY29udGVudHMsIGRvZXNuJ3QgbmVlZCB0byBjYWxsIGFnYWluIHRoaXMpLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cENydWRsRGVsZWdhdGVzKCRjKSB7XHJcbiAgJGNcclxuICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy10b29scy11cGxvYWQgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHBvc0lEID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZmluZCgnaW5wdXRbbmFtZT1wb3NpdGlvbklEXScpLnZhbCgpO1xyXG4gICAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnTmV3RGFzaGJvYXJkL1lvdXJXb3JrL1VwbG9hZFBob3RvLz9Qb3NpdGlvbklEPScgKyBwb3NJRCwgJ3NtYWxsJyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSlcclxuICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5IGxpIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZvcm0gPSAkdC5jbG9zZXN0KHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgICB2YXIgZWRpdFBhbmVsID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgZm9ybSBoYWQgY2hhbmdlcywgc3VibWl0IGl0IHRvIHNhdmUgaXQ6XHJcbiAgICAvLyBSZW1vdmUgdGhlIGZvY3VzIG9mIGN1cnJlbnQgZm9jdXNlZCBlbGVtZW50IHRvIGF2b2lkIFxyXG4gICAgLy8gY2hhbmdlZCBlbGVtZW50cyBub3Qgbm90aWZ5IHRoZSBjaGFuZ2Ugc3RhdHVzXHJcbiAgICAkKCc6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICB2YXIgZiA9IGVkaXRQYW5lbC5jbG9zZXN0KCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgICB2YXIgY2hhbmdlZEVscyA9IGYuZmluZCgnLmNoYW5nZWQ6aW5wdXQnKS5tYXAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMubmFtZTsgfSkuZ2V0KCk7XHJcbiAgICBpZiAoY2hhbmdlZEVscy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIC8vIE1hcmsgY2hhbmdlcyBhcmUgc2F2ZWRcclxuICAgICAgZi5vbmUoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGYuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgY2hhbmdlZEVscyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gRm9yY2UgYSBmaWVsZHNldC5hamF4IHN1Ym1pdDpcclxuICAgICAgZi5maW5kKCcuYWpheC1maWVsZHNldC1zdWJtaXQnKS5jbGljaygpO1xyXG4gICAgfVxyXG5cclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlQWxsKGZvcm0pO1xyXG4gICAgLy8gU2V0IHRoaXMgcGhvdG8gYXMgc2VsZWN0ZWRcclxuICAgIHZhciBzZWxlY3RlZCA9ICR0LmNsb3Nlc3QoJ2xpJyk7XHJcbiAgICBzZWxlY3RlZC5hZGRDbGFzcygnc2VsZWN0ZWQnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG4gICAgLy92YXIgc2VsZWN0ZWQgPSAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGkuc2VsZWN0ZWQnLCBmb3JtKTtcclxuICAgIGlmIChzZWxlY3RlZCAhPT0gbnVsbCAmJiBzZWxlY3RlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHZhciBzZWxJbWcgPSBzZWxlY3RlZC5maW5kKCdpbWcnKTtcclxuICAgICAgLy8gTW92aW5nIHNlbGVjdGVkIHRvIGJlIGVkaXQgcGFuZWxcclxuICAgICAgdmFyIHBob3RvSUQgPSBzZWxlY3RlZC5hdHRyKCdpZCcpLm1hdGNoKC9eVXNlclBob3RvLShcXGQrKSQvKVsxXTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKHBob3RvSUQpO1xyXG4gICAgICBlZGl0UGFuZWwuZmluZCgnaW1nJykuYXR0cignc3JjJywgc2VsSW1nLmF0dHIoJ3NyYycpKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKHNlbEltZy5hdHRyKCdhbHQnKSk7XHJcbiAgICAgIHZhciBpc1ByaW1hcnlWYWx1ZSA9IHNlbGVjdGVkLmhhc0NsYXNzKCdpcy1wcmltYXJ5LXBob3RvJykgPyAnVHJ1ZScgOiAnRmFsc2UnO1xyXG4gICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b11bdmFsdWU9JyArIGlzUHJpbWFyeVZhbHVlICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSlcclxuICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy1lZGl0LWRlbGV0ZSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQodGhpcykuY2xvc2VzdCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnKTtcclxuICAgIC8vIENoYW5nZSB0aGUgZmllbGQgZGVsZXRlLXBob3RvIHRvIFRydWUgYW5kIHNlbmQgZm9ybSBmb3IgYW4gYWpheCByZXF1ZXN0IHdpdGhcclxuICAgIC8vIHNlcnZlciBkZWxldGUgdGFzayBhbmQgY29udGVudCByZWxvYWRcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1kZWxldGUtcGhvdG9dJykudmFsKCdUcnVlJyk7XHJcbiAgICAvLyBGb3JjZSBhIGZpZWxkc2V0LmFqYXggc3VibWl0OlxyXG4gICAgZWRpdFBhbmVsLmNsb3Nlc3QoJ2ZpZWxkc2V0LmFqYXgnKS5maW5kKCcuYWpheC1maWVsZHNldC1zdWJtaXQnKS5jbGljaygpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKiBJbml0aWFsaXplIHRoZSBwaG90b3MgZWxlbWVudHMgdG8gYmUgc29ydGFibGVzLCBzZXQgdGhlIHByaW1hcnkgcGhvdG9cclxuICBpbiB0aGUgaGlnaGxpZ2h0ZWQgYXJlIGFuZCBpbml0aWFsaXplIHRoZSAnZGVsZXRlIHBob3RvJyBmbGFnLlxyXG4gIFRoaXMgaXMgcmVxdWlyZWQgdG8gYmUgZXhlY3V0ZWQgYW55IHRpbWUgdGhlIGVsZW1lbnRzIGh0bWwgaXMgcmVwbGFjZWRcclxuICBiZWNhdXNlIG5lZWRzIGRpcmVjdCBhY2Nlc3MgdG8gdGhlIERPTSBlbGVtZW50cy5cclxuKi9cclxuZnVuY3Rpb24gaW5pdEVsZW1lbnRzKGZvcm0pIHtcclxuICAvLyBQcmVwYXJlIHNvcnRhYmxlIHNjcmlwdFxyXG4gICQoXCIucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sXCIsIGZvcm0pLnNvcnRhYmxlKHtcclxuICAgIHBsYWNlaG9sZGVyOiBcInVpLXN0YXRlLWhpZ2hsaWdodFwiLFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIEdldCBwaG90byBvcmRlciwgYSBjb21tYSBzZXBhcmF0ZWQgdmFsdWUgb2YgaXRlbXMgSURzXHJcbiAgICAgIHZhciBvcmRlciA9ICQodGhpcykuc29ydGFibGUoXCJ0b0FycmF5XCIpLnRvU3RyaW5nKCk7XHJcbiAgICAgIC8vIFNldCBvcmRlciBpbiB0aGUgZm9ybSBlbGVtZW50LCB0byBiZSBzZW50IGxhdGVyIHdpdGggdGhlIGZvcm1cclxuICAgICAgJCh0aGlzKS5jbG9zZXN0KHNlY3Rpb25TZWxlY3RvcikuZmluZCgnW25hbWU9Z2FsbGVyeS1vcmRlcl0nKS52YWwob3JkZXIpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBTZXQgcHJpbWFyeSBwaG90byB0byBiZSBlZGl0ZWRcclxuICB2YXIgZWRpdFBhbmVsID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnLCBmb3JtKTtcclxuICAvLyBMb29rIGZvciBhIHNlbGVjdGVkIHBob3RvIGluIHRoZSBsaXN0XHJcbiAgdmFyIHNlbGVjdGVkID0gJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpLnNlbGVjdGVkJywgZm9ybSk7XHJcbiAgaWYgKHNlbGVjdGVkICE9PSBudWxsICYmIHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcclxuICAgIHZhciBzZWxJbWcgPSBzZWxlY3RlZC5maW5kKCdpbWcnKTtcclxuICAgIC8vIE1vdmluZyBzZWxlY3RlZCB0byBiZSBlZGl0IHBhbmVsXHJcbiAgICB2YXIgcGhvdG9JRCA9IHNlbGVjdGVkLmF0dHIoJ2lkJykubWF0Y2goL15Vc2VyUGhvdG8tKFxcZCspJC8pWzFdO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKHBob3RvSUQpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsIHNlbEltZy5hdHRyKCdzcmMnKSk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoc2VsSW1nLmF0dHIoJ2FsdCcpKTtcclxuICAgIHZhciBpc1ByaW1hcnlWYWx1ZSA9IHNlbGVjdGVkLmhhc0NsYXNzKCdpcy1wcmltYXJ5LXBob3RvJykgPyAnVHJ1ZScgOiAnRmFsc2UnO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXVt2YWx1ZT0nICsgaXNQcmltYXJ5VmFsdWUgKyAnXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKGZvcm0uZmluZCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZm9ybS5maW5kKCcubm8tcGhvdG9zJyksIGVkaXRQYW5lbCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXByaW1hcnktcGhvdG8nKSwgZWRpdFBhbmVsKTtcclxuICAgIH1cclxuICAgIC8vIFJlc2V0IGhpZGRlbiBmaWVsZHMgbWFudWFsbHkgdG8gYXZvaWQgYnJvd3NlciBtZW1vcnkgYnJlYWtpbmcgdGhpbmdzXHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoJycpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKCcnKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgfVxyXG4gIC8vIFJlc2V0IGRlbGV0ZSBvcHRpb25cclxuICBlZGl0UGFuZWwuZmluZCgnW25hbWU9ZGVsZXRlLXBob3RvXScpLnZhbCgnRmFsc2UnKTtcclxuXHJcbn1cclxuIiwiLyoqXHJcbnBheW1lbnQ6IHdpdGggdGhlIHByb3BlciBodG1sIGFuZCBmb3JtXHJcbnJlZ2VuZXJhdGVzIHRoZSBidXR0b24gc291cmNlLWNvZGUgYW5kIHByZXZpZXcgYXV0b21hdGljYWxseS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiBvblBheW1lbnRBY2NvdW50KGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgdGhlIGZvcm1hdHRlcnMgb24gcGFnZS1yZWFkeS4uXHJcbiAgdmFyIGZpbml0ID0gZnVuY3Rpb24gKCkgeyBpbml0Rm9ybWF0dGVycygkYyk7IH07XHJcbiAgJChmaW5pdCk7XHJcbiAgLy8gYW5kIGFueSBhamF4LXBvc3Qgb2YgdGhlIGZvcm0gdGhhdCByZXR1cm5zIG5ldyBodG1sOlxyXG4gICRjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmaW5pdCk7XHJcbn07XHJcblxyXG4vKiogSW5pdGlhbGl6ZSB0aGUgZmllbGQgZm9ybWF0dGVycyByZXF1aXJlZCBieSB0aGUgcGF5bWVudC1hY2NvdW50LWZvcm0sIGJhc2VkXHJcbiAgb24gdGhlIGZpZWxkcyBuYW1lcy5cclxuKiovXHJcbmZ1bmN0aW9uIGluaXRGb3JtYXR0ZXJzKCRjb250YWluZXIpIHtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiYmlydGhkYXRlXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTl9fS97ezk5fX0ve3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJzc25cIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OTl9fS17ezk5fX0te3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG59IiwiLyoqIFByaWNpbmcgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCdMQy9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdMQy9UaW1lU3BhbkV4dHJhJykucGx1Z0luKFRpbWVTcGFuKTtcclxudmFyIHVwZGF0ZVRvb2x0aXBzID0gcmVxdWlyZSgnTEMvdG9vbHRpcHMnKS51cGRhdGVUb29sdGlwcztcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBwcmljaW5nU2VsZWN0b3IgPSAnLkRhc2hib2FyZFByaWNpbmcnLFxyXG4gICAgJHByaWNpbmcgPSAkYy5maW5kKHByaWNpbmdTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHByaWNpbmcuc2libGluZ3MoKS5hZGQoJHByaWNpbmcuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKHByaWNpbmdTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuXHJcbiAgICBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKTtcclxuICAgIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKTtcclxuICAgIHVwZGF0ZVRvb2x0aXBzKCk7XHJcbiAgICBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcik7XHJcblxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyogSGFuZGxlciBmb3IgY2hhbmdlIGV2ZW50IG9uICdub3QgdG8gc3RhdGUgcHJpY2UgcmF0ZScsIHVwZGF0aW5nIHJlbGF0ZWQgcHJpY2UgcmF0ZSBmaWVsZHMuXHJcbiAgSXRzIHNldHVwZWQgcGVyIGVkaXRvciBpbnN0YW5jZSwgbm90IGFzIGFuIGV2ZW50IGRlbGVnYXRlLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKSB7XHJcbiAgdmFyIFxyXG4gICAgcHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPXByaWNlLXJhdGVdLFtuYW1lPXByaWNlLXJhdGUtdW5pdF0nKSxcclxuICAgIG5wciA9ICRlZGl0b3IuZmluZCgnW25hbWU9bm8tcHJpY2UtcmF0ZV0nKTtcclxuICBucHIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHByLnByb3AoJ2Rpc2FibGVkJywgbnByLnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgfSk7XHJcbiAgLy8gSW5pdGlhbCBzdGF0ZTpcclxuICBucHIuY2hhbmdlKCk7XHJcbn1cclxuXHJcbi8qKiBTZXR1cCB0aGUgVUkgU2xpZGVycyBvbiB0aGUgZWRpdG9yLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpIHtcclxuXHJcbiAgLyogSG91c2Vla2VlcGVyIHByaWNpbmcgKi9cclxuICBmdW5jdGlvbiB1cGRhdGVBdmVyYWdlKCRjLCBtaW51dGVzKSB7XHJcbiAgICAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJykudmFsKG1pbnV0ZXMpO1xyXG4gICAgbWludXRlcyA9IHBhcnNlSW50KG1pbnV0ZXMpO1xyXG4gICAgJGMuZmluZCgnLnByZXZpZXcgLnRpbWUnKS50ZXh0KFRpbWVTcGFuLmZyb21NaW51dGVzKG1pbnV0ZXMpLnRvU21hcnRTdHJpbmcoKSk7XHJcbiAgfVxyXG5cclxuICAkZWRpdG9yLmZpbmQoXCIucHJvdmlkZXItYXZlcmFnZS10aW1lLXNsaWRlclwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkYyA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtc2xpZGVyLXZhbHVlXScpO1xyXG4gICAgdmFyIGF2ZXJhZ2UgPSAkYy5kYXRhKCdzbGlkZXItdmFsdWUnKSxcclxuICAgICAgc3RlcCA9ICRjLmRhdGEoJ3NsaWRlci1zdGVwJykgfHwgMTtcclxuICAgIGlmICghYXZlcmFnZSkgcmV0dXJuO1xyXG4gICAgdmFyIHNldHVwID0ge1xyXG4gICAgICByYW5nZTogXCJtaW5cIixcclxuICAgICAgdmFsdWU6IGF2ZXJhZ2UsXHJcbiAgICAgIG1pbjogYXZlcmFnZSAtIDMgKiBzdGVwLFxyXG4gICAgICBtYXg6IGF2ZXJhZ2UgKyAzICogc3RlcCxcclxuICAgICAgc3RlcDogc3RlcCxcclxuICAgICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICB1cGRhdGVBdmVyYWdlKCRjLCB1aS52YWx1ZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB2YXIgc2xpZGVyID0gJCh0aGlzKS5zbGlkZXIoc2V0dXApO1xyXG5cclxuICAgICRjLmZpbmQoJy5wcm92aWRlci1hdmVyYWdlLXRpbWUnKS5vbignY2xpY2snLCAnbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgIGlmICgkdC5oYXNDbGFzcygnYmVsb3ctYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWluKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2F2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLnZhbHVlKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2Fib3ZlLWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1heCk7XHJcbiAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJykpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0dXAgdGhlIGlucHV0IGZpZWxkLCBoaWRkZW4gYW5kIHdpdGggaW5pdGlhbCB2YWx1ZSBzeW5jaHJvbml6ZWQgd2l0aCBzbGlkZXJcclxuICAgIHZhciBmaWVsZCA9ICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKTtcclxuICAgIGZpZWxkLmhpZGUoKTtcclxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBmaWVsZC52YWwoKSB8fCBhdmVyYWdlO1xyXG4gICAgdXBkYXRlQXZlcmFnZSgkYywgY3VycmVudFZhbHVlKTtcclxuICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgY3VycmVudFZhbHVlKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFRoZSBpbi1lZGl0b3IgbGluayAjc2hvdy1tb3JlLWF0dHJpYnV0ZXMgbXVzdCBzaG93L2hpZGUgdGhlIGNvbnRhaW5lciBvZlxyXG4gIGV4dHJhIGF0dHJpYnV0ZXMgZm9yIHRoZSBwYWNrYWdlL3ByaWNpbmctaXRlbS4gVGhpcyBzZXR1cHMgdGhlIHJlcXVpcmVkIGhhbmRsZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcikge1xyXG4gIC8vIEhhbmRsZXIgZm9yICdzaG93LW1vcmUtYXR0cmlidXRlcycgYnV0dG9uICh1c2VkIG9ubHkgb24gZWRpdCBhIHBhY2thZ2UpXHJcbiAgJGVkaXRvci5maW5kKCcuc2hvdy1tb3JlLWF0dHJpYnV0ZXMnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGF0dHMgPSAkdC5zaWJsaW5ncygnLnNlcnZpY2VzLW5vdC1jaGVja2VkJyk7XHJcbiAgICBpZiAoYXR0cy5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ3Nob3ctdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuaGlkZSgnZmFzdCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdoaWRlLXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLnNob3coJ2Zhc3QnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufSIsIi8qKlxyXG4gIHByaXZhY3lTZXR0aW5nczogU2V0dXAgZm9yIHRoZSBzcGVjaWZpYyBwYWdlLWZvcm0gZGFzaGJvYXJkL3ByaXZhY3kvcHJpdmFjeXNldHRpbmdzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBUT0RPIEltcGxlbWVudCBkZXBlbmRlbmNpZXMgY29tbWluZyBmcm9tIGFwcC5qcyBpbnN0ZWFkIG9mIGRpcmVjdCBsaW5rXHJcbi8vdmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnc21vb3RoQm94QmxvY2snKTtcclxuLy8gVE9ETyBSZXBsYWNlIGRvbS1yZXNzb3VyY2VzIGJ5IGkxOG4uZ2V0VGV4dFxyXG5cclxudmFyIHByaXZhY3kgPSB7XHJcbiAgYWNjb3VudExpbmtzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeVNldHRpbmdzLW15QWNjb3VudCBhJyxcclxuICByZXNzb3VyY2VzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeS1hY2NvdW50UmVzc291cmNlcydcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcHJpdmFjeTtcclxuXHJcbnByaXZhY3kub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5jYW5jZWwtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UoJGMpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGMub24oJ2NsaWNrJywgcHJpdmFjeS5hY2NvdW50TGlua3NTZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBiLFxyXG4gICAgICBscmVzID0gJGMuZmluZChwcml2YWN5LnJlc3NvdXJjZXNTZWxlY3Rvcik7XHJcblxyXG4gICAgc3dpdGNoICgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkge1xyXG4gICAgICBjYXNlICcjZGVsZXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWxldGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjZGVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNyZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5yZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmIChiKSB7XHJcbiAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogYi5vZmZzZXQoKS50b3AgfSwgNTAwLCBudWxsKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbn07IiwiLyoqIFNlcnZpY2UgQXR0cmlidXRlcyBWYWxpZGF0aW9uOiBpbXBsZW1lbnRzIHZhbGlkYXRpb25zIHRocm91Z2ggdGhlIFxyXG4gICdjdXN0b21WYWxpZGF0aW9uJyBhcHByb2FjaCBmb3IgJ3Bvc2l0aW9uIHNlcnZpY2UgYXR0cmlidXRlcycuXHJcbiAgSXQgdmFsaWRhdGVzIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgY2F0ZWdvcnksIGFsbW9zdC1vbmUgb3Igc2VsZWN0LW9uZSBtb2Rlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnTEMvZ2V0VGV4dCcpO1xyXG52YXIgdmggPSByZXF1aXJlKCdMQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuLyoqIEVuYWJsZSB2YWxpZGF0aW9uIG9mIHJlcXVpcmVkIHNlcnZpY2UgYXR0cmlidXRlcyBvblxyXG4gIHRoZSBmb3JtKHMpIHNwZWNpZmllZCBieSB0aGUgc2VsZWN0b3Igb3IgcHJvdmlkZWRcclxuKiovXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cFNlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbihjb250YWluZXJTZWxlY3Rvciwgb3B0aW9ucykge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICByZXF1aXJlZFNlbGVjdG9yOiAnLkRhc2hib2FyZFNlcnZpY2VzLWF0dHJpYnV0ZXMtY2F0ZWdvcnkuaXMtcmVxdWlyZWQnLFxyXG4gICAgc2VsZWN0T25lQ2xhc3M6ICdqcy12YWxpZGF0aW9uU2VsZWN0T25lJyxcclxuICAgIGdyb3VwRXJyb3JDbGFzczogJ2lzLWVycm9yJyxcclxuICAgIHZhbEVycm9yVGV4dEtleTogJ3JlcXVpcmVkLWF0dHJpYnV0ZS1jYXRlZ29yeS1lcnJvcidcclxuICB9LCBvcHRpb25zKTtcclxuXHJcbiAgJGMuZWFjaChmdW5jdGlvbiB2YWxpZGF0ZVNlcnZpY2VBdHRyaWJ1dGVzKCkge1xyXG4gICAgdmFyIGYgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFmLmlzKCdmb3JtJykpIHtcclxuICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIGVsZW1lbnQgdG8gYXBwbHkgdmFsaWRhdGlvbiBtdXN0IGJlIGEgZm9ybScpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZi5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJywge1xyXG4gICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWxpZCA9IHRydWUsIGxhc3RWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgdmFyIHYgPSB2aC5maW5kVmFsaWRhdGlvblN1bW1hcnkoZik7XHJcblxyXG4gICAgICAgIGYuZmluZChvcHRpb25zLnJlcXVpcmVkU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGZzID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBjYXQgPSBmcy5jaGlsZHJlbignbGVnZW5kJykudGV4dCgpO1xyXG4gICAgICAgICAgLy8gV2hhdCB0eXBlIG9mIHZhbGlkYXRpb24gYXBwbHk/XHJcbiAgICAgICAgICBpZiAoZnMuaXMoJy4nICsgb3B0aW9ucy5zZWxlY3RPbmVDbGFzcykpXHJcbiAgICAgICAgICAvLyBpZiB0aGUgY2F0IGlzIGEgJ3ZhbGlkYXRpb24tc2VsZWN0LW9uZScsIGEgJ3NlbGVjdCcgZWxlbWVudCB3aXRoIGEgJ3Bvc2l0aXZlJ1xyXG4gICAgICAgICAgLy8gOnNlbGVjdGVkIHZhbHVlIG11c3QgYmUgY2hlY2tlZFxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAhIShmcy5maW5kKCdvcHRpb246c2VsZWN0ZWQnKS52YWwoKSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAvLyBPdGhlcndpc2UsIGxvb2sgZm9yICdhbG1vc3Qgb25lJyBjaGVja2VkIHZhbHVlczpcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gKGZzLmZpbmQoJ2lucHV0OmNoZWNrZWQnKS5sZW5ndGggPiAwKTtcclxuXHJcbiAgICAgICAgICBpZiAoIWxhc3RWYWxpZCkge1xyXG4gICAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmcy5hZGRDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHZhciBlcnIgPSBnZXRUZXh0KG9wdGlvbnMudmFsRXJyb3JUZXh0S2V5LCBjYXQpO1xyXG4gICAgICAgICAgICBpZiAodi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgIHYuY2hpbGRyZW4oJ3VsJykuYXBwZW5kKCQoJzxsaS8+JykudGV4dChlcnIpLmF0dHIoJ3RpdGxlJywgY2F0KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodmFsaWQpIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChmKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsaWQ7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxufTtcclxuIiwiLyoqIEl0IHByb3ZpZGVzIHRoZSBjb2RlIGZvciB0aGUgYWN0aW9ucyBvZiB0aGUgVmVyaWZpY2F0aW9ucyBzZWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuLy92YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG4vL3ZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcblxyXG52YXIgYWN0aW9ucyA9IGV4cG9ydHMuYWN0aW9ucyA9IHt9O1xyXG5cclxuYWN0aW9ucy5mYWNlYm9vayA9IGZ1bmN0aW9uICgpIHtcclxuICAvKiBGYWNlYm9vayBjb25uZWN0ICovXHJcbiAgdmFyIEZhY2Vib29rQ29ubmVjdCA9IHJlcXVpcmUoJ0xDL0ZhY2Vib29rQ29ubmVjdCcpO1xyXG4gIHZhciBmYiA9IG5ldyBGYWNlYm9va0Nvbm5lY3Qoe1xyXG4gICAgcmVzdWx0VHlwZTogJ2pzb24nLFxyXG4gICAgdXJsU2VjdGlvbjogJ1ZlcmlmeScsXHJcbiAgICBhcHBJZDogJCgnaHRtbCcpLmRhdGEoJ2ZiLWFwcGlkJyksXHJcbiAgICBwZXJtaXNzaW9uczogJ2VtYWlsLHVzZXJfYWJvdXRfbWUnLFxyXG4gICAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZydcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihmYi5jb25uZWN0ZWRFdmVudCwgZnVuY3Rpb24gKCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ3BvcHVwLWNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBmYi5jb25uZWN0KCk7XHJcbn07XHJcblxyXG5hY3Rpb25zLmVtYWlsID0gZnVuY3Rpb24gKCkge1xyXG4gIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvJFJlc2VuZENvbmZpcm1hdGlvbkVtYWlsL25vdy8nLCBwb3B1cC5zaXplKCdzbWFsbCcpKTtcclxufTtcclxuXHJcbnZhciBsaW5rcyA9IGV4cG9ydHMubGlua3MgPSB7XHJcbiAgJyNjb25uZWN0LXdpdGgtZmFjZWJvb2snOiBhY3Rpb25zLmZhY2Vib29rLFxyXG4gICcjY29uZmlybS1lbWFpbCc6IGFjdGlvbnMuZW1haWxcclxufTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZXQgdGhlIGFjdGlvbiBsaW5rIG9yIGVtcHR5XHJcbiAgICB2YXIgbGluayA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XHJcblxyXG4gICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uIGF0dGFjaGVkIHRvIHRoYXQgbGlua1xyXG4gICAgdmFyIGFjdGlvbiA9IGxpbmtzW2xpbmtdIHx8IG51bGw7XHJcbiAgICBpZiAodHlwZW9mIChhY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGFjdGlvbigpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IFdlZWtseSBTY2hlZHVsZSBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCdMQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIHdvcmtIb3Vyc0xpc3QgPSBhdmFpbGFiaWxpdHlDYWxlbmRhci5Xb3JrSG91cnMuZW5hYmxlQWxsKCk7XHJcbiAgXHJcbiAgJC5lYWNoKHdvcmtIb3Vyc0xpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICB2YXIgd29ya2hvdXJzID0gdGhpcztcclxuXHJcbiAgICAvLyBTZXR1cGluZyB0aGUgV29ya0hvdXJzIGNhbGVuZGFyIGRhdGEgc2F2ZSB3aGVuIHRoZSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4gICAgdmFyIGZvcm0gPSB3b3JraG91cnMuJGVsLmNsb3Nlc3QoJ2Zvcm0uYWpheCwgZmllbGRzZXQuYWpheCcpO1xyXG4gICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT13b3JraG91cnNdJyk7XHJcbiAgICBpZiAoZmllbGQubGVuZ3RoID09PSAwKVxyXG4gICAgICBmaWVsZCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIndvcmtob3Vyc1wiIC8+JykuYXBwZW5kVG8oZm9ybSk7XHJcbiAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeSh3b3JraG91cnMuZGF0YSkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRGlzYWJsaW5nIGNhbGVuZGFyIG9uIGZpZWxkIGFsbHRpbWVcclxuICAgIGZvcm0uZmluZCgnW25hbWU9YWxsdGltZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIGNsID0gd29ya2hvdXJzLmNsYXNzZXMuZGlzYWJsZWQ7XHJcbiAgICAgIGlmIChjbClcclxuICAgICAgICB3b3JraG91cnMuJGVsLnRvZ2dsZUNsYXNzKGNsLCAkdC5wcm9wKCdjaGVja2VkJykpO1xyXG4gICAgfSk7XHJcblxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFVzZXIgcHJpdmF0ZSBkYXNoYm9hcmQgc2VjdGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIENvZGUgb24gcGFnZSByZWFkeVxyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAvKiBTaWRlYmFyICovXHJcbiAgdmFyIFxyXG4gICAgdG9nZ2xlID0gcmVxdWlyZSgnLi4vTEMvdG9nZ2xlJyksXHJcbiAgICBQcm92aWRlclBvc2l0aW9uID0gcmVxdWlyZSgnLi4vTEMvUHJvdmlkZXJQb3NpdGlvbicpO1xyXG4gIC8vIEF0dGFjaGluZyAnY2hhbmdlIHBvc2l0aW9uJyBhY3Rpb24gdG8gdGhlIHNpZGViYXIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIFxyXG4gICAgICAkdCA9ICQodGhpcyksXHJcbiAgICAgIHYgPSAkdC50ZXh0KCksXHJcbiAgICAgIG4gPSB0b2dnbGUodiwgWydvbicsICdvZmYnXSksXHJcbiAgICAgIHBvc2l0aW9uSWQgPSAkdC5jbG9zZXN0KCdbZGF0YS1wb3NpdGlvbi1pZF0nKS5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG5cclxuICAgIHZhciBwb3MgPSBuZXcgUHJvdmlkZXJQb3NpdGlvbihwb3NpdGlvbklkKTtcclxuICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICR0LnRleHQoc3RhdGUpO1xyXG4gICAgfSlcclxuICAgIC5jaGFuZ2VTdGF0ZShuKTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8qIFByb21vdGUgKi9cclxuICB2YXIgZ2VuZXJhdGVCb29rTm93QnV0dG9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uJyk7XHJcbiAgLy8gTGlzdGVuIG9uIERhc2hib2FyZFByb21vdGUgaW5zdGVhZCBvZiB0aGUgbW9yZSBjbG9zZSBjb250YWluZXIgRGFzaGJvYXJkQm9va05vd0J1dHRvblxyXG4gIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbi5vbignLkRhc2hib2FyZFByb21vdGUnKTsgLy8nLkRhc2hib2FyZEJvb2tOb3dCdXR0b24nXHJcblxyXG4gIC8qIFByaXZhY3kgKi9cclxuICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgcHJpdmFjeVNldHRpbmdzLm9uKCcuRGFzaGJvYXJkUHJpdmFjeScpO1xyXG5cclxuICAvKiBQYXltZW50cyAqL1xyXG4gIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgcGF5bWVudEFjY291bnQub24oJy5EYXNoYm9hcmRQYXltZW50cycpO1xyXG5cclxuICAvKiBQcm9maWxlIHBob3RvICovXHJcbiAgdmFyIGNoYW5nZVByb2ZpbGVQaG90byA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90bycpO1xyXG4gIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gIC8qIEFib3V0IHlvdSAvIGVkdWNhdGlvbiAqL1xyXG4gIHZhciBlZHVjYXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9lZHVjYXRpb25DcnVkbCcpO1xyXG4gIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gIC8qIEFib3V0IHlvdSAvIHZlcmlmaWNhdGlvbnMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQWN0aW9ucycpLm9uKCcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbicpLnNldHVwKCQoJy5EYXNoYm9hcmRZb3VyV29yayBmb3JtJykpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBwcmljaW5nICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9sb2NhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gbGljZW5zZXMgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAvKiBZb3VyIHdvcmsgLyBwaG90b3MgKi9cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSScpLm9uKCcuRGFzaGJvYXJkWW91cldvcmsnKTtcclxuXHJcbiAgLyogWW91ciB3b3JrIC8gcmV2aWV3cyAqL1xyXG4gICQoJy5EYXNoYm9hcmRZb3VyV29yaycpLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG4gICAgLy8gUmVzZXRpbmcgdGhlIGVtYWlsIGFkZHJlc3NlcyBvbiBzdWNjZXNzIHRvIGF2b2lkIHJlc2VuZCBhZ2FpbiBtZXNzYWdlcyBiZWNhdXNlXHJcbiAgICAvLyBtaXN0YWtlIG9mIGEgc2Vjb25kIHN1Ym1pdC5cclxuICAgIHZhciB0YiA9ICQoJy5EYXNoYm9hcmRSZXZpZXdzIFtuYW1lPWNsaWVudHNlbWFpbHNdJyk7XHJcbiAgICAvLyBPbmx5IGlmIHRoZXJlIHdhcyBhIHZhbHVlOlxyXG4gICAgaWYgKHRiLnZhbCgpKSB7XHJcbiAgICAgIHRiXHJcbiAgICAgIC52YWwoJycpXHJcbiAgICAgIC5hdHRyKCdwbGFjZWhvbGRlcicsIHRiLmRhdGEoJ3N1Y2Nlc3MtbWVzc2FnZScpKVxyXG4gICAgICAvLyBzdXBwb3J0IGZvciBJRSwgJ25vbi1wbGFjZWhvbGRlci1icm93c2VycydcclxuICAgICAgLnBsYWNlaG9sZGVyKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qIEF2YWlsYWJpbHR5ICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NhbGVuZGFyU3luYycpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvYXBwb2ludG1lbnRzQ3J1ZGwnKS5vbignLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpO1xyXG59KTsiXX0=
