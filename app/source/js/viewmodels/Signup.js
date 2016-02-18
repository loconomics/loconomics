/**
    View model for the signup form/container,
    shared across activity and client booking.
**/
'use strict';
var ko = require('knockout'),
    EventEmitter = require('events').EventEmitter;

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

function SignupVM(app) {
    
    EventEmitter.call(this);
    
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

    this.signupError = ko.observable('');
    
    this.isSigningUp = ko.observable(false);
    
    this.profile = ko.observable(''); // client, service-professional
    
    this.reset = function() {
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

            // Process validation errors, tagging fields or general error
            if (err && err.errorSource === 'validation' && err.errors) {
                Object.keys(err.errors).forEach(function(fieldKey) {
                    if (this[fieldKey] && this[fieldKey].error) {
                        this[fieldKey].error(err.errors[fieldKey]);
                    }
                }.bind(this));
            }
            else {
                var msg = err && err.errorMessage ||
                    err && err.statusText ||
                    'Invalid username or password';

                this.signupError(msg);
                this.email.error(msg);
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
        });
    }.bind(this);

    this.forServiceProfessional = ko.pureComputed(function() {
        return this.profile() === 'service-professional';
    }, this);
    
    this.facebook = function() {
        var fb = require('../utils/facebookUtils');
        var vm = this;

        // email,user_about_me
        fb.login({ scope: 'email' }).then(function (result) {
            var auth = result.auth,
                FB = result.FB;
            // Set FacebookId to link accounts:
            vm.facebookUserID(auth.userID);
            vm.facebookAccessToken(auth.accessToken);
            // Request more user data
            FB.api('/me', function (user) {
                //Fill Data
                vm.email(user.email);
                vm.firstName(user.first_name);
                vm.lastName(user.last_name);
                //(user.gender);
                //(user.about);
            });
        });
    };
}

SignupVM._inherits(EventEmitter);

module.exports = SignupVM;
