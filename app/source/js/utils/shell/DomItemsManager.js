/**
    DomItemsManager class, that manage a collection 
    of HTML/DOM items under a root/container, where
    only one element at the time is visible, providing
    tools to uniquerly identify the items,
    to create or update new items (through 'inject'),
    get the current, find by the ID and more.
**/
'use strict';

var $ = require('jquery');
var escapeSelector = require('../escapeSelector');
var getFlags = require('../userAgentFlags');

function DomItemsManager(settings) {
    //jshint maxcomplexity:10

    this.idAttributeName = settings.idAttributeName || 'id';
    this.allowDuplicates = !!settings.allowDuplicates || false;
    this.root = settings.root || 'body';
    this.$root = null;
    // Define in ms the delay in a switch of items (prepare next ->delay-> hide current, show next)
    // NOTE: as of testing in iOS 8.3 iPad2 (slow), 140ms ended being a good default
    // to avoid some flickering effects, enough to let initialization logic to finish before
    // being showed, allow some common async redirects when executing an item logic but
    // enough quick to not being visually perceived the delay.
    // NOTE: on tests on Nexus 5 Android 5.1 with Chrome engine, 40ms was enought to have all the previous
    // benefits, but was too quick for iOS (even 100ms was too quick for iOS 8.3).
    var defaultDelay = 140;
    // NOTE:UPDATE: Using WkWebView on iOS (8.x with unofficial plugin with webserver, 9.x will be with official support no-webserver)
    // it's fastest, so trying user-agent sniffing to use the fastest delay on this engine, chrome engine or desktop (non-mobile)
    // and left he conservative delay for other cases (old iOS/webview, old android webkit engine).
    var flags = getFlags();
    // if not is mobile OR is Chrome OR is WKWebview
    if (!flags.isMobile || flags.isChrome || flags.isWkWebview)
        defaultDelay = 40;
    
    this.switchDelay = settings.switchDelay || defaultDelay;
}

module.exports = DomItemsManager;

DomItemsManager.prototype.getAllItems = function getAllItems() {
    return this.$root.children('[' + this.idAttributeName + ']');
};

DomItemsManager.prototype.find = function find(containerName, root) {
    var $root = $(root || this.$root);
    return $root.children('[' + this.idAttributeName + '="' + escapeSelector(containerName) + '"]');
};

DomItemsManager.prototype.getActive = function getActive() {
    return this.$root.children('[' + this.idAttributeName + ']:visible');
};

/**
    It adds the item in the html provided (can be only the element or 
    contained in another or a full html page).
    Replaces any existant if duplicates are not allowed.
**/
DomItemsManager.prototype.inject = function inject(name, html) {

    // Filtering input html (can be partial or full pages)
    // http://stackoverflow.com/a/12848798
    html = html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '');

    // Creating a wrapper around the html
    // (can be provided the innerHtml or outerHtml, doesn't matters with next approach)
    var $html = $('<div/>', { html: html }),
        // We look for the container element (when the outerHtml is provided)
        $c = this.find(name, $html);

    if ($c.length === 0) {
        // Its innerHtml, so the wrapper becomes the container itself
        $c = $html.attr(this.idAttributeName, name);
    }

    if (!this.allowDuplicates) {
        // No more than one container instance can exists at the same time
        // We look for any existent one and its replaced with the new
        var $prev = this.find(name);
        if ($prev.length > 0) {
            $prev.replaceWith($c);
            $c = $prev;
        }
    }

    // Add to the document
    // (on the case of duplicated found, this will do nothing, no worry)
    $c.appendTo(this.$root);
};

/** 
    The switch method receive the items to interchange as active or current,
    the 'from' and 'to', and the shell instance that MUST be used
    to notify each event that involves the item:
    willClose, willOpen, ready, opened, closed.
    It receives as latest parameter the 'notification' object that must be
    passed with the event so handlers has context state information.
    
    It's designed to be able to manage transitions, but this default
    implementation is as simple as 'show the new and hide the old'.
**/
DomItemsManager.prototype.switch = function switchActiveItem($from, $to, shell, state) {

    var toName = state.route.name;
    //console.log('switch to', toName);
    
    this.disableAccess();
    
    function hideit() {
        var fromIsHidden = $from.is('[hidden]');
        if ($from.length > 0 && !fromIsHidden) {
            shell.emit(shell.events.willClose, $from, state);
            // Do 'unfocus' on the hidden element after notify 'willClose'
            // for better UX: hidden elements are not reachable and has good
            // side effects like hidding the on-screen keyboard if an input was
            // focused
            $from.find(':focus').blur();
            // hide and notify it ended
            $from
            .attr('hidden', 'hidden')
            // For browser that don't support attr
            .css('display', 'none')
            // Reset z-index to avoid overlapping effect
            .css('z-index', '');

            shell.emit(shell.events.closed, $from, state);
        }
        else {
            // Just unfocus to avoid keyboard problems
            $from.find(':focus').blur();
        }
    }

    var toIsHidden = $to.is('[hidden]'); // !$to.is(':visible')

    if (toIsHidden) {
        shell.emit(shell.events.willOpen, $to, state);
        // Put outside screen
        /* DONE ALREADY in the CSS class assigned to items
        $to.css({
            position: 'absolute',
            zIndex: -1,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        });*/
        $to.css('zIndex', -1);

        // Show it:
        $to
        .removeAttr('hidden')
        // For browser that don't support attr
        .css('display', 'block');

        // Its enough visible and in DOM to perform initialization tasks
        // that may involve layout information
        shell.emit(shell.events.itemReady, $to, state);
        
        //console.log('SWITCH ready done, wait', toName);

        // Finish in a small delay, enough to allow some initialization
        // set-up that take some time to finish avoiding flickering effects
        setTimeout(function() {
            //console.log('SWITCH entering hide-show for', toName, shell.currentRoute.name);
            //console.log('ending switch to', toName, 'and current is', shell.currentRoute.name);
            // Race condition, redirection in the middle, abort:
            if (toName !== shell.currentRoute.name)
                return;
            
            // Hide the from
            hideit();
            
            // Ends opening, reset transitional styles
            /* SETUP IS ALREADY CORRECT in the CSS class assigned to items
            $to.css({
                position: '',
                top: '',
                bottom: '',
                left: '',
                right: '',
                zIndex: 2
            });
            */
            $to.css('zIndex', 2);
            
            this.enableAccess();
            
            //console.log('SWITCH ended for', toName);

            // When its completely opened
            shell.emit(shell.events.opened, $to, state);
        }.bind(this), this.switchDelay);
    } else {
        //console.log('ending switch to', toName, 'and current is', shell.currentRoute.name, 'INSTANT (to was visible)');
        // Race condition, redirection in the middle, abort:
        if (toName !== shell.currentRoute.name)
            return;
        
        // Its ready; maybe it was but sub-location
        // or state change need to be communicated
        shell.emit(shell.events.itemReady, $to, state);
        
        this.enableAccess();
        
        hideit();
    }
};

/**
    Initializes the list of items. No more than one
    must be opened/visible at the same time, so at the 
    init all the elements are closed waiting to set
    one as the active or the current one.
    
    Execute after DOM ready.
**/
DomItemsManager.prototype.init = function init() {
    // On ready, get the root element:
    this.$root = $(this.root || 'body');

    this.getAllItems()
    .attr('hidden', 'hidden')
    // For browser that don't support attr
    .css('display', 'none');
    
    // A layer to visually hide an opening item while not completed opened
    $('<div class="items-backstage"/>').css({
        background: this.$root.css('background-color') || 'white',
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 0
    }).appendTo(this.$root);
    
    // A layer to disable access to an item (disabling events)
    // NOTE: Tried CSS pointer-events:none has some strange side-effects: auto scroll-up.
    // TODO: After some testing with this, scroll-up happens again with this (??)
    var $disableLayer = $('<div class="items-disable-layer"/>').css({
        background: 'White',
        opacity: 0,
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: -1
    }).appendTo(this.$root);
    this.disableAccess = function() {
        $disableLayer.css('zIndex', 90900);
    };
    this.enableAccess = function() {
        $disableLayer.css('zIndex', -2);
    };
};
