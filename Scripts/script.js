/* Author: Loconomics */
// OUR namespace (abbreviated Loconomics), same as 'var LC' with caution
window['LC'] = window['LC'] || {};

/* ===============
Console Wrapper
*/
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f() { log.history = log.history || []; log.history.push(arguments); if (this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr); } };
// make it safe to use console.log always
(function (a) { function b() { } for (var c = "assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","), d; !!(d = c.pop()); ) { a[d] = a[d] || b; } })
(function () { try { console.log(); return window.console; } catch (a) { return (window.console = {}); } } ());

/* Generic blockUI options sets */
var loadingBlock = { message: '<img src="' + UrlUtil.AppPath + 'img/loading.gif"/>' };
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
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/*
 * Our jQuery additions (small plugins)
 */
$.fn.hasScrollBar = function () {
    if (!this || this.length == 0) return { vertical: false, horizontal: false };
    //note: clientHeight= height of holder
    //scrollHeight= we have content till this height
    var t = this.get(0);
    return {
        vertical: this.outerHeight() < t.scrollHeight,
        horizontal: this.outerWidth() < t.scrollWidth
    };
}
$.fn.reload = function (newurl, onload) {
    this.each(function () {
        var $t = $(this);

        // Check if there is already being reloaded, to cancel previous attempt
        var jq = $t.data('isReloading');
        if (jq)
            jq.abort();

        if (newurl)
            if ($.isFunction(newurl))
            // Function params: currentReloadUrl, defaultReloadUrl
                $t.data('source-url', $.proxy(newurl, this)($t.data('source-url'), $t.attr('data-source-url')));
            else
                $t.data('source-url', newurl);
        var url = $t.data('source-url');

        // Optional data parameter 'reload-mode' accepts values: 
        // - 'replace-me': Use html returned to replace current reloaded element (aka: replaceWith())
        // - 'replace-content': (default) Html returned replace current element content (aka: html())
        var reloadMode = $t.data('reload-mode');

        if (url) {
            // Loading, with retard
            var loadingtimer = setTimeout(function () {
                smoothBoxBlock(loadingBlock.message, $t, 'loading');
                //$t.block(loadingBlock);
            }, gLoadingRetard);
            /*$t.load(url, function () {
            clearTimeout(loadingtimer);
            if (onload) $.proxy(onload, this)();
            //smoothBoxBlock(null, $t, true);
            //$t.unblock();
            });*/
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
            if (onload)
                jq.done(onload);
            // Mark element as is being reloaded, to avoid multiple attemps at same time, saving
            // current ajax object to allow be cancelled
            $t.data('isReloading', jq);
        }
    });
}

/*
* Tabbed interface logic
*/
var TabbedUX = {
    init: function () {
        $('body').delegate('.tabbed > .tabs > li:not(.tabs-slider) > a', 'click', function () {
            var $t = $(this);
            if (TabbedUX.focusTab($t.attr('href'))) {
                var st = $(document).scrollTop();
                location.hash = $t.attr('href');
                $('html,body').scrollTop(st);
            }
            return false;
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
        if (tabContainer.children('.tabs').hasScrollBar().horizontal == true) {
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
            tab = tabContainer.find('>.tab-body#@0, >.tab-body-list>.tab-body#@0'.replace(/@0/g, ma.attr('href')));
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
    // If page not changed (same url or internal link), refresh:
    if (!redirected)
        window.location.reload();
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
                { load: UrlUtil.AppPath + "Scripts/jquery/jquery.validate.min.js" },
                { load: UrlUtil.AppPath + "Scripts/jquery/jquery.validate.unobtrusive.min.js" }
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
        left: Math.round(($(window).width() - size.width) / 2) - 30 + 'px',
        height: size.height + 'px',
        top: Math.round(($(window).height() - size.height) / 2) - 30 + 'px',
        padding: '25px',
        overflow: 'auto',
        border: '5px solid #b5e1e2',
        '-moz-border-radius': '12px',
        '-webkit-border-radius': '12px',
        'border-radius': '12px',
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
       '<img src="' + UrlUtil.AppPath + 'img/loading.gif"/>' + loadingText,
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

            if (typeof (data) === 'object') {
                if (data.Code && data.Code == 2) {
                    $.unblockUI();
                    popup(data.Result, { width: 410, height: 320 });
                } else {
                    // Unexpected code, show result
                    $('.blockMsg').append(data.Result);
                }
            } else {
                // Page content got, paste into the popup if is partial html (url starts with$)
                if (/((^\$)|(\/\$))/.test(url)) {
                    $('.blockMsg').append(data);
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
                    $('.blockMsg').append(iframe);
                }
            }
        }, error: function (j, t, ex) {
            $('div.blockMsg').html((options.closable.onError ? '<a class="close-popup" href="#close-popup">X</a>' : '') + '<div>Page not found</div>');
            if (console && console.info) console.info("Popup-ajax error: " + ex);
        }, complete: complete
    });

    $('.blockUI').on('click', '.close-popup', function () { $.unblockUI(); return false; });
}
function ajaxFormsSuccessHandler(data, text, jx) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    ctx.autoUnblockLoading = true;

    // If is a JSON result:
    if (typeof (data) === 'object') {
        function showSuccessMessage(message) {
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

            // Clean previous validation errors
            setValidationSummaryAsValid(ctx.box);
        }
        if (data.Code == 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'
            showSuccessMessage(data.Result);
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
            //container.unblock(); is blocked and unblocked againg by the reload method:
            ctx.autoUnblockLoading = false;
            ctx.box.reload(data.Result);
        } else if (data.Code == 4) {
            // Show SuccessMessage, attaching and event handler to go to RedirectURL
            ctx.box.on('ajaxSuccessPostMessageClosed', function () {
                LC.redirectTo(data.Result.RedirectURL);
            });
            showSuccessMessage(data.Result.SuccessMessage);
        } else if (data.Code > 100) {
            // User Code: trigger custom event to manage results:
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else { // data.Code < 0
            // There is an error code.

            // Data not saved:
            if (ctx.changedElements)
                LC.ChangesNotification.registerChange(ctx.form.get(0), ctx.changedElements);

            // Unblock loading:
            ctx.box.unblock();
            // Block with message:
            var message = data.Code + ": " + (data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : '');
            ctx.box.block({
                message: 'Error: ' + message,
                css: popupStyle(popupSize('small'))
            })
            .on('click', '.close-popup', function () { ctx.box.unblock(); return false; });

            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
    } else {
        // Post 'maybe' was wrong, html was returned to replace current 
        // form container: the ajax-box.

        var newhtml = $(data);
        // Reading original scripts tags to be able to execute later
        var responseScript = newhtml.filter("script");

        // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
        var newForm = newhtml.find('form:eq(0)').get(0);
        if (ctx.changedElements)
            LC.ChangesNotification.registerChange(
                newForm,
                ctx.changedElements
            );

        // Check if the returned element is the ajax-box, if not, find
        // the element in the newhtml:
        var jb = newhtml;
        if (!ctx.boxIsContainer && !newhtml.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
        if (!jb || jb.length == 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
        }
        if (ctx.boxIsContainer)
            // jb is content of the box container:
            ctx.box.html(jb);
        else
            // box is content that must be replaced by the new content:
            ctx.box.replaceWith(jb);

        // Executing scripts returned by the page
        jQuery.each(responseScript, function (idx, val) { eval(val.text); });

        newhtml.trigger('ajaxFormReturnedHtml');
    }
}
function ajaxFormsCompleteHandler() {
    // Disable loading
    clearTimeout(this.loadingtimer);
    // Unblock
    if (this.autoUnblockLoading) {
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
function hasPlaceholderSupport() {
    var input = document.createElement('input');
    return ('placeholder' in input);
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
/* Currently only applies to elements with title and data-description attributes or 
    with css-class has-tooltip and title attribute */
function configureTooltip() {
    var posoffset = { x: 16, y: 8 };
    function pos(t, e) {
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
    function con(t, l) {
        if (t.length == 0 || l.length == 0) return;
        var c = l.data('tooltip-content');
        if (!c) {
            var h = (l.attr('title') || '').replace(/\s/g, ' ');
            var d = (l.data('description') || '').replace(/\s/g, ' ');
            if (d)
                c = '<h4>' + h + '</h4><p>' + d + '</p>';
            else {
                // Only create tooltip content if element content is different
                // from title value, or element content is not full visible
                if ($.trim(l.html()) != h ||
                    l.outerWidth() < l[0].scrollWidth)
                    c = h;
            }
            if (c) {
                l.data('tooltip-content', c);
                l.attr('title', '');
            }
        }
        t.html(c);
        // Adjust content elements
        t.children().css('max-width', t.css('max-width'));
        // Return the content added:
        return c;
    }
    function showTooltip(e) {
        var $t = $(this);
        var t = $('body > .tooltip-singleton-layer:eq(0)');
        if (t.length == 0) {
            t = $('<div style="position:absolute" class="tooltip tooltip-singleton-layer"></div>');
            t.hide();
            $('body').append(t);
        }
        //if (!$t.data('tooltip-owner-id')) $t.data('tooltip-owner-id', guidGenerator());
        //t.data('tooltip-owner-id', $t.data('tooltip-owner-id'));
        // Create content, and only if non-null, non-empty content was added, continue executing:
        if (con(t, $t)) {
            pos(t, e);
            t.stop(true, true);
            if (!t.is(':visible'))
                t.fadeIn();
        }
        return false;
    }
    function hideTooltip(e) {
        var t = $('body > .tooltip-singleton-layer:eq(0)');
        if (t.length == 1) // && t.data('tooltip-owner-id') == $(this).data('tooltip-owner-id'))
            t.stop(true, true).fadeOut();
    }
    $('body').on('mousemove focusin', '[title][data-description][data-description!=""], [title].has-tooltip', showTooltip)
    .on('mouseleave focusout', '[title][data-description][data-description!=""], [title].has-tooltip', hideTooltip)
    .on('click', '.tooltip-button', function () { return false });
}
function smoothBoxBlock(contentBox, blocked, addclass, options) {
    // Load options overwriting defaults
    options = $.extend({
        closable: false,
        center: false
    }, options);

    contentBox = $(contentBox);
    var full = false;
    if (blocked == document || blocked == window) {
        blocked = $('body');
        full = true;
    } else
        blocked = $(blocked);

    var bID = blocked.data('smooth-box-block-id');
    if (!bID)
        bID = (contentBox.attr('id') || '') + (blocked.attr('id') || '') + '-smoothBoxBlock';
    if (bID == '-smoothBoxBlock') {
        bID = 'id-' + guidGenerator() + '-smoothBoxBlock';
        //if (console) console.log('smoothBoxBlock needs IDs on the argument elements');
        //return;
    }
    blocked.data('smooth-box-block-id', bID);
    var box = $('#' + escapeJQuerySelectorValue(bID));
    if (contentBox.length == 0) {
        box.hide();
        return;
    }
    if (box.length == 0) {
        var boxc = $('<div class="smooth-box-block-element fancy"/>');
        box = $('<div class="smooth-box-block-overlay fancy"></div>');
        box.addClass(addclass);
        box.append(boxc);
        box.attr('id', bID);
        blocked.append(box);
    } else {
        var boxc = box.children('.smooth-box-block-element');
    }
    box.hide();
    boxc.children().remove();
    if (options.closable) {
        var closeButton = $('<a class="close-popup" href="#close-popup">X</a>');
        closeButton.click(function () { smoothBoxBlock(null, blocked); return false; });
        boxc.append(closeButton);
    }
    boxc.append(contentBox);
    box.width(blocked.outerWidth());
    box.height(blocked.outerHeight());
    box.css('z-index', blocked.css('z-index') + 10);
    box.css('position', 'absolute');
    if (!blocked.css('position') || blocked.css('position') == 'static')
        blocked.css('position', 'relative');
    //offs = blocked.position();
    box.css('top', 0);
    box.css('left', 0);
    box.show();
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
    contentBox.show();
    LC.moveFocusTo(contentBox, { marginTop: 60 });
    return box;
}
function smoothBoxBlockCloseAll(container) {
    $(container || document).find('.smooth-box-block-overlay').hide();
}
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1')
}
LC.getMoneyNumber = function (v, alt) {
    alt = alt || 0;
    if (v instanceof jQuery)
        v = v.val() || v.text();
    v = parseFloat(v.replace(/[$€]/g, ''));
    return isNaN(v) ? alt : v;
};
LC.setMoneyNumber = function (v, el) {
    v = Math.round(v * 100) / 100;
    v = '$' + v;
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
        $(this).find('.calculate-item-price, .calculate-item-quantity').change(calculateRow);
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
    if (console) console.log('convertMilesKm: Unrecognized unit ' + unit);
    return 0;
}
function goToSummaryErrors(form) {
    var off = form.find('.validation-summary-errors').offset();
    if (off)
        $('html,body').stop(true, true).animate({ scrollTop: off.top }, 500);
    else
        console.error('goToSummaryErrors: no summary to focus');
}

/* Init code */
$(window).load(function () {
    // Disable browser behavior to auto-scroll to url fragment/hash element position:
    setTimeout(function () { $('html,body').scrollTop(0); }, 1);
});
$(function () {
    if (!hasPlaceholderSupport()) {
        $('.has-placeholder form input[type="text"][placeholder]').focus(function () {
            if (this.value == this.getAttribute('placeholder'))
                this.value = "";
        }).blur(function () {
            if (!this.value.length)
                this.value = this.getAttribute('placeholder');
        });
    }

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
        popup(UrlUtil.LangPath + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location),
         { width: 410, height: 320 });
        return false;
    })
    .delegate('a.register', 'click', function () {
        var url = this.getAttribute('href').replace('/Account/Register', '/Account/$Register');
        popup(url, { width: 450, height: 430 });
        return false;
    })
    .delegate('a.forgot-password', 'click', function () {
        var url = this.getAttribute('href').replace('/Account/ForgotPassword', '/Account/$ForgotPassword');
        popup(url, { width: 400, height: 220 });
        return false;
    })
    .delegate('.view-privacy-policy', 'click', function () {
        popup(UrlUtil.LangPath + 'HelpCenter/$PrivacyPolicy/', 'large');
        return false;
    })
    .delegate('.view-terms-of-use', 'click', function () {
        popup(UrlUtil.LangPath + 'HelpCenter/$TermsOfUse/', 'large');
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
                        container.unblock();
                        popup(data.Result, { width: 410, height: 320 });
                    } else if (data.Code == 3) {
                        // Special Code 3: reload current page content to the given url at data.Result)
                        // Note: to reload same url page content, is better return the html directly from
                        // this ajax server request.
                        //container.unblock(); is blocked and unblocked againg by the reload method:
                        options.autoUnblockLoading = false;
                        container.reload(data.Result);
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
                    // Post was wrong, html was returned to replace current form:
                    var newhtml = $(data);
                    // Reading original scripts tags to be able to execute later
                    var responseScript = newhtml.filter("script");
                    // Data not saved:
                    var newForm = newhtml.find('form:eq(0)').get(0);
                    LC.ChangesNotification.registerChange(
                        newForm,
                        changedElements
                    );
                    // Showing new html:
                    currentStep.html(newhtml);
                    // Executing scripts returned by the page
                    jQuery.each(responseScript, function (idx, val) { eval(val.text); });

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
            popup(UrlUtil.LangPath + urlprefix + urlsection, 'large');
        return false;
    });

    // Generic script for enhanced tooltips and element descriptions
    configureTooltip();

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
        var strdate = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' + date.getDate().toString();
        var url = UrlUtil.LangPath + "Profile/$AvailabilityCalendarWidget/Week/" + encodeURIComponent(strdate) + "/?UserID=" + userId;
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
                url: UrlUtil.LangPath + "JSON/ValidatePostalCode/",
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
