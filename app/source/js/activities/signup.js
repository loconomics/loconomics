/**
    Signup activity
**/
'use strict';

var Activity = require('../components/Activity');
var SignupVM = require('../viewmodels/Signup');

var A = Activity.extend(function SignupActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    this.title('Welcome to Loconomics');

    /// ViewModel setup that requires an $activity reference
    // Focus first wrong field handler for the signup error event
    // (event-handler set-up in markup)
    this.viewModel.focusWrongField = function() {
        // Focus first field with error
        var $el = this.$activity.find('.form-group.has-error:first').find('input');
        setTimeout(function() {
            // Because trying synchronously will not work on some cases
            $el.focus();
        }, 100);
    }.bind(this);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    this.viewModel.reset();

    Activity.prototype.show.call(this, options);

    var q = options && options.route && options.route.query || {};

    this.viewModel.setupWith({
        email: q.email,
        confirmationCode: q.confirmationCode
    });
};

var ko = require('knockout');

function ViewModel(app) {
    // Component API entry point: expects SignupVM
    this.signup = ko.observable();
    this.reset = function() {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.reset();
        }
    };
    this.signup.subscribe(this.reset.bind(this));

    // Redirect for the success signup event
    // (event-handler set-up in markup)
    this.redirect = function() {
        app.goDashboard();
    };

    /**
     * Allows to set some of the properties
     * of the Signup component with values from incoming parameters
     * @param {object} options
     * @param {string} options.email
     * @param {string} options.confirmationCode
     */
    this.setupWith = function(options) {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.email(options.email || undefined);
            signup.emailIsLocked(!!options.email);
            signup.confirmationCode(options.confirmationCode || undefined);
        }
    };

    // A static utility (currently only used to conditionally show/hide DownloadApp links)
    this.inApp = ko.observable(!!window.cordova);
}
