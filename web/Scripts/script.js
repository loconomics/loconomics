/* Author: Loconomics */
// OUR namespace (abbreviated Loconomics)
var LC = window['LC'] || {};

/* Generic blockUI options sets */
var loadingBlock = { message: '<img class="loading-indicator" src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' };
var errorBlock = function (error, reload, style) {
    return {
        css: $.extend({ cursor: 'default' }, style || {}),
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">There was an error'
            + (error ? ': ' + error : '')
            + (reload ? ' <a href="javascript: ' + reload + ';">Click to reload</a>' : '')
            + '</div>'
    }
};
var infoBlock = function (message, options) {
    return $.extend({
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">' + message + '</div>'
        /*,css: { cursor: 'default' }*/
        ,overlayCSS: { cursor: 'default' }
    }, options);
}
LC.moveFocusTo = function (el, options) {
    options = $.extend({
        marginTop: 30
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, 500, null);
};
$.blockUI.defaults.onBlock = function () {
    // Scroll to block-message to don't lost in large pages:
    LC.moveFocusTo(this);
};
var gLoadingRetard = 300;

// Array Remove - By John Resig (MIT Licensed)
/*Array.prototype.remove = function (from, to) {
  IagoSRL: it seems incompatible with Modernizr loader feature loading Zendesk script,
  moved from prototype to a class-static method */    
Array.remove = function (anArray, from, to) {
    var rest = anArray.slice((to || from) + 1 || anArray.length);
    anArray.length = from < 0 ? anArray.length + from : from;
    return anArray.push.apply(anArray, rest);
};

/* Some additions on Javascript native objects
 */
/** Polyfill for string.contains
 **/
if (!('contains' in String.prototype))
    String.prototype.contains = function (str, startIndex) { return -1 !== this.indexOf(str, startIndex); };

/*
* Our jQuery additions (small plugins)
*/
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
$.fn.hasScrollBar = function (extragap) {
    extragap = $.extend({
        x: 0,
        y: 0
    }, extragap);
    if (!this || this.length == 0) return { vertical: false, horizontal: false };
    //note: clientHeight= height of holder
    //scrollHeight= we have content till this height
    var t = this.get(0);
    return {
        vertical: this.outerHeight(false) < (t.scrollHeight + extragap.y),
        horizontal: this.outerWidth(false) < (t.scrollWidth + extragap.x)
    };
}
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
$.fn.are = function(selector, modifier){
    modifier = modifier || 'all';
    var count = 0;
    this.each(function(){
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
        default: {
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
}
/**
    Gets the html string of the first element and all its content.
    The 'html' method only retrieves the html string of the content, not the element itself.
**/
$.fn.outerHtml = function () {
    if (!this || this.length == 0) return '';
    var el = this.get(0);
    var html = '';
    if (el.outerHTML)
        html = el.outerHTML;
    else {
        html = this.wrapAll('<div></div>').parent().html();
        this.unwrap();
    }
    return html;
}
$.fn.reload = function (newurl, onload) {
    var options = {
        url: newurl,
        complete: onload,
        autofocus: true,
        loading: {
            lockElement: true,
            lockOptions: {},
            message: null,
            showLoadingIndicator: true
        }
    };
    // If options object is passed as unique parameter
    if (arguments.length == 1 && $.isPlainObject(arguments[0])) {
        // Unset the options object from url property
        options.url = null;
        // Merge options:
        $.extend(true, options, arguments[0]);
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
        var reloadMode = $t.data('reload-mode');

        if (url) {
            // Loading, with retard
            var loadingtimer = options.loading.lockElement ?
                setTimeout(function () {
                    // Creating content using a fake temp parent element to preload image and to get real message width:
                    var loadingcontent = $('<div/>')
                    .append(options.loading.message ? $('<div class="loading-message"/>').append(options.loading.message) : null)
                    .append(options.loading.showLoadingIndicator ? loadingBlock.message : null);
                    loadingcontent.css({ position: 'absolute', left: -99999 }).appendTo('body');
                    var w = loadingcontent.width();
                    loadingcontent.detach();
                    // Locking:
                    options.loading.lockOptions.autofocus = options.autofocus;
                    options.loading.lockOptions.width = w;
                    smoothBoxBlock(loadingcontent.html(), $t, options.loading.message ? 'custom-loading' : 'loading', options.loading.lockOptions);
                    //$t.block(loadingBlock);
                }, gLoadingRetard)
                : null;
            var ctx = {
                form: $t,
                box: $t,
                loadingtimer: loadingtimer,
                boxIsContainer: (reloadMode != 'replace-me')
            };
            // Do the Ajax post
            jq = $.ajax({
                url: url,
                type: 'GET',
                context: ctx,
                success: ajaxFormsSuccessHandler,
                error: ajaxErrorPopupHandler,
                complete: ajaxFormsCompleteHandler
            });
            jq.done(function () {
                $t.data('isReloading', null);
            });
            if (options.complete)
                jq.done($.proxy(options.complete, $t));
            // Mark element as is being reloaded, to avoid multiple attemps at same time, saving
            // current ajax object to allow be cancelled
            jq.url = url;
            $t.data('isReloading', jq);
        }
    });
    return this;
}
/** Checks if current element or one of the current set of elements has
    a parent that match the element or expression given as first parameter
**/
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};

/*
* Tabbed interface logic
*/
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
        .delegate('.tabbed > .tabs-slider > a', 'click', function () { return false })
        .delegate('.tabbed > .tabs-slider-limit', 'mouseenter', TabbedUX.startMoveTabsSlider)
        .delegate('.tabbed > .tabs-slider-limit', 'mouseleave', TabbedUX.endMoveTabsSlider)
        .delegate('.tabbed > .tabs > li.removable', 'click', function () { TabbedUX.removeTab(null, this) });

        // Init page loaded tabbed containers:
        $('.tabbed').each(function () {
            var $t = $(this);
            // Consistence check: this must be a valid container, this is, must have .tabs
            if ($t.children('.tabs').length == 0)
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
        var speed = .3; /* speed unit: pixels/miliseconds */
        var fxa = function () { TabbedUX.checkTabSliderLimits(tabs.parent(), tabs) };
        if (t.hasClass('right')) {
            // Calculate time based on speed we want and how many distance there is:
            var time = (tabs[0].scrollWidth - tabs[0].scrollLeft - tabs.width()) * 1 / speed;
            tabs.animate({ scrollLeft: tabs[0].scrollWidth - tabs.width() },
            { duration: time, step: fxa, complete: fxa, easing: 'swing' });
        } else {
            // Calculate time based on speed we want and how many distance there is:
            var time = tabs[0].scrollLeft * 1 / speed;
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
        if (tabContainer.children('.tabs').hasScrollBar({ x: -2 }).horizontal == true) {
            tabContainer.addClass('has-tabs-slider');
            if (ts.length == 0) {
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
        if (!ctx.tab || ctx.tab.length != 1 || !ctx.menuitem || ctx.menuitem.length != 1
            || !ctx.tabContainer || ctx.tabContainer.length != 1 || !ctx.menuanchor || ctx.menuanchor.length != 1) {
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
            document.getElementById(idName) == null) {
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

/*= ChangesNotification class
 * to notify user about changes in forms,
 * tabs, that will be lost if go away from
 * the page. It knows when a form is submitted
 * and saved to disable notification, and gives
 * methods for other scripts to notify changes
 * or saving.
 */
LC.ChangesNotification = {
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
            return LC.ChangesNotification.notify();
        });
        options = $.extend(this.defaults, options);
        if (!options.target)
            options.target = document;
        if (options.genericChangeSupport)
            $(options.target).on('change', 'form:not(.changes-notification-disabled) :input[name]', function () {
                LC.ChangesNotification.registerChange($(this).closest('form').get(0), this);
            })
        if (options.genericSubmitSupport)
            $(options.target).on('submit', 'form:not(.changes-notification-disabled)', function () {
                LC.ChangesNotification.registerSave(this);
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
        var fname = LC.getXPath(f);
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
            if (typeof (e.defaultValue) != 'undefined'
                 && typeof (e.checked) == 'undefined'
                 && typeof (e.selected) == 'undefined'
                 && e.value == e.defaultValue) {
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
        var fname = LC.getXPath(f);
        if (!this.changesList[fname]) return;
        var prevEls = $.extend([], this.changesList[fname]);
        var r = true;
        if (els) {
            this.changesList[fname] = $.grep(this.changesList[fname], function (el) { return ($.inArray(el, els) == -1); });
            // Don't remove 'f' list if is not empty
            r = this.changesList[fname].length == 0;
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
        if (els) $.each(els, function () { $('[name="' + escapeJQuerySelectorValue(this) + '"]').removeClass(lchn.defaults.changedElementClass) });
        return prevEls;
    }
};
/** Sanitize the whitespaces in a text by:
- replacing contiguous whitespaces characteres (any number of repetition 
and any kind of white character) by a normal white-space
- replace encoded non-breaking-spaces by a normal white-space
- remove starting and ending white-spaces
- ever return a string, empty when null
**/
LC.sanitizeWhitepaces = function LC_sanitizeWhitespaces(text) {
    // Ever return a string, empty when null
    text = (text || '')
    // Replace any kind of contiguous whitespaces characters by a single normal white-space
    // (thats include replace enconded non-breaking-spaces,
    // and duplicated-repeated appearances)
    .replace(/\s+/g, ' ')
    // Remove starting and ending whitespaces
    return $.trim(text);
};
/** Returns the path to the given element in XPath convention
 **/
LC.getXPath = function (element) {
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = $(element.parentNode).children(element.tagName).index(element) + 1;
        id > 1 ? (id = '[' + id + ']') : (id = '');
        xpath = '/' + element.tagName.toLowerCase() + id + xpath;
    }
    return xpath;
};
/** An i18n utility, get a translation text by looking for specific elements in the html
    with the name given as first paramenter and applying the given values on second and 
    other parameters.
**/
LC.getText = function () {
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
};
/** Base class 'enum' with utility methods for objects that are used as enumerations.
    Its NOT a class to instantiate or to use as base for enumerations, else enumerations
    are plain objects with properties-values only.
**/
LC.enum = {
    parse: function (enumType, str, caseSensitive) {
        if (caseSensitive)
            return enumType[str] || null;
        str = str.toLowerCase();
        for (var e in enumType)
            if (e.toLowerCase && e.toLowerCase() == str)
                return enumType[e];
        return null;
    }
}
/** Enumeration to be uses by functions that implements 'rounding' operations on different
    data types.
    It holds the different ways a rounding operation can be apply.
**/
LC.roundingTypeEnum = {
    Down: -1,
    Nearest: 0,
    Up: 1
};
/** Apply ever a redirect to the given URL, if this is an internal URL or same
    page, it forces a page reload for the given URL.
**/
LC.redirectTo = function (url) {
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
        // If page not changed (same url or internal link), page continue executing next refresh:
        if (!redirected)
            window.location.reload();
    }, 50);
};
LC.connectPopupAction = function (applyToSelector) {
    applyToSelector = applyToSelector || '.popup-action';
    $(document).on('click', applyToSelector, function () {
        var c = $($(this).attr('href')).clone();
        if (c.length == 1)
            smoothBoxBlock(c, document, null, { closable: true, center: true });
        return false;
    });
}
LC.setupValidation = function (reapplyOnlyTo) {
    reapplyOnlyTo = reapplyOnlyTo || document;
    if (!window['jqueryValidateUnobtrusiveLoaded']) window['jqueryValidateUnobtrusiveLoaded'] = false;
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
            $(document).removeData('validator');
            $(document).removeData('unobtrusiveValidation');
            $.validator.unobtrusive.parse(reapplyOnlyTo);
        }
    }
}
// TODO: look for better name, better working (typo error: is interchangeable not interchangle :-S)
LC.dateToInterchangleString = function (date) {
    var m = (date.getUTCMonth() + 1).toString(),
        d = date.getUTCDate().toString();
    if (m.length == 1)
        m = '0' + m;
    if (d.length == 1)
        d = '0' + d;
    return date.getUTCFullYear().toString() + '-' + m + '-' + d;
};
/** timeSpan class to manage times, parse, format, compute.
    Its not so complete as the C# ones but is usefull still.
**/
LC.timeSpan = function (days, hours, minutes, seconds, milliseconds) {
    this.days = Math.floor(parseFloat(days)) || 0;
    this.hours = Math.floor(parseFloat(hours)) || 0;
    this.minutes = Math.floor(parseFloat(minutes)) || 0;
    this.seconds = Math.floor(parseFloat(seconds)) || 0;
    this.milliseconds = Math.floor(parseFloat(milliseconds)) || 0;

    this.toString = function LC_timeSpan_proto_toString() {
        // function 'to string with two digits almost'
        function t(n) {
            return Math.floor(n / 10) + '' + n % 10;
        }
        var h = t(this.hours),
            d = (this.days > 0 ? this.days.toString() + LC.timeSpan.decimalsDelimiter : ''),
            m = t(this.minutes),
            s = t(this.seconds + this.milliseconds / 1000);
        return (
            d +
            h + LC.timeSpan.unitsDelimiter +
            m + LC.timeSpan.unitsDelimiter +
            s);
    };
    this.valueOf = function LC_timeSpan_proto_valueOf() {
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
LC.timeSpan.fromMilliseconds = function LC_timeSpan_proto_fromMilliseconds(milliseconds) {
    var ms = milliseconds % 1000,
        s = Math.floor(milliseconds / 1000) % 60,
        m = Math.floor(milliseconds / 60000) % 60,
        h = Math.floor(milliseconds / 3600000) % 24,
        d = Math.floor(milliseconds / (3600000 * 24));
    return new LC.timeSpan(d, h, m, s, ms);
};
/** It creates a timeSpan object based on a decimal seconds
**/
LC.timeSpan.fromSeconds = function LC_timeSpan_proto_fromSeconds(seconds) {
    return this.fromMilliseconds(seconds * 1000);
};
/** It creates a timeSpan object based on a decimal minutes
**/
LC.timeSpan.fromMinutes = function LC_timeSpan_proto_fromMinutes(minutes) {
    return this.fromSeconds(minutes * 60);
};
/** It creates a timeSpan object based on a decimal hours
**/
LC.timeSpan.fromHours = function LC_timeSpan_proto_fromHours(hours) {
    return this.fromMinutes(hours * 60);
};
/** It creates a timeSpan object based on a decimal days
**/
LC.timeSpan.fromDays = function LC_timeSpan_proto_fromDays(days) {
    return this.fromHours(days * 24);
};

// For spanish and english works good ':' as unitsDelimiter and '.' as decimalDelimiter
// TODO: this must be set from a global LC.i18n var localized for current user
LC.timeSpan.unitsDelimiter = ':';
LC.timeSpan.decimalsDelimiter = '.';
LC.timeSpan.parse = function (strtime) {
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
    return new LC.timeSpan(d, h, m, s, ms);
};
LC.timeSpan.zero = new LC.timeSpan(0, 0, 0, 0, 0);
LC.timeSpan.prototype.isZero = function LC_timeSpan_proto_isZero() {
    return (
        this.days == 0 &&
        this.hours == 0 &&
        this.minutes == 0 &&
        this.seconds == 0 &&
        this.milliseconds == 0
    );
};
LC.smartTime = function LC_smartTime(time) {
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
LC.timeSpan.prototype.toSmartString = function LC_timeSpan_proto_toSmartString() { return LC.smartTime(this) };
LC.timeSpan.prototype.totalMilliseconds = function LC_timeSpan_proto_totalMilliseconds() {
    return this.valueOf();
};
LC.timeSpan.prototype.totalSeconds = function LC_timeSpan_proto_totalSeconds() {
    return (this.totalMilliseconds() / 1000);
};
LC.timeSpan.prototype.totalMinutes = function LC_timeSpan_proto_totalMinutes() {
    return (this.totalSeconds() / 60);
};
LC.timeSpan.prototype.totalHours = function LC_timeSpan_proto_totalHours() {
    return (this.totalMinutes() / 60);
};
LC.timeSpan.prototype.totalDays = function LC_timeSpan_proto_totalDays() {
    return (this.totalHours() / 24);
};
/** Rounds a time to the nearest 15 minutes fragment.
    @roundTo specify the LC.roundingTypeEnum about how to round the time (down, nearest or up)
**/
LC.roundTimeToQuarterHour = function LC_roundTimeToQuarterHour(time, /* LC.roundingTypeEnum */roundTo) {
    var restFromQuarter = time.totalHours() % .25;
    var hours = time.totalHours();
    if (restFromQuarter > 0.0) {
        switch (roundTo) {
            case LC.roundingTypeEnum.Down:
                hours -= restFromQuarter;
                break;
            default:
            case LC.roundingTypeEnum.Nearest:
                var limit = .25 / 2;
                if (restFromQuarter >= limit) {
                    hours += (.25 - restFromQuarter);
                } else {
                    hours -= restFromQuarter;
                }
                break;
            case LC.roundingTypeEnum.Up:
                hours += (.25 - restFromQuarter);
                break;
        }
    }
    return LC.timeSpan.fromHours(hours);
};

/* Focus the first element in the document (or in @container)
    with the html5 attribute 'autofocus' (or alternative @cssSelector).
    It's fine as a polyfill and for ajax loaded content that will not
    get the browser support of the attribute.
*/
LC.autoFocus = function (container, cssSelector) {
    container = $(container || document);
    container.find(cssSelector || '[autofocus]').focus();
};
/**
  * Placeholder polyfill.
  * Adds a new jQuery placeHolder method to setup or reapply placeHolder
  * on elements (recommented to be apply only to selector '[placeholder]');
  * thats method is fake on browsers that has native support for placeholder
 **/
LC.placeHolder = function() {
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

/** Create labels for a jquery-ui-slider.
**/
LC.createLabelsForUISlider = function LC_createLabelsForUISlider(slider) {
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
        steps = Math.floor((max - min) / step),
        sw = 100 / steps;

    // Creating and positioning labels
    for (var i = 0; i <= steps; i++) {
        // Create label
        var lbl = $('<div class="ui-slider-label"/>');
        // Setup label with its value
        var labelValue = min + i * step;
        lbl.text(labelValue);
        lbl.data('ui-slider-value', labelValue);
        // Positionate
        var left = i * sw - sw * .5,
        right = 100 - left - sw,
        align = 'center';
        if (i == 0) {
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
};

// TODO Convert as general function and use everywhere:
// It executes the given 'ready' function as parameter when
// map environment is ready (when google maps api and script is 
// loaded and ready to use, or inmediately if is already loaded).
LC.mapReady = function (ready) {

    var mapIsReady = LC['_mapIsReady'] || false;
    var mapIsLoading = LC['_mapIsLoading'] || false;
    var mapCompleteStack = LC['_mapCompleteStack'] || [];
    mapCompleteStack.push(ready);
    LC['_mapCompleteStack'] = mapCompleteStack;
    if (mapIsReady)
        ready();
    else if (!mapIsLoading) {
        LC._mapIsLoading = true;
        LC.load({
            scripts: ["https://www.google.com/jsapi"],
            completeVerification: function () { return !!window['google'] },
            complete: function () {
                google.load("maps", "3.10", { other_params: "sensor=false", "callback": function () {
                    LC._mapIsReady = true;
                    LC._mapIsLoading = false;

                    for (var i = 0; i < mapCompleteStack.length; i++)
                        try {
                            mapCompleteStack[i]();
                        } catch (e) { }
                }
                });
            }
        });
    }
};

/* Localization */
LC.distanceUnits = {
    'ES': 'km',
    'US': 'miles'
};
LC.numericMilesSeparator = {
    'es-ES': '.',
    'es-US': '.',
    'en-US': ',',
    'en-ES': ','
};
LC.numericDecimalSeparator = {
    'es-ES': ',',
    'es-US': ',',
    'en-US': '.',
    'en-ES': '.'
};
LC.moneySymbolPrefix = {
    'ES': '',
    'US': '$'
};
LC.moneySymbolSufix = {
    'ES': '€',
    'US': ''
};
LC.getCurrentCulture = function () {
    var c = $('html').data('culture');
    var s = c.split('-');
    return {
        culture: c,
        language: s[0],
        country: s[1]
    };
};

/* CRUDL Helper */
LC.initCrudl = function () {
    $('.crudl').each(function () {
        var crudl = $(this);
        if (crudl.data('__crudl_initialized__') === true) return;
        var dctx = crudl.data('crudl-context') || '';
        var vwr = crudl.find('.crudl-viewer');
        var dtr = crudl.find('.crudl-editor');
        var iidpar = crudl.data('crudl-item-id-parameter') || 'ItemID';
        var formpars = { action: 'create' };
        formpars[iidpar] = 0;

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
            dtr.slideDown().reload(function (url, defaultUrl) {
                return defaultUrl + '?' + $.param(formpars) + xq;
            });
            // Hide viewer when in editor:
            //vwr.slideUp('slow');
            vwr.xhide({ effect: 'height', duration: 'slow' });
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
                dtr.show({ effect: 'slide', duration: 'slow', direction: 'down' }).reload(function (url, defaultUrl) {
                    return defaultUrl + '?' + $.param(formpars) + xq;
                });
                // Hide viewer when in editor:
                //vwr.slideUp('slow')
                vwr.xhide({ effect: 'height', duration: 'slow' });
                return false;
            })
            .on('click', '.crudl-delete', function () {
                var $t = $(this);
                var item = $t.closest('.crudl-item');
                var itemid = item.data('crudl-item-id');

                if (confirm(LC.getText('confirm-delete-crudl-item-message:' + dctx))) {
                    smoothBoxBlock('<div>' + LC.getText('delete-crudl-item-loading-message:' + dctx) + '</div>', item);
                    formpars[iidpar] = itemid;
                    formpars.action = 'delete';
                    var xq = getExtraQuery($(this));
                    $.ajax({
                        url: dtr.attr('data-source-url') + '?' + $.param(formpars) + xq,
                        success: function (data, text, jx) {
                            if (data && data.Code == 0) {
                                smoothBoxBlock('<div>' + data.Result + '</div>', item, null, {
                                    closable: true,
                                    closeOptions: {
                                        complete: function () {
                                            item.fadeOut('slow', function () { item.remove() });
                                        }
                                    }
                                });
                            } else
                                ajaxFormsSuccessHandler(data, text, jx);
                        },
                        error: function (jx, message, ex) {
                            ajaxErrorPopupHandler(jx, message, ex);
                            smoothBoxBlock(null, item);
                        },
                        complete: ajaxFormsCompleteHandler
                    });
                }
                return false;
            });
        function finishEdit() {
            dtr.slideUp('slow', function () {
                // Show again the Viewer
                //vwr.slideDown('slow');
                vwr.xshow({ effect: 'height', duration: 'slow' });
                // Mark the form as unchanged to avoid persisting warnings
                LC.ChangesNotification.registerSave(dtr.find('form').get(0));
                // Avoid cached content on the Editor
                dtr.children().remove();
            });
            // Mark form as saved to remove the 'has-changes' mark
            LC.ChangesNotification.registerSave(dtr.find('form').get(0));
            return false;
        }
        dtr
            .on('click', '.crudl-cancel', finishEdit)
            .on('ajaxSuccessPostMessageClosed', '.ajax-box', finishEdit)
            .on('ajaxSuccessPost', 'form', function (e, data) {
                if (data.Code == 0 || data.Code == 5 || data.Code == 6) {
                    // Show viewer and reload list:
                    //vwr.slideDown('slow')
                    vwr.xshow({ effect: 'height', duration: 'slow' })
                    .find('.crudl-list').reload({ autofocus: false });
                }
                if (data.Code == 5)
                    setTimeout(finishEdit, 1500);
            });

        crudl.data('__crudl_initialized__', true);
    });
};

/*******************
* Popup related 
* functions
*/
function popupSize(size) {
    var s = (size == 'large' ? .8 : (size == 'medium' ? .5 : (size == 'small' ? .2 : size || .5)));
    return {
        width: Math.round($(window).width() * s),
        height: Math.round($(window).height() * s),
        sizeFactor: s
    }
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
function popup(url, size, complete, loadingText, options){
    // Native popup
    //window.open(url);
    
    // Load options overwriting defaults
    options = $.extend({
        closable: {
            onLoad: false,
            afterLoad: true,
            onError: true
        }
    }, options);

    // Smart popup
    loadingText = loadingText || '';
    var swh;
    if (size && size.width)
        swh = size;
    else
        swh = popupSize(size);        
    
    $('div.blockUI.blockMsg.blockPage').addClass('fancy');
    $.blockUI({
       message: (options.closable.onLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '') +
       '<img src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' + loadingText,
       centerY: false,
       css: popupStyle(swh),
       overlayCSS: { cursor: 'default' },
       focusInput: true
    });

    // Loading Url with Ajax and place content inside the blocked-box
    $.ajax({ url: url,
        success: function (data) {
            // Add close button if requires it or empty message content to append then more
            $('.blockMsg').html(options.closable.afterLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '');
            var contentHolder = $('.blockMsg').append('<div class="content"/>').children('.content');

            if (typeof (data) === 'object') {
                if (data.Code && data.Code == 2) {
                    $.unblockUI();
                    popup(data.Result, { width: 410, height: 320 });
                } else {
                    // Unexpected code, show result
                    contentHolder.append(data.Result);
                }
            } else {
                // Page content got, paste into the popup if is partial html (url starts with$)
                if (/((^\$)|(\/\$))/.test(url)) {
                    contentHolder.append(data);
                    LC.autoFocus(contentHolder);
                } else {
                    // Else, if url is a full html page (normal page), put content into an iframe
                    var iframe = $('<iframe id="blockUIIframe" width="' + swh.width + '" height="' + swh.height + '" style="border:none;"></iframe>').get(0);
                    // When the iframe is ready
                    var iframeloaded = false;
                    iframe.onload = function () {
                        // Using iframeloaded to avoid infinite loops
                        if (!iframeloaded) {
                            iframeloaded = true;
                            injectIframeHtml(iframe, data);
                        }
                    };
                    // replace blocking element content (the loading) with the iframe:
                    contentHolder.remove();
                    $('.blockMsg').append(iframe);
                    LC.autoFocus(iframe);
                }
            }
        }, error: function (j, t, ex) {
            $('div.blockMsg').html((options.closable.onError ? '<a class="close-popup" href="#close-popup">X</a>' : '') + '<div class="content">Page not found</div>');
            if (console && console.info) console.info("Popup-ajax error: " + ex);
        }, complete: complete
    });

    $('.blockUI').on('click', '.close-popup', function () { $.unblockUI(); return false; });
    var returnedBlock = $('.blockUI');
    returnedBlock.closePopup = function () {
        $.unblockUI();
    };
    return returnedBlock;
}
function ajaxFormsSuccessHandler(data, text, jx) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    ctx.autoUnblockLoading = true;

    // If is a JSON result:
    if (typeof (data) === 'object') {
        // Clean previous validation errors
        setValidationSummaryAsValid(ctx.box);

        function showSuccessMessage(ctx, message) {
            // Unblock loading:
            ctx.box.unblock();
            // Block with message:
            var message = message || ctx.form.data('success-post-message') || 'Done!';
            ctx.box.block(infoBlock(message, {
                css: popupStyle(popupSize('small'))
            }))
            .on('click', '.close-popup', function () { ctx.box.unblock(); ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]); return false; });
            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
        function showOkGoPopup(ctx, data) {
            // Unblock loading:
            ctx.box.unblock();

            var content = $('<div class="ok-go-box"/>');
            content.append( $('<span class="success-message"/>').append(data.SuccessMessage) );
            if (data.AdditionalMessage)
                content.append( $('<div class="additional-message"/>').append(data.AdditionalMessage) );

            var okBtn = $('<a class="action ok-action close-action" href="#ok"/>').append(data.OkLabel);
            var goBtn = '';
            if (data.GoURL && data.GoLabel) {
                goBtn = $('<a class="action go-action"/>').attr('href', data.GoURL).append(data.GoLabel);
                // Forcing the 'close-action' in such a way that for internal links the popup gets closed in a safe way:
                goBtn.click(function () { okBtn.click(); ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]); });
            }

            content.append( $('<div class="actions clearfix"/>').append(okBtn).append(goBtn) );

            smoothBoxBlock(content, ctx.box, null, {
                closeOptions: {
                    complete: function () {
                        ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]);
                    }
                }
            });

            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
        if (data.Code == 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'
            showSuccessMessage(ctx, data.Result);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        // Special Code 1: do a redirect
        } else if (data.Code == 1) {
            LC.redirectTo(data.Result);
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
                LC.redirectTo(data.Result.RedirectURL);
            });
            showSuccessMessage(ctx, data.Result.SuccessMessage);
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
            showSuccessMessage(ctx, data.Result.Message);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code > 100) {
            // User Code: trigger custom event to manage results:
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx, ctx]);
        } else { // data.Code < 0
            // There is an error code.

            // Data not saved:
            if (ctx.changedElements)
                LC.ChangesNotification.registerChange(ctx.form.get(0), ctx.changedElements);

            // Unblock loading:
            ctx.box.unblock();
            // Block with message:
            var message = "Error: " + data.Code + ": " + JSON.stringify(data.Result ? (data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result) : '');
            smoothBoxBlock($('<div/>').append(message), ctx.box, null, { closable: true });

            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
    } else {
        // Post 'maybe' was wrong, html was returned to replace current 
        // form container: the ajax-box.

        // TODO: enable when jquery-1.9 Create html content from the data, in a secure way:
        //var newhtml = $($.parseHTML(data));
        var newhtml = $('#FAKEELEMENTEMPTYJQUERY');
        // Try-catch to avoid errors when an empty document or malformed is returned:
        try {
            newhtml = $(data);
        } catch (ex) { }

        // Check if the returned element is the ajax-box, if not, find
        // the element in the newhtml:
        var jb = newhtml;
        if (!ctx.boxIsContainer && !newhtml.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
        if (!jb || jb.length == 0) {
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
            LC.ChangesNotification.registerChange(
                ctx.form.get(0),
                ctx.changedElements
            );

        LC.autoFocus(jb);
        ctx.form.trigger('ajaxFormReturnedHtml', [jb, ctx.form, jx]);
    }
}
function ajaxFormsCompleteHandler() {
    // Disable loading
    clearTimeout(this.loadingtimer);
    // Unblock
    if (this.autoUnblockLoading) {
        // Double un-lock, because any of the two systems can being used:
        smoothBoxBlock(null, this.box);
        this.box.unblock();
    }
}
function ajaxErrorPopupHandler(jx, message, ex) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    // Data not saved:
    if (ctx.changedElements)
        LC.ChangesNotification.registerChange(ctx.form, ctx.changedElements);

    ctx.autoUnblockLoading = true;

    // If is a connection aborted, no show message.
    // readyState different to 'done:4' means aborted too, 
    // because window being closed/location changed
    if (message == 'abort' || jx.readyState != 4)
        return;

    var m = message;
    var iframe = null;
    size = popupSize('large');
    if (m == 'error') {
        iframe = $('<iframe id="blockUIIframe" width="' + size.width + '" height="' + (size.height - 34) + '"></iframe>').get(0);
        var iframeloaded = false;
        iframe.onload = function () {
            // Using iframeloaded to avoid infinite loops
            if (!iframeloaded) {
                iframeloaded = true;
                injectIframeHtml(iframe, jx.responseText);
            }
        };
        m = null;
    }  else
        m = m + "; " + ex;

    // Block all window, not only current element
    $.blockUI(errorBlock(m, null, popupStyle(size)));
    if (iframe)
        $('.blockMsg').append(iframe);
    $('.blockUI .close-popup').click(function () { $.unblockUI(); return false; });
}
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
function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)', 'i').exec(location.search) || [, null])[1]);
}
function getHashBangParameters(hashbangvalue) {
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
}
function setupDatePicker() {
    // Date Picker
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    applyDatePicker();
}
function applyDatePicker(element) {
    $(".date-pick", element || document)
        //.val(new Date().asString($.datepicker._defaults.dateFormat))
        .datepicker({
            showAnim: "blind"
        });
}
/* Returns true when str is
   - null
   - empty string
   - only white spaces string
*/
function isEmptyString(str) {
    return !(/\S/g.test(str||""));
}
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
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
/** Creates smart tooltips with possibilities for on hover and on click,
    additional description or external tooltip content.
**/
LC.initTooltips = function LC_initTooltips() {
    var posoffset = { x: 16, y: 8 };
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
        if (l.length == 0) return null;
        var c = l.data('tooltip-content');
        if (!c) {
            var h = LC.sanitizeWhitepaces(l.attr('title'));
            var d = LC.sanitizeWhitepaces(l.data('description'));
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
        if (LC.sanitizeWhitepaces(l.text()) == c &&
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
            // Show (animations are stopped only on hide to avoid conflicts)
            t.fadeIn();
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
    // Listen for events to show/hide tooltips
    var selector = '[title][data-description], [title].has-tooltip, [title].secure-data, [data-tooltip-url], [title].has-popup-tooltip';
    $('body').on('mousemove focusin', selector, showTooltip)
    .on('mouseleave focusout', selector, hideTooltip)
    // Listen event for clickable popup-tooltips
    .on('click', '[title].has-popup-tooltip', showTooltip)
    // Allowing buttons inside the tooltip
    .on('click', '.tooltip-button', function () { return false })
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
    // Review every popup tooltip to prepare content and mark/unmark the link or text:
    $(selector).each(function () {
        con($(this));
    });
};
/**
 * Hide an element using jQuery, allowing use standard  'hide' and 'fadeOut' effects, extended
 * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
 * Depending on options.effect:
 * - if not present, jQuery.hide(options)
 * - 'animate': jQuery.animate(options.properties, options)
 * - 'fade': jQuery.fadeOut
 */
LC.hideElement = function (element, options) {
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
        case 'size':
        default:
            $e.hide(options);
    }
    $e.trigger('xhide', [options]);
};
/** hideElement as a jQuery method: xhide
 **/
jQuery.fn.xhide = function xhide(options) {
    LC.hideElement(this, options);
    return this;
};
/**
* Show an element using jQuery, allowing use standard  'show' and 'fadeIn' effects, extended
* jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
* Depending on options.effect:
* - if not present, jQuery.hide(options)
* - 'animate': jQuery.animate(options.properties, options)
* - 'fade': jQuery.fadeOut
*/
LC.showElement = function (element, options) {
    var $e = $(element);
    switch (options.effect) {
        case 'animate':
            $e.animate(options.properties, options);
            break;
        case 'fade':
            $e.fadeIn(options);
            break;
        case 'height':
            $e.slideDown(options);
            break;
        case 'size':
        default:
            $e.show(options);
    }
    $e.trigger('xshow', [options]);
};
/** showElement as a jQuery method: xhide
**/
jQuery.fn.xshow = function xhide(options) {
    LC.showElement(this, options);
    return this;
};
/** Generic utility for highly configurable jQuery.toggle with support
    to specify the toggle value explicity for any kind of effect: just pass true as second parameter 'toggle' to show
    and false to hide. Toggle must be strictly a Boolean value to avoid auto-detection.
    Toggle parameter can be omitted to auto-detect it, and second parameter can be the animation options.
    All the others behave exactly as hideElement and showElement.
**/
LC.toggleElement = function (element, toggle, options) {
    // If toggle is not a boolean
    if (toggle !== true && toggle !== false) {
        // If toggle is an object, then is the options as second parameter
        if ($.isPlainObject(toggle))
            options = toggle;
        // Auto-detect toggle, it can vary on any element in the collection,
        // then detection and action must be done per element:
        $(element).each(function () {
            // Reusing function, with explicit toggle value
            LC.toggleElement(this, $(this).is(':visible'), options);
        });
    }
    if (toggle)
        showElement(element, options);
    else
        hideElement(element, options);
}
/** toggleElement as a jQuery method: xtoggle
 **/
jQuery.fn.xtoggle = function xtoggle(toggle, options) {
    LC.toggleElement(this, toggle, options);
    return this;
};
/** Custom Loconomics 'blockUI' popups
**/
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
    if (contentBox.length == 0) {
        LC.hideElement(box, options.closeOptions);
        return;
    }
    if (box.length == 0) {
        var boxc = $('<div class="smooth-box-block-element"/>');
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
        var boxc = box.children('.smooth-box-block-element');
    }
    // Hidden for user, but available to compute:
    contentBox.show();
    box.show().css('opacity', 0);
    // Setting up the box and styles.
    boxc.children().remove();
    if (options.closable)
        boxc.append( $('<a class="close-popup close-action" href="#close-popup">X</a>') );
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
    LC.autoFocus(box);
    // Show block
    box.animate({opacity: 1}, 300);
    if (options.autofocus)
        LC.moveFocusTo(contentBox, options.autofocusOptions);
    return box;
}
function smoothBoxBlockCloseAll(container) {
    $(container || document).find('.smooth-box-block-overlay').hide();
}
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1')
}

/*------------
    Several functions to manage
    numbers, prices, money
  ------------*/
/** Round a number to the specified number of decimals.
    It can substract integer decimals by providing a negative
    number of decimals.
**/
LC.roundTo = function LC_roundTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.round(number * tens) / tens;
};
/** Round Up a number to the specified number of decimals.
    Its similar to roundTo, but the number is ever rounded up,
    to the lower integer greater or equals to the number.
**/
LC.ceilTo = function LC_ceilTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.ceil(number * tens) / tens;
};
/** Round Down a number to the specified number of decimals.
    Its similar to roundTo, but the number is ever rounded down,
    to the bigger integer lower or equals to the number.
**/
LC.floorTo = function LC_floorTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.floor(number * tens) / tens;
};
LC.Price = function LC_Price(basePrice, fee, roundedDecimals) {
    // fee parameter can be a float number with the feeRate or an object
    // that includes both a feeRate and a fixedFeeAmount
    // Extracting fee values into local vars:
    var feeRate = 0, fixedFeeAmount = 0;
    if (fee['fixedFeeAmount'] || fee['feeRate']) {
        fixedFeeAmount = fee.fixedFeeAmount || .0;
        feeRate = fee.feeRate || .0;
    } else
        feeRate = fee;

    // Calculating:
    var totalPrice = LC.ceilTo(basePrice * (1 + feeRate) + fixedFeeAmount, roundedDecimals);
    // final fee price is calculated as a substraction, but because javascript handles
    // float numbers only, a round operation is required to avoid an irrational number
    var feePrice = LC.roundTo(totalPrice - basePrice, 2);

    // Creating object with full details:
    this.basePrice = basePrice;
    this.feeRate = feeRate;
    this.fixedFeeAmount = fixedFeeAmount;
    this.roundedDecimals = roundedDecimals;
    this.totalPrice = totalPrice;
    this.feePrice = feePrice;
};
/** Calculate and returns the price and relevant data as an object for
    a time, hourlyRate (with fees) and the hourlyFee.
    The time (@duration) is used 'as is', without transformation, maybe you can require
    use LC.roundTimeToQuarterHour before pass the duration to this function.
    The fees must be calculated before pass the prices to this function, then the @hourlyRate contains
    already the fees that apply and @hourlyFee is the fee amount already included in @hourlyRate.
**/
LC.calculateHourlyPrice = function LC_calculateHourlyPrice(duration, hourlyRate, hourlyFee) {
    // Get hours from rounded duration:
    var hours = LC.roundTo(duration.totalHours(), 2);
    // Calculate final prices
    var price = LC.roundTo(hourlyRate * hours, 2),
                fee = LC.roundTo(hourlyFee * hours, 2),
                subtotal = LC.roundTo(price - fee, 2)
    return {
        totalPrice: price,
        feePrice: fee,
        subtotalPrice: subtotal,
        durationHours: hours
    };
}
LC.getMoneyNumber = function LC_getMoneyNumber(v, alt) {
    alt = alt || 0;
    if (v instanceof jQuery)
        v = v.val() || v.text();
    v = parseFloat(v
        .replace(/[$€]/g, '')
        .replace(new RegExp(LC.numericMilesSeparator[LC.getCurrentCulture().culture], 'g'), '')
    );
    return isNaN(v) ? alt : v;
};
LC.numberToTwoDecimalsString = function LC_numberToTwoDecimalsString(v) {
    var culture = LC.getCurrentCulture().culture;
    // First, round to 2 decimals
    v = LC.roundTo(v, 2);
    // Get the decimal part (rest)
    var rest = Math.round(v * 100 % 100);
    return ('' +
        // Integer part (no decimals)
        Math.floor(v) +
        // Decimal separator depending on locale
        LC.numericDecimalSeparator[culture] +
        // Decimals, ever two digits
        Math.floor(rest / 10) + rest % 10
    );
};
LC.numberToMoneyString = function LC_numberToMoneyString(v) {
    var country = LC.getCurrentCulture().country;
    // Two digits in decimals for rounded value with money symbol as for
    // current locale
    return (LC.moneySymbolPrefix[country] + LC.numberToTwoDecimalsString(v) + LC.moneySymbolSufix[country]);
};
LC.setMoneyNumber = function LC_setMoneyNumber(v, el) {
    // Get value in money format:
    v = LC.numberToMoneyString(v);
    // Setting value:
    if (el instanceof jQuery)
        if (el.is(':input'))
            el.val(v);
        else
            el.text(v);
    return v;
};

function lcSetupCalculateTableItemsTotals() {
    $('table.calculate-items-totals').each(function () {
        if ($(this).data('calculate-items-totals-initializated'))
            return;
        function calculateRow() {
            var $t = $(this);
            var tr = $t.closest('tr');
            var ip = tr.find('.calculate-item-price');
            var iq = tr.find('.calculate-item-quantity');
            var it = tr.find('.calculate-item-total');
            LC.setMoneyNumber(LC.getMoneyNumber(ip) * LC.getMoneyNumber(iq, 1), it);
            tr.trigger('lcCalculatedItemTotal', tr);
        }
        $(this).find('.calculate-item-price, .calculate-item-quantity').on('change', calculateRow);
        $(this).find('tr').each(calculateRow);
        $(this).data('calculate-items-totals-initializated', true);
    });
}
LC.setupCalculateSummary = function (force) {
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
                        groupTotal += LC.getMoneyNumber(item.find('.calculate-item-total:eq(0)'));
                        var q = LC.getMoneyNumber(item.find('.calculate-item-quantity:eq(0)'), 1);
                        fee += LC.getMoneyNumber(item.find('.calculate-item-fee:eq(0)')) * q;
                        duration += LC.getMoneyNumber(item.find('.calculate-item-duration:eq(0)')) * q;
                    }
                });
                total += groupTotal;
                groups[$(this).data('calculation-summary-group')] = groupTotal;
                LC.setMoneyNumber(groupTotal, $(this).closest('fieldset').find('.group-total-price'));
                LC.setMoneyNumber(duration, $(this).closest('fieldset').find('.group-total-duration'));
            });

            // Set summary total value
            LC.setMoneyNumber(total, s.find('.calculation-summary-total'));
            LC.setMoneyNumber(fee, s.find('.calculation-summary-fee'));
            // And every group total value
            for (var g in groups) {
                LC.setMoneyNumber(groups[g], s.find('.calculation-summary-group-' + g));
            }
        }
        d.find('.calculate-item-checked').change(calc);
        d.on('lcCalculatedItemTotal', calc);
        calc();
        c.data('calculate-summary-initializated', true);
    });
};
function convertMilesKm(q, unit) {
    var MILES_TO_KM = 1.609;
    if (unit == 'miles')
        return MILES_TO_KM * q;
    else if (unit == 'km')
        return q / MILES_TO_KM;
    if (console && console.log) console.log('convertMilesKm: Unrecognized unit ' + unit);
    return 0;
}
function goToSummaryErrors(form) {
    var off = form.find('.validation-summary-errors').offset();
    if (off)
        $('html,body').stop(true, true).animate({ scrollTop: off.top }, 500);
    else
        if (console && console.error) console.error('goToSummaryErrors: no summary to focus');
}

/**
* Cookies management.
* Most code from http://stackoverflow.com/a/4825695/1622346
*/
LC.setCookie = function (name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}
LC.getCookie = function getCookie(c_name) {
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
}

/**
 * Take a tour
 */
LC.takeATour = function () {
    // Check the cookie:
    if (!LC.getCookie('lcTakeATour')) {
        var p = popup(LcUrl.LangPath + 'HelpCenter/$TakeATour/', { width: 310, height: 480 });
        p.on('click', '.main-action', function () {
            LC.setCookie('lcTakeATour', 'Taken!', 365);
            p.closePopup();
        });
        p.on('click', '.close-popup', function () {
            LC.setCookie('lcTakeATour', 'Skipped!', 365);
        });
    }
};
/**
 * Welcome popup
 */
LC.welcomePopup = function () {
    var c = $('#welcomepopup');
    if (c.length == 0) return;
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
}

/* Init code */
$(window).load(function () {
    // Disable browser behavior to auto-scroll to url fragment/hash element position:
    setTimeout(function () { $('html,body').scrollTop(0); }, 1);
});
$(function () {
    // Placeholder polyfill
    LC.placeHolder();

    // Autofocus polyfill
    LC.autoFocus();

    //LC.takeATour();
    LC.welcomePopup();

    LC.connectPopupAction();

    /*= Home Page (moved to _SiteLayout, loading without this script for minor footprint and faster load)
    */
    /*(function () {
    // Datepicker (dupe date initialization here, but to document, just next code is copied to _SiteLayout)
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    $('.date-pick', document).datepicker({
    showAnim: 'blind'
    });
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
    s.on('focus click', function () { s.autocomplete('search', '') });
    })();*/

    /** General auto-load support for tabs: if no content on focused, they use 'reload' to load its content if they are configured with data-source-url attribute **/
    $('.tab-body').on('tabFocused', function () {
        var $t = $(this);
        if ($t.children().length == 0)
            $t.reload();
    });

    /** Account popups **/
    $(document).delegate('a.login', 'click', function () {
        popup(LcUrl.LangPath + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location),
         { width: 410, height: 320 });
        return false;
    })
    .delegate('a.register', 'click', function () {
        var url = this.getAttribute('href').replace('/Account/Register', '/Account/$Register');
        popup(url, { width: 450, height: 500 });
        return false;
    })
    .delegate('a.forgot-password', 'click', function () {
        var url = this.getAttribute('href').replace('/Account/ForgotPassword', '/Account/$ForgotPassword');
        popup(url, { width: 400, height: 240 });
        return false;
    })
    .delegate('a.change-password', 'click', function () {
        var url = this.getAttribute('href').replace('/Account/ChangePassword', '/Account/$ChangePassword');
        popup(url, { width: 450, height: 340 });
        return false;
    })
    .delegate('.view-privacy-policy', 'click', function () {
        popup(LcUrl.LangPath + 'HelpCenter/$PrivacyPolicy/', 'large');
        return false;
    })
    .delegate('.view-terms-of-use', 'click', function () {
        popup(LcUrl.LangPath + 'HelpCenter/$TermsOfUse/', 'large');
        return false;
    })
    .delegate('a.target-tab', 'click', function () {
        var thereIsTab = TabbedUX.getTab($(this).attr('href'));
        if (thereIsTab) {
            TabbedUX.focusTab(thereIsTab);
            return false;
        }
    })
    .on('click', '.reload-action', function () {
        // Generic action to call lc.jquery 'reload' function from an element inside itself.
        var $t = $(this);
        $t.closest($t.data('reload-target')).reload();
    });
    /* Enable focus tab on every hash change, now there are two scripts more specific for this:
    * one when page load,
    * and another only for links with 'target-tab' class.
    * Need be study if something of there must be removed or changed.
    * This is needed for other behaviors to work. */
    if ($.fn.hashchange)
        $(window).hashchange(function () {
            if (!/^#!/.test(location.hash)) {
                var thereIsTab = TabbedUX.getTab(location.hash);
                if (thereIsTab)
                    TabbedUX.focusTab(thereIsTab);
            }
        });

    $('div.progress-bar').each(function () {
        var pd = $(this).find('.text .percent-done').text();
        $(this).find('.total .percent-done').css('width', pd);
    });

    // Date Picker
    setupDatePicker();

    // Tabbed interface
    TabbedUX.init();
    // If the current location have a hash, try to focus the matching tab in the Tabbed interface
    if (window.location.hash && window.location.hash.length > 0) {
        var hashvalue = window.location.hash.substring(1);
        // If the hash value follow the 'hash bang' convention, let other
        // scripts do their work throught a 'loadHashBang' event handler
        if (/^!/.test(hashvalue))
            $(document).trigger('loadHashBang', hashvalue.substring(1));
        else {
            // Normal hash value, try focus a tab with that name
            var tab = TabbedUX.getTab('#' + hashvalue);
            if (tab)
                TabbedUX.focusTab(tab);
        }
    }
    // Auto remove 'volatile' tabs if they are empty
    $('.tabbed > .tabs > .volatile').each(function () {
        var tab = TabbedUX.getTab(null, this);
        if (tab && ($(tab).children().length == 0 || $(tab).find(':not(.tabbed) .volatize-my-tab').length)) {
            TabbedUX.removeTab(tab);
        }
    });
    /*= slider-tabs 
    * (after TabbedUX.init to avoid launch animation on page load)
    */
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

    /** Auto-fill menu sub-items using tabbed pages -only works for current page items- **/
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

    /* Auto calculate table items total (quantity*unitprice=item-total) script */
    lcSetupCalculateTableItemsTotals();
    LC.setupCalculateSummary();

    /* Active/Desactive search filters */
    $(".buttons-list .button").click(function () { $(this).toggleClass('selected'); return false; });

    /* Wizard Tabbed Forms: ajax submit and next-step loading  */
    $("body").delegate(".tabbed.wizard .next", "click", function () {
        // getting the form
        var form = $(this).closest('form');
        // getting the current wizard step-tab
        var currentStep = form.closest('.tab-body');
        // getting the wizard container
        var wizard = form.closest('.tabbed.wizard');
        // getting the wizard-next-step
        var nextStep = $(this).data('wizard-next-step');

        // First at all, if unobtrusive validation is enabled, validate
        var valobject = form.data('unobtrusiveValidation');
        if (valobject && valobject.validate() == false) {
            goToSummaryErrors(form);
            // Validation is actived, was executed and the result is 'false': bad data, stop Post:
            return false;
        }

        // If custom validation is enabled, validate
        var cusval = form.data('customValidation');
        if (cusval && cusval.validate && cusval.validate() == false) {
            goToSummaryErrors(form);
            // custom validation not passed, out!
            return false;
        }

        // Raise event
        currentStep.trigger('beginSubmitWizardStep');

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            currentStep.block(loadingBlock);
        }, gLoadingRetard);
        var autoUnblockLoading = true;

        var ok = false;

        // Mark as saved:
        var changedElements = LC.ChangesNotification.registerSave(form.get(0));

        // Do the Ajax post
        $.ajax({
            url: (form.attr('action') || ''),
            type: 'POST',
            data: form.serialize(),
            success: function (data, text, jx) {
                // If is a JSON result:
                if (typeof (data) === 'object') {
                    // Clean previous validation errors
                    setValidationSummaryAsValid(ctx.box);
                    if (data.Code == 0) {
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
                                LC.redirectTo(nextStep);
                            }
                        }
                    } else if (data.Code == 1) {
                        // Just like in normal form.ajax, Code=1 means a client Redirect to the URL at data.Result
                        LC.redirectTo(data.Result);
                    } else if (data.Code == 2) {
                        // Special Code 2: show login popup (with the given url at data.Result)
                        wizard.unblock();
                        popup(data.Result, { width: 410, height: 320 });
                    } else if (data.Code == 3) {
                        // Special Code 3: reload current page content to the given url at data.Result)
                        // Note: to reload same url page content, is better return the html directly from
                        // this ajax server request.
                        //wizard.unblock(); is blocked and unblocked againg by the reload method:
                        options.autoUnblockLoading = false;
                        wizard.reload(data.Result);
                    } else if (data.Code > 100) {
                        // User Code: trigger custom event to manage results:
                        form.trigger('ajaxSuccessPost', [data, text, jx]);
                    } else { // data.Code < 0
                        // There is an error code.

                        // Data not saved:
                        LC.ChangesNotification.registerChange(form.get(0), changedElements);

                        // Unblock loading:
                        currentStep.unblock();
                        // Block with message:
                        var message = (data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : '');
                        currentStep.block(infoBlock('Error: ' + message, {
                            css: popupStyle(popupSize('small'))
                        }))
                        .on('click', '.close-popup', function () { currentStep.unblock(); return false; });

                        // Do not unblock in complete function!
                        autoUnblockLoading = false;
                    }
                } else {
                    // Post 'maybe' was wrong, html was returned to replace current 
                    // form container: the ajax-box.

                    // TODO: enable when jquery-1.9 Create html content from the data, in a secure way:
                    //var newhtml = $($.parseHTML(data));
                    var newhtml = $('#FAKEELEMENTEMPTYJQUERY');
                    // Try-catch to avoid errors when an empty document or malformed is returned:
                    try {
                        newhtml = $(data);
                    } catch (ex) { }

                    // Showing new html:
                    currentStep.html(newhtml);
                    var newForm = currentStep;
                    if (!currentStep.is('form'))
                        newForm = currentStep.find('form:eq(0)');

                    // Changesnotification after append element to document, if not will not work:
                    // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
                    LC.ChangesNotification.registerChange(
                        newForm.get(0),
                        changedElements
                    );

                    currentStep.trigger('reloadedHtmlWizardStep');
                }
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                currentStep.trigger('endSubmitWizardStep', ok);

                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                if (autoUnblockLoading) {
                    currentStep.unblock();
                }
            }
        });
        return false;
    });

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

        // First at all, if unobtrusive validation is enabled, validate
        var valobject = ctx.form.data('unobtrusiveValidation');
        if (valobject && valobject.validate() == false) {
            goToSummaryErrors(ctx.form);
            // Validation is actived, was executed and the result is 'false': bad data, stop Post:
            return;
        }

        // If custom validation is enabled, validate
        var cusval = ctx.form.data('customValidation');
        if (cusval && cusval.validate && cusval.validate() == false) {
            goToSummaryErrors(ctx.form);
            // custom validation not passed, out!
            return false;
        }

        // Data saved:
        ctx.changedElements = (event.data ? event.data.changedElements : null) || LC.ChangesNotification.registerSave(ctx.form.get(0));

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            ctx.box.block(loadingBlock);
        }, gLoadingRetard);
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
    /* Attach a delegated handler to manage ajax forms */
    $(document).delegate('form.ajax', 'submit', ajaxFormsSubmitHandler);
    /* Attach a delegated handler for a special ajax form case: subforms, using fieldsets. */
    $(document).delegate('fieldset.ajax .ajax-fieldset-submit', 'click',
        function (event) {
            var form = $(this).closest('fieldset.ajax');
            event.data = {
                form: form,
                box: form.closest('.ajax-box'),
                action: form.data('ajax-fieldset-action'),
                // Data saved:
                changedElements: LC.ChangesNotification.registerSave(form.get(0), form.find(':input[name]'))
            };
            return ajaxFormsSubmitHandler(event);
        }
    );

    /* Generic script for fieldsets with class .has-confirm, allowing show
    the content only if the main confirm fields have 'yes' selected */
    $(document).on('change', 'fieldset.has-confirm > .confirm input', function () {
        var t = $(this);
        var fs = t.closest('fieldset');
        if (t.is(':checked'))
            if (t.val() == 'yes' || t.val() == 'True')
                fs.removeClass('confirmed-no').addClass('confirmed-yes');
            else
                fs.removeClass('confirmed-yes').addClass('confirmed-no');
    });
    // Perform initialization of fieldset.has-confirm:
    $('fieldset.has-confirm > .confirm input').change();

    // Generic script for to FAQs links, used by the FAQs widget
    $(document).on('click', 'a[href|="#FAQs"]', function () {
        var href = $(this).attr('href');
        var urlparts = href.split('-');
        var urlsection = '';
        if (urlparts.length > 1) {
            urlsection = urlparts[1];
        }
        urlsection += '#' + href;
        var urlprefix = "HelpCenter/$FAQs";
        if (urlsection)
            popup(LcUrl.LangPath + urlprefix + urlsection, 'large');
        return false;
    });

    // Generic script for enhanced tooltips and element descriptions
    LC.initTooltips();

    /***** AVAILABILITY CALENDAR WIDGET *****/
    $(document).delegate('.calendar-controls .action', 'click', function () {
        var $t = $(this);
        if ($t.hasClass('zoom-action')) {
            // Do zoom
            var c = $t.closest('.availability-calendar').find('.calendar').clone();
            c.css('font-size', '2px');
            var tab = $t.closest('.tab-body');
            c.data('popup-container', tab);
            smoothBoxBlock(c, tab, 'availability-calendar', { closable: true });
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
        var strdate = LC.dateToInterchangleString(date);
        var url = LcUrl.LangPath + "Profile/$AvailabilityCalendarWidget/Week/" + encodeURIComponent(strdate) + "/?UserID=" + userId;
        calcont.reload(url, function () {
            // get the new object:
            var cal = $(this).children('.calendar');
            calinfo.find('.year-week').text(cal.data('showed-week'));
            calinfo.find('.first-week-day').text(cal.data('showed-first-day'));
            calinfo.find('.last-week-day').text(cal.data('showed-last-day'));
        });
        return false;
    });

    /**** Postal Code: on fly validation *****/
    $(document).on('change', '[data-val-postalcode]', function () {
        var $t = $(this);
        // If contains a value (this not validate if is required) and 
        // has the error descriptive message, validate through ajax
        var pc = $t.val();
        var msg = $t.data('val-postalcode');
        if (pc && msg) {
            $.ajax({
                url: LcUrl.LangPath + "JSON/ValidatePostalCode/",
                data: { PostalCode: pc },
                cache: true,
                dataType: 'JSON',
                success: function (data) {
                    if (data && data.Code == 0)
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

    /***** Don't lost data! warning message ******/
    (function () {
        var target = $('.changes-notification-enabled');
        LC.ChangesNotification.init({ target: target });
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
                    smoothBoxBlock(null, window);
                })
                .on('click', '.continue', function () {
                    smoothBoxBlock(null, window);
                    // Remove 'has-changes' to avoid future blocks (until new changes happens of course ;-)
                    mi.removeClass('has-changes');
                    TabbedUX.focusTab(focusedCtx.tab.get(0));
                });
                smoothBoxBlock(d, window, 'not-saved-popup', { closable: false, center: true });

                // Ever return false to stop current tab focus
                return false;
            }
        })
        .on('tabFocused', function () {
            TabbedUX.getTabContext(this).menuitem.removeClass('notify-changes'); //has-tooltip
        });
    })();


    /*
    * Communicate that script.js is ready to be used
    * and the common LC lib too.
    * Both are ensure to be raised ever after page is ready too.
    */
    $(document)
    .trigger('lcScriptReady')
    .trigger('lcLibReady');
});
