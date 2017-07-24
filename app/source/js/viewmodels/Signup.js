/**
    View model for the signup form/container,
    shared across activity and client booking.
**/
'use strict';

var ko = require('knockout'),
    EventEmitter = require('events').EventEmitter,
    ValidatedPasswordViewModel = require('./ValidatedPassword'),
    Field = require('./Field'),
    fb = require('../utils/facebookUtils'),
    countriesOptions = require('./CountriesOptions');
var auth = require('../data/auth');
var onboarding = require('../data/onboarding');

/**
 * Enum with valid values for profile type.
 * The value is the expected parameter value.
 */
var profileType = {
    serviceProfessional: 'service-professional',
    client: 'client'
};

// Facebook login support: native/plugin or web?
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

function SignupVM(app) {
    //jshint maxstatements:55

    EventEmitter.call(this);

    fb.load(); // load FB asynchronously, if it hasn't already been loaded

    this.confirmationCode = ko.observable(null);
    this.firstName = new Field();
    this.lastName = new Field();
    this.phone = new Field();
    this.postalCode = new Field();
    this.countriesOptions = countriesOptions();
    this.country = new Field();
    this.country(countriesOptions.unitedStates);
    this.referralCode = new Field();
    this.device = new Field();

    this.facebookUserID = ko.observable();
    this.facebookAccessToken = ko.observable();

    // Optionally, allow for service professional sign-up to
    // specify a job title that will be added to the profile at
    // the same sign-up call
    this.jobTitleID = ko.observable();
    // When user did not find a wanted job title, can provide
    // a name to request to create a new one.
    // Note: any value here is discarded if jobTitleID is provided
    this.jobTitleName = ko.observable();

    this.email = new Field();

    this.validatedPassword = new ValidatedPasswordViewModel();

    this.isCountryVisible = ko.observable(true);
    this.isEmailSignupDisplayed = ko.observable(false);

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

    this.signupError = ko.observable('');

    this.isSigningUp = ko.observable(false);
    this.isSigningUpWithFacebook = ko.observable(false);

    this.enableFacebookButton = ko.pureComputed(function() {
        return !this.isSigningUpWithFacebook() && fb.isReady();
    }, this);

    this.profile = ko.observable(''); // profileType

    this.emailIsLocked = ko.observable(false);

    this.reset = function() {
        this.confirmationCode(null);
        this.firstName('');
        this.lastName('');
        this.phone('');
        this.postalCode('');
        this.country(countriesOptions.unitedStates);
        this.referralCode('');
        this.device('');
        this.facebookUserID('');
        this.facebookAccessToken('');
        this.email('');
        this.validatedPassword.reset();
        this.signupError('');
        this.isSigningUp(false);
        this.isSigningUpWithFacebook(false);
        this.profile('');
        this.emailIsLocked(false);
        this.jobTitleID(null);
        this.jobTitleName(null);
        this.isEmailSignupDisplayed(false);
    };

    this.submitText = ko.pureComputed(function() {
        return (
            this.isSigningUp() ? 'Signing up...' :
            'Sign up'
        );
    }, this);

    this.facebookSubmitText = ko.pureComputed(function() {
        if(!fb.isReady()) {
            return 'Loading Facebook...';
        }
        else if(this.isSigningUpWithFacebook()) {
            return 'Signing up with Facebook...';
        }
        else {
            return 'Sign up with Facebook';
        }
    }, this);

    this.performSignup = function performSignup() {

        this.isSigningUp(true);

        // Clear previous error so makes clear we
        // are attempting
        this.signupError('');

        var plainData = {
            confirmationCode: this.confirmationCode(),
            email: this.email(),
            password: this.validatedPassword.password(),
            firstName: this.firstName(),
            lastName: this.lastName(),
            phone: this.phone(),
            postalCode: this.postalCode(),
            countryID: this.country().id,
            referralCode: this.referralCode(),
            device: this.device(),
            facebookUserID: this.facebookUserID(),
            facebookAccessToken: this.facebookAccessToken(),
            profileType: this.profile(),
            jobTitleID: this.jobTitleID(),
            jobTitleName: this.jobTitleName()
        };

        return auth.signup(plainData)
            .then(function(signupData) {

                // The reset includes already a call
                // to: this.isSigningUp(false);
                // we left the task to that so the form can get
                // locked if a handler attacked choose to not reset the form

                // Start onboarding
                if (onboarding) {
                    onboarding.selectedJobTitleID(signupData.onboardingJobTitleID);
                    onboarding.setStep(signupData.onboardingStep);
                }

                // Emit event before resetting data (to prevent some
                // flickering effects, wrong state visualization), but
                // we ensure that
                // - the 'reset' happens even if an error is throw at handlers
                // - the error still throws to the promise
                // - if no handler connected, reset happens immediately
                // - otherwise, the handler is in charge to call the reset
                //  (that allows to set some presets too, or alternative
                //  actions, like block the form)
                try {
                    if (!this.emit('signedup', signupData)) {
                        this.reset();
                    }
                }
                catch (ex) {
                    // Remove form data
                    this.reset();
                }

                return signupData;

            }.bind(this))
            .catch(function(err) {

                err = err && err.responseJSON;

                var msg = err && err.errorMessage;
                // Using standard visualization of errors, since the field-based visualization can lead to usability problems (user not seeing the message)
                app.modals.showError({
                    title: 'There was an error signing-up',
                    error: err
                });

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
        return this.profile() === profileType.serviceProfessional;
    }, this);

    this.forClient = ko.pureComputed(function() {
        return !this.forServiceProfessional();
    }, this);

    this.facebook = function() {
        var vm = this;

        this.isSigningUpWithFacebook(true);
        // Switch visualization of email form
        this.isEmailSignupDisplayed(false);

        // First ask to log-in with Facebook
        // email,user_about_me
        facebookLogin()
        .then(function(result) {
            // Set authorization data
            var auth = result.authResponse;
            // Set FacebookId to link accounts:
            vm.facebookUserID(auth.userID);
            vm.facebookAccessToken(auth.accessToken);

            // Request more user data
            return facebookMe();
        })
        .then(function(user) {
            //Fill Data
            vm.email(user.email);
            vm.firstName(user.first_name);
            vm.lastName(user.last_name);
            //(user.gender); // gender, birthday or any other, need to be included in the fields list at facebookMe to fetch them
        })
        // Complete sign-up
        .then(this.clickSignup)
        .then(function() {
            this.isSigningUpWithFacebook(false);
        }.bind(this))
        .catch(function(err) {
            this.emit('signuperror', err);
        }.bind(this));
    };

    this.showEmailSignup = function() {
        this.isEmailSignupDisplayed(true);
    };
}

SignupVM._inherits(EventEmitter);

module.exports = SignupVM;
SignupVM.profileType = profileType;
