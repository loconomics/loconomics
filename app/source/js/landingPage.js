/**
 * Main script to be used by any landing page
 */
'use strict';

/** Global dependencies **/
var $ = require('jquery');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
ko.bindingHandlers.domElement = require('ko/domElementBinding').domElementBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Polyfill for useful non-standard feature Function.name for IE9+
// (feature used to simplify creation of Activities and Models)
require('./utils/Function.prototype.name-polyfill');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();
require('bootstrap-carousel');

var layoutUpdateEvent = require('layoutUpdateEvent');
var AppModel = require('./appmodel/AppModel');

// Register the special locale
require('./locales/en-US-LC');

var attachFastClick = require('fastclick').attach;

/**
    App static class
**/
var app = {
    // New app model, that starts with anonymous user
    model: new AppModel(),
    modals: require('./app.modals'),
};

/** Continue app creation with things that need a reference to the app **/

require('./app-components').registerAll(app);

/** App Init **/
var appInit = function appInit() {
    /*jshint maxstatements:70,maxcomplexity:16 */

    attachFastClick(document.body);

    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.layoutUpdateEvent += ' orientationchange';
    layoutUpdateEvent.on();

    // Bootstrap
    require('bootstrap');

    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    //require('./utils/pressEnterBindingHandler').plugIn(ko);

    // Scroll to element when clicking a usual fragment link (not a page link)
    var scrollToElement = require('./utils/scrollToElement');
    var fragmentNavigationHandler = function(href) {
        // Check link, avoiding empty links
        // (href comes with the initial hash ever, so empty is just '#')
        if (href === '#') {
            // Notify for debugging, because this may be unwanted
            console.warn(
                'Navigation to an empty fragment, this may be not wanted. ' +
                'For root links, use "/"; on script handled links, call event.preventDefault; ' +
                'A touch event was listened on a link, but not the click event.'
            );
        }
        else {
            // Locate target
            var target = $(href);
            if (target.length) {
                // Smooth scrolling with animation
                var opts = { animation: { duration: 300 } };
                // Special case: if we are at the home page, the special, fixed header
                // must be an offset to avoid the content to fall behind it
                // (a generic attempt was done using 'header.is-fixed:visible' but had bug when
                // the header is still not-fixed -scroll still at the top).
                var act = target.closest('[data-activity]');
                var isHome = act.data('activity') === 'home';
                if (isHome) {
                    opts.topOffset = act.children('header').outerHeight();
                }
                scrollToElement(target, opts);
            }
        }
    };
    $(document).on('click', '[href^=#]', fragmentNavigationHandler);


    var alertError = function(err) {
        app.modals.showError({
            title: 'There was an error loading',
            error: err
        });
    };
    // Catch uncatch model errors
    app.model.on('error', alertError);

    app.model.init()
    .then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');

        // Launch 'activity' logic
        var $act = $('#landingPage');
        require('./activities/learnMoreProfessionals')
        .init($act, this)
        .show({ route: {} });
    }, alertError);

    // DEBUG
    window.app = app;
};

// Only on DOM-Ready
$(appInit);
