'use strict';

/** Global dependencies **/
var $ = require('jquery');
var ko = require('knockout');
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
// Polyfill for useful non-standard feature Function.name for IE9+
// (feature used to simplify creation of Activities and Models)
require('./utils/Function.prototype.name-polyfill');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var SplashAppModel = require('./appmodel/SplashAppModel');

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
        'splashThanks': require('./activities/splashThanks'),
        'terms': require('./activities/terms')
    }
};

app.shell.indexName = 'splashIndex';
// Lower delay, because this Splash is for website and default delay
// is visible at desktop browsers, while not a problem for the Splash activities:
app.shell.items.switchDelay = 40;

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

/** App Init **/
var appInit = function appInit() {
    /*jshint maxstatements:50,maxcomplexity:16 */
    
    attachFastClick(document.body);

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

    app.model.init()
    .then(app.shell.run.bind(app.shell))
    .then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
    });
};

// Only on DOM-Ready, for in browser development
$(appInit);
