'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var Shell = require('./utils/Shell'),
    NavAction = require('./viewmodels/NavAction'),
    AppModel = require('./viewmodels/AppModel');

// Register the special locale
require('./locales/en-US-LC');

/**
    App static class
**/
var app = {
    shell: require('./app-shell'),
    
    // New app model, that starts with anonymous user
    model: new AppModel(),
    
    // TODO Double check it works
    // 'out', 'login', 'onboarding', 'in'
    status: ko.observable('out'),
    
    /**
        Just redirect the better place for current user and state
    **/
    goDashboard: function goDashboard() {
        var onboarding = this.model.user().onboardingStep();
        if (onboarding) {
            this.shell.go('onboardingHome/' + onboarding);
        }
        else {
            this.shell.go('home');
        }
    }
};

/** Continue app creation with things that need a reference to the app **/

app.getActivityControllerByRoute = function getActivityControllerByRoute(route) {
    // From the route object, the important piece is route.name
    // that contains the activity name except if is the root
    var actName = route.name || app.shell.indexName;
    
    return (this.activities[actName] || null);
};

// accessControl setup: cannot be specified on Shell creation because
// depends on the app instance
app.shell.accessControl = require('./utils/accessControl')(app);

// Shortcut to UserType enumeration used to set permissions
app.UserType = app.model.user().constructor.UserType;

// Updating app status on user changes
function updateStatesOnUserChange() {

    var user = app.model.user();

    if (user.onboardingStep()) {
        app.status('onboarding');
    }
    else if (user.isAnonymous()) {
        app.status('out');
    }
    else {
        app.status('in');
    }
}
app.model.user().isAnonymous.subscribe(updateStatesOnUserChange);
app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);

/** Load activities **/
app.activities = require('./app-activities');

/** App Init **/
var appInit = function appInit() {
    
    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.on();
    
    // NOTE: Safari iOS bug workaround, min-height/height on html doesn't work as expected,
    // getting bigger than viewport. May be a problem only on Safari and not in 
    // the WebView, double check.
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    if (iOS) {
        $('html').height(window.innerHeight + 'px');
        $(window).on('layoutUpdate', function() {
            $('html').height(window.innerHeight + 'px');
        });
    }
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    
    // Plugins setup
    if (window && window.plugins && window.plugins.Keyboard) {
        window.plugins.Keyboard.disableScroll(true);
    }
    
    // Easy links to shell actions, like goBack, in html elements
    // Example: <button data-shell="goBack 2">Go 2 times back</button>
    $(document).on('tap', '[data-shell]', function(e) {
        var cmdline = $(this).data('shell') || '',
            args = cmdline.split(' '),
            cmd = args[0];

        if (cmd && typeof(app.shell[cmd]) === 'function') {
            app.shell[cmd].apply(cmd, args.slice(1));
        }
    });
    
    // TODO COMING: things to do on app.js that new Shell doesn't now:
    // - Manage the 'activities' controllers (js modules), running 'show' on shell event 'ready'
    // - navAction changes for the 'go-back' button must be done manually on each activity; since
    //   this will depend on the activity location on the hierarchy, and maybe manual URL rather
    //   than go-back, has no sense here
    // - popActivity does not exists, must be replaced by 'go'
    // - showActivity changes to 'go'
    // - updateAppNav is out.
    // - updateMenu is out.
    // - ko-binding is out: need it for .AppNav with status, navAction
    
    // Execute the 'activities' controllers when ready
    app.shell.on(app.shell.events.itemReady, function($act) {
        
        // TODO implement
        var activity = app.activities['an-actual-name'];
        // TODO Init required before the accessControl??
        var act = activity.init();
        act.show();
    });


    // App init:
    app.model.init().then(
        app.shell.init.bind(app.shell)
    ).then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
    });

    // DEBUG
    window.app = app;
};

// App init on page ready and phonegap ready
if (window.cordova) {
    $(function() {
        // Page is ready, device is too?
        $(document).on('deviceready', appInit);
    });
} else {
    $(appInit);
}