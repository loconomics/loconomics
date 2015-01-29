/**
    Javascritp Shell for SPAs.
**/
//global history
'use strict';

/* TODO:
    - domItemsManager class must implement an initialize (there belongs the line ".getCurrent().hide()")
    - domItemsManager class must implement the itemsSwitcher, and provide properly tools for transitions
*/

/** DI entry points for default builds. Most dependencies can be
    specified in the constructor settings.
**/
var deps = {
    parseUrl: null,
    absolutizeUrl: null,
    itemsSwitcher: null,
    jquery: null
};

/** Constructor **/

function Shell(settings) {
    //jshint maxcomplexity:10

    this.$ = settings.jquery || deps.jquery;
    this.$root = this.$(settings.root);
    this.baseUrl = settings.baseUrl || '';
    this.linkEvent = settings.linkEvent || 'click';
    this.parseUrl = (settings.parseUrl || deps.parseUrl).bind(this, this.baseUrl);
    this.absolutizeUrl = (settings.absolutizeUrl || deps.absolutizeUrl).bind(this, this.baseUrl);

    this.history = settings.history || window.history;

    this.indexName = settings.indexName || 'index';
    this.loader = settings.loader;
    this.domItemsManager = settings.domItemsManager;
    // The itemsSwitcher function receive the elements to interchange
    // from and to and a notifier object with callbacks to call
    // to notify each step. It enables transitions but the default
    // is a simple 'show the new' and 'hide the old'
    this.itemsSwitcher = settings.itemsSwitcher || deps.itemsSwitcher;
    this.notifier = settings.notifier;
    /* Notifier object, for like events but with callbacks {
        willClose: function willClose(name, $element) {}
        willOpen: function willOpen(name, $element) {},
        ready: function ready(name, $element) {},
        closed: function closed(name, $element) {},
        opened: function opened(name, $element) {}
    }
    */
}

module.exports = Shell;
Shell.deps = deps;

/** API definition **/

Shell.prototype.go = function go(url, options) {
    console.log('Shell go to', url, options);
    url = this.absolutizeUrl(url);
    this.history.pushState(options, undefined, url);
    // pushState do NOT trigger the popstate event, so
    this.replace(options);
};

Shell.prototype.goBack = function goBack(steps) {
    steps = 0 - (steps || 1);
    this.history.go(steps);
};

Shell.prototype.replace = function replace(state) {
    //jshint maxcomplexity:10
    
    // Default state and route
    state = state || this.history.state || {};
    var isHashBang = /#!/.test(location.href);
    if (!state.route) {
        var link = (
            isHashBang ?
            location.hash :
            location.pathname
        ) + (location.search || '');

        state.route = this.parseUrl(link);
    }

    // Use the index on root calls
    if (state.route.root === true) {
        state.route = this.parseUrl(this.indexName);
    }

    // Locating the container
    var $cont = this.domItemsManager.find(state.route.name);
    var shell = this;

    if ($cont && $cont.length) {
        return new Promise(function(resolve, reject) {
            try {

                var $oldCont = shell.domItemsManager.getCurrent();
                $oldCont = $oldCont.not($cont);
                shell.itemsSwitcher($oldCont, $cont, shell.notifier);

                resolve(); //? resolve(act);
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    else {
        if (this.loader) {
            // load and inject the content in the page
            // then try the replace again
            return this.loader.load(state.route).then(function(html) {
                shell.domItemsManager.inject(state.route.name, html);
                return shell.replace(state);
            });
        }
        else {
            var err = new Error('Page not found (' + state.route.name + ')');
            console.error(err);
            console.error('Shell Page not found, state:', state);
            return Promise.reject(err);
        }
    }
};

Shell.prototype.run = function run() {

    var shell = this;

    // Catch popstate event to update shell replacing the active container
    this.$(window).on('popstate', function(event) {
        shell.replace(event.state);
    });

    // Catch all links in the page (not only $root ones) and like-links
    this.$('body').on(this.linkEvent, '[href], [data-href]', function(e) {

        var $t = shell.$(this),
            href = $t.attr('href') || $t.data('href');

        // Do nothing if the URL contains the protocol
        if (/^[a-z]+:/i.test(href))
            return;

        e.preventDefault();
        //? e.stopImmediatePropagation();

        shell.go(href);
    });

    // Initiallize state
    // All containers must be hidden at first
    this.domItemsManager.getCurrent().hide();
    // Route to the current url/state
    this.replace();
};
