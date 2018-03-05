/**
 * Main script to be used by any landing page
 */
'use strict';

/** Global dependencies **/
require('babel-polyfill');
var $ = require('jquery');
// Make jquery reference global, may still be needed by some shimed plugins
window.$ = window.jQuery = $;
require('./utils/jquery.multiline');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
ko.bindingHandlers.domElement = require('ko/domElementBinding').domElementBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Polyfills for HTML5 DOM additions, used in components with vanilla javascript
// (avoiding jQuery, it has equivalent methods)
require('../../vendor/polyfills/Element.prototype.matches');
require('../../vendor/polyfills/Element.prototype.closest');

var layoutUpdateEvent = require('layoutUpdateEvent');

// Register the special locale
require('./locales/en-US-LC');

var attachFastClick = require('fastclick').attach;

/**
    App static class
**/
var app = {};

/** Continue app creation with things that need a reference to the app **/

require('./app-components').registerAll(app);

var showError = require('./modals/error').show;

/** App Init **/
var appInit = function appInit() {

    attachFastClick(document.body);

    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.on();

    // Bootstrap
    require('bootstrap');
    require('bootstrap-carousel');

    // Load Knockout binding helpers
    bootknock.plugIn(ko);

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
    $(document).on('click', '[href^="#"]', fragmentNavigationHandler);

    var alertError = function(err) {
        showError({
            title: 'There was an error loading',
            error: err
        });
    };

    var launchPage = function() {
        // Mark the page as ready
        $('html').addClass('is-ready');

        // Launch 'activity' logic
        var $act = $('#landingPage');
        require('./activities/landingPage')
        .init($act, app)
        .show({ route: {} });
    };

    // Try to restore a user session ('remember login')
    var session = require('./data/session');
    session.restore()
    .then(launchPage)
    .catch(alertError);

    // DEBUG
    window.app = app;
};

// Only on DOM-Ready
$(appInit);
