'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
require('es6-promise').polyfill();
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
var layoutUpdateEvent = require('layoutUpdateEvent');
var Shell = require('./utils/Shell'),
    NavAction = require('./viewmodels/NavAction');

/** Custom Loconomics 'locale' styles for date/times **/
var moment = require('moment');
moment.locale('en-US-LC', {
    meridiemParse : /[ap]\.?\.?/i,
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'p' : 'P';
        } else {
            return isLower ? 'a' : 'A';
        }
    },
    calendar : {
        lastDay : '[Yesterday]',
        sameDay : '[Today]',
        nextDay : '[Tomorrow]',
        lastWeek : '[last] dddd',
        nextWeek : 'dddd',
        sameElse : 'M/D'
    },
    longDateFormat : {
        LT: 'h:mma',
        LTS: 'h:mm:ssa',
        L: 'MM/DD/YYYY',
        l: 'M/D/YYYY',
        LL: 'MMMM Do YYYY',
        ll: 'MMM D YYYY',
        LLL: 'MMMM Do YYYY LT',
        lll: 'MMM D YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
        llll: 'ddd, MMM D YYYY LT'
    }
});
// Left normal english as default:
moment.locale('en-US');

/** app static class **/
var app = new Shell();
// TODO app must to be a plain object with shell as property, not a shell instance
app.shell = app;

// TODO: refactor as model
//app.model = new AppModel();
app.model = {
    user: ko.observable({ // User.newAnonymous()
        email: ko.observable(''),
        firstName: ko.observable(''),
        onboardingStep: ko.observable(null),
        userType: ko.observable('a')
    })
};

// Updating app status on user changes
function updateStatesOnUserChange() {
    var user = app.model.user();
    if (user.onboardingStep()) {
        app.status('onboarding');
    }
    else if (user.userType() === 'a') {
        app.status('out');
    }
    else if (user.userType() === 'p') {
        app.status('in');
    }
}
app.model.user.subscribe(updateStatesOnUserChange);
app.model.user().userType.subscribe(updateStatesOnUserChange);
app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);

/** Load activities **/
app.activities = {
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker'),
    'clients': require('./activities/clients'),
    'services': require('./activities/services'),
    'locations': require('./activities/locations'),
    'textEditor': require('./activities/textEditor'),
    'home': require('./activities/home'),
    'appointment': require('./activities/appointment'),
    'bookingConfirmation': require('./activities/bookingConfirmation'),
    'index': require('./activities/index'),
    'login': require('./activities/login'),
    'learnMore': require('./activities/learnMore'),
    'signup': require('./activities/signup'),
    'contactInfo': require('./activities/contactInfo'),
    'positions': require('./activities/positions'),
    'onboardingHome': require('./activities/onboardingHome'),
    'locationEdition': require('./activities/locationEdition')
};

/** Page ready **/
$(function() {
    
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
    
    // App set-up
    // TODO Remove when out of prototype!
    app.baseUrl = 'activities/';
    app.defaultNavAction = NavAction.goHome;
    app.init();
    
    // DEBUG
    window.app = app;
});
