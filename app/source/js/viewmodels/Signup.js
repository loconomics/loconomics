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

var pwdRequirementsLabel = 'Your password must be at least 8 characters long, have at least: one lowercase letter, one uppercase letter, one symbol (~!@#$%^*&;?.+_), and one numeric digit.';
var pwdRegex = /(?=.{8,})(?=.*?[^\w\s])(?=.*?[0-9])(?=.*?[A-Z]).*?[a-z].*/;

function SignupVM(app) {

    EventEmitter.call(this);

    this.confirmationCode = ko.observable(null);
    this.firstName = newFieldObs();
    this.isFirstNameValid = ko.observable(false);
    this.lastName = newFieldObs();
    this.isLastNameValid = ko.observable(false);
    this.phone = newFieldObs();
    this.isPhoneValid = ko.observable(false);
    this.postalCode = newFieldObs();
    this.isPostalCodeValid = ko.observable(false);
    this.countryID = newFieldObs();
    this.referralCode = newFieldObs();
    this.isReferralCodeValid = ko.observable(false);
    this.device = newFieldObs();

    this.facebookUserID = ko.observable();
    this.facebookAccessToken = ko.observable();

    //var credentials = new FormCredentials();
    //this.email = credentials.username;
    //this.password = credentials.password;
    this.email = newFieldObs();
    this.isEmailValid = ko.observable(false);
    this.password = newFieldObs();
    this.isPasswordValid = ko.observable(false);

    this.checkFirstName = function() {
        // \p{L} the Unicode Characterset not supported by JS
        var firstNameRegex = /^([A-Za-zÄÖÜäöü]+\s*)+$/;
        this.isFirstNameValid(firstNameRegex.test(this.firstName()));
    };

    this.checkLastName = function() {
        var lastNameRegex = /^([A-Za-zÄÖÜäöü]+\s*)+$/;
        this.isLastNameValid(lastNameRegex.test(this.lastName()));
    };

    this.checkPostalCode = function() {
        var postalCodeRegex = /^\d{5}([\-]?\d{4})?$/;
        this.isPostalCodeValid(postalCodeRegex.test(this.postalCode()));
    };

    this.checkPhone = function() {
        var phoneRegex = /^\([1-9]\d{2}\)\ \d{3}\-\d{4,8}$|^[1-9]\d{2}\-\d{3}\-\d{4,8}$|^[1-9]\d{2}\.\d{3}\.\d{4,8}$|^[1-9]\d{9,13}$/;
        this.isPhoneValid(phoneRegex.test(this.phone()));
    };

    this.checkEmail = function() {
        var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        this.isEmailValid(emailRegex.test(this.email()));
    };

    this.checkReferralCode = function() {
        var referralCodeRegex = /^.{3,}$/;
        this.isReferralCodeValid(referralCodeRegex.test(this.referralCode()));
    };

    this.checkPassword = function() {
        var passwordRegex = /^.{8,}$/;
        this.isPasswordValid(passwordRegex.test(this.password()));
    };

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
        console.log(this.profile() === 'service-professional');
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
        return pwdRegex.test(pwd) ? '' : pwdRequirementsLabel;
    }, this);
}

SignupVM._inherits(EventEmitter);

module.exports = SignupVM;
