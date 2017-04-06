/**
    View model for the signup form/container,
    shared across activity and client booking.
**/
'use strict';
var ko = require('knockout'),
    EventEmitter = require('events')
    .EventEmitter;

//var FormCredentials = require('../viewmodels/FormCredentials');
var newFieldObs = function() {
    var obs = ko.observable('');
    obs.error = ko.observable('');
    // Reset error after a change:
    obs.subscribe(function() {
        obs.error('');
    });
    return obs;
};


// Facebook login support: native/plugin or web?
var fb = require('../utils/facebookUtils');
var facebookLogin = function() {
    if (window.facebookConnectPlugin) {
        // native/plugin
        return new Promise(function(s, e) {
            window.facebookConnectPlugin.login(['email'], s, e);
        });
    } else {
        // email,user_about_me
        return fb.login({
            scope: 'email'
        });
    }
};
var facebookMe = function() {
    if (window.facebookConnectPlugin) {
        return new Promise(function(s, e) {
            window.facebookConnectPlugin.api('/me?fields=email,first_name,last_name', ['email'], s, e);
        });
    } else if (window.FB) {
        return new Promise(function(s, e) {
            window.FB.api('/me', {
                fields: 'email,first_name,last_name'
            }, function(r) {
                if (!r || r.error)
                    e(r && r.error);
                else
                    s(r);
            });
        });
    }
};

var PasswordValidator = require('../utils/PasswordValidator');
var pwdValidator = new PasswordValidator();

function SignupVM(app) {
    //jshint maxstatements:55

    EventEmitter.call(this);

    this.confirmationCode = ko.observable(null);
    this.firstName = newFieldObs();
    this.lastName = newFieldObs();
    this.phone = newFieldObs();
    this.postalCode = newFieldObs();
    this.countryID = newFieldObs();
    this.referralCode = newFieldObs();
    this.device = newFieldObs();

    this.facebookUserID = ko.observable();
    this.facebookAccessToken = ko.observable();

    //var credentials = new FormCredentials();
    //this.email = credentials.username;
    //this.password = credentials.password;
    this.email = newFieldObs();
    this.password = newFieldObs();

    this.isFirstNameValid = ko.pureComputed(function() {
        // \p{L} the Unicode Characterset not supported by JS
        var firstNameRegex = /^(\S{2,}\s*)+$/;
        return firstNameRegex.test(this.firstName());
    }, this);

    this.isLastNameValid = ko.pureComputed(function() {
        var lastNameRegex = /^(\S{2,}\s*)+$/;
        return lastNameRegex.test(this.lastName());
    }, this);

    this.isPostalCodeValid = ko.pureComputed(function() {
        var postalCodeRegex = /^\d{5}([\-]?\d{4})?$/;
        return postalCodeRegex.test(this.postalCode());
    }, this);

/*
// Phone validation: valid North America patterns, 10 to 14 digits
var testData = [
    '(123) 456-7890',
    '123-456-7890',
    '123.456.7890',
    '1234567890',
    '(123) 456-78901',
    '123-456-789012',
    '123.456.7890123',
    '12345678901234'
];
var rValidChars = /[\d\(\)\-\.\ ]+/;
var rValidPatterns = /^\([1-9]\d{2}\)\ \d{3}\-\d{4,8}$|^[1-9]\d{2}\-\d{3}\-\d{4,8}$|^[1-9]\d{2}\.\d{3}\.\d{4,8}$|^[1-9]\d{9,13}$/;
var r = rValidPatterns;
var testResults = testData.map(n => r.test(n));
if (!testResults.reduce((ok, r) => ok ? r : false))
    console.error('Some test failed', testResults);
else
    console.info('Success');
*/

    this.isPhoneValid = ko.pureComputed(function() {
        var phoneRegex = /^\([1-9]\d{2}\)\ \d{3}\-\d{4,8}$|^[1-9]\d{2}\-\d{3}\-\d{4,8}$|^[1-9]\d{2}\.\d{3}\.\d{4,8}$|^[1-9]\d{9,13}$/;
        return phoneRegex.test(this.phone());
    }, this);

    this.isEmailValid = ko.pureComputed(function() {
        var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return emailRegex.test(this.email());
    }, this);

    this.isReferralCodeValid = ko.pureComputed(function() {
        var referralCodeRegex = /^.{3,}$/;
        return referralCodeRegex.test(this.referralCode());
    }, this);

    this.isPasswordValid = ko.pureComputed(function() {
        return pwdValidator.test(this.password());
    }, this);

    this.signupError = ko.observable('');

    this.isSigningUp = ko.observable(false);

    this.profile = ko.observable(''); // client, service-professional

    this.emailIsLocked = ko.observable(false);

    // A static utility (currently only used to conditionally show/hide DownloadApp links)
    this.inApp = ko.observable(!!window.cordova);

    this.reset = function() {
        this.confirmationCode(null);
        this.firstName('');
        this.lastName('');
        this.phone('');
        this.postalCode('');
        this.countryID('');
        this.referralCode('');
        this.device('');
        this.facebookUserID('');
        this.facebookAccessToken('');
        this.email('');
        this.password('');
        this.signupError('');
        this.isSigningUp(false);
        this.profile('');
        this.emailIsLocked(false);
    };

    this.submitText = ko.pureComputed(function() {
        return (
            this.isSigningUp() ? 'Signing up...' :
            this.facebookUserID() ? 'Sign up with Facebook' :
            'Sign up'
        );
    }, this);

    this.performSignup = function performSignup() {

        this.isSigningUp(true);

        // Clear previous error so makes clear we
        // are attempting
        this.signupError('');

        var plainData = {
            confirmationCode: this.confirmationCode(),
            email: this.email(),
            password: this.password(),
            firstName: this.firstName(),
            lastName: this.lastName(),
            phone: this.phone(),
            postalCode: this.postalCode(),
            countryID: this.countryID(),
            referralCode: this.referralCode(),
            device: this.device(),
            facebookUserID: this.facebookUserID(),
            facebookAccessToken: this.facebookAccessToken(),
            profileType: this.profile(),
        };

        return app.model.signup(plainData)
            .then(function(signupData) {

                this.isSigningUp(false);

                // Start onboarding
                if (app.model.onboarding)
                    app.model.onboarding.setStep(signupData.onboardingStep);

                // Remove form data
                this.reset();

                this.emit('signedup', signupData);

                return signupData;

            }.bind(this))
            .catch(function(err) {

                err = err && err.responseJSON;

                var msg = err && err.errorMessage;
                if (msg) {
                    // Using standard visualization of errors, since the field-based visualization can lead to usability problems (user not seeing the message)
                    app.modals.showError({
                        title: 'There was an error signing-up',
                        error: msg
                    });
                }
                // Process validation errors, tagging fields or general error
                if (err && err.errorSource === 'validation' && err.errors) {
                    Object.keys(err.errors)
                        .forEach(function(fieldKey) {
                            if (this[fieldKey] && this[fieldKey].error) {
                                this[fieldKey].error(err.errors[fieldKey]);
                            }
                        }.bind(this));
                } else {
                    this.signupError(msg || err && err.statusText || 'Invalid username or password');
                }

                this.isSigningUp(false);

                throw err;
            }.bind(this));

    }.bind(this);

    // For buttons
    this.clickSignup = function() {
        this.performSignup()
            .catch(function(err) {
                // Use event to catch up the error, since the promise catch it
                // since this will be triggered by a button and never will have chance
                // to detect the promise, showing up unknow errors in console
                this.emit('signuperror', err);
            }.bind(this));
    }.bind(this);

    this.forServiceProfessional = ko.pureComputed(function() {
        return this.profile() === 'service-professional';
    }, this);

    this.facebook = function() {
        var vm = this;

        // email,user_about_me
        facebookLogin()
            .then(function(result) {
                var auth = result.authResponse;
                // Set FacebookId to link accounts:
                vm.facebookUserID(auth.userID);
                vm.facebookAccessToken(auth.accessToken);
                // Request more user data
                facebookMe()
                    .then(function(user) {
                        //Fill Data
                        vm.email(user.email);
                        vm.firstName(user.first_name);
                        vm.lastName(user.last_name);
                        //(user.gender); // gender, birthday or any other, need to be included in the fields list at facebookMe to fetch them
                    });
            });
    };

    this.passwordRequirements = ko.pureComputed(function() {
        var pwd = this.password();
        return pwdValidator.test(pwd) ? '' : pwdValidator.errorMessage;
    }, this);
}

SignupVM._inherits(EventEmitter);

module.exports = SignupVM;
