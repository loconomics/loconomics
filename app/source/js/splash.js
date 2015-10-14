'use strict';

/** Global dependencies **/
var $ = require('jquery');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Polyfill for useful non-standard feature Function.name for IE9+
// (feature used to simplify creation of Activities and Models)
require('./utils/Function.prototype.name-polyfill');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var SplashAppModel = require('./appmodel/SplashAppModel');

// Register the special locale
require('./locales/en-US-LC');

var attachFastClick = require('fastclick').attach;

/**
    App static class
**/
var app = {
    shell: require('./app.shell'),
    
    model: new SplashAppModel(),
    
    /** Load activities controllers (not initialized) **/
    activities: {
        'splashIndex': require('./activities/splashIndex'),
        'signup': require('./activities/signup'),
        'splashThanks': require('./activities/splashThanks')
    }
};

app.shell.indexName = 'splashIndex';

/** Continue app creation with things that need a reference to the app **/

app.getActivity = function getActivity(name) {
    var activity = this.activities[name];
    if (activity) {
        var $act = this.shell.items.find(name);
        if ($act && $act.length)
            return activity.init($act, this);
    }
    return null;
};

app.getActivityControllerByRoute = function getActivityControllerByRoute(route) {
    // From the route object, the important piece is route.name
    // that contains the activity name except if is the root
    var actName = route.name || this.shell.indexName;
    
    return this.getActivity(actName);
};

// Shortcut to UserType enumeration used to set permissions
app.UserType = require('./models/User').UserType;

/** App Init **/
var appInit = function appInit() {
    /*jshint maxstatements:50,maxcomplexity:16 */
    
    attachFastClick(document.body);
    
    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.layoutUpdateEvent += ' orientationchange';
    layoutUpdateEvent.on();
    
    // Force an update delayed to ensure update after some things did additional work
    setTimeout(function() {
        $(window).trigger('layoutUpdate');
    }, 200);
    
    // Bootstrap
    require('bootstrap');
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    
    // When an activity is ready in the Shell:
    app.shell.on(app.shell.events.itemReady, function($act, state) {
        
        // Must be the same:
        var routeName = app.shell.currentRoute.name;
        var actName = $act.data('activity');
        // If not, some race condition, not the same page go out
        if (routeName !== actName)
            return;

        // Connect the 'activities' controllers to their views
        var activity = app.getActivity(actName);
        // Trigger the 'show' logic of the activity controller:
        activity.show(state);
        
        // The show logic may do a redirect, loading other activity, double check
        routeName = app.shell.currentRoute.name;
        if (routeName !== actName)
            return;
    });
    // When an activity is hidden
    app.shell.on(app.shell.events.closed, function($act) {
        
        // Connect the 'activities' controllers to their views
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'hide' logic of the activity controller:
        if (activity.hide)
            activity.hide();
    });
    // Catch errors on item/page loading, showing..
    app.shell.on('error', function(err) {
        app.modals.showError({ error: err });
    });
    
    // Scroll to element when clicking a usual fragment link (not a page link)
    var scrollToElement = require('./utils/scrollToElement');
    app.shell.on('fragmentNavigation', function(href) {
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
                scrollToElement(target, { animation: { duration: 300 } });
            }
        }
    });

    // App init:
    var alertError = function(err) {
        app.modals.showError({
            title: 'There was an error loading',
            error: err
        });
    };

    app.model.init()
    .then(app.shell.run.bind(app.shell), alertError)
    .then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
    }, alertError);
};

// Only on DOM-Ready, for in browser development
$(appInit);
