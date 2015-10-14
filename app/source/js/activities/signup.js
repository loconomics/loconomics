/**
    Signup activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function SignupActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.anonymous;
    this.viewModel = new ViewModel(this.app);
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    
    // Perform sign-up request when is requested by the form:
    this.registerHandler({
        target: this.viewModel.isSigningUp,
        handler: function(v) {
            if (v === true) {

                // Perform signup

                // Clear previous error so makes clear we
                // are attempting
                this.viewModel.signupError('');

                var ended = function ended() {
                    this.viewModel.isSigningUp(false);
                }.bind(this);
                
                var plainData = {
                    email: this.viewModel.email(),
                    password: this.viewModel.password(),
                    firstName: this.viewModel.firstName(),
                    lastName: this.viewModel.lastName(),
                    phone: this.viewModel.phone(),
                    postalCode: this.viewModel.postalCode(),
                    referralCode: this.viewModel.referralCode(),
                    device: this.viewModel.device(),
                    facebookUserID: this.viewModel.facebookUserID(),
                    facebookAccessToken: this.viewModel.facebookAccessToken(),
                    profileType: this.viewModel.profile(),
                };

                this.app.model.signup(plainData)
                .then(function(signupData) {

                    this.viewModel.signupError('');
                    ended();
                    
                    // Start onboarding
                    this.app.model.onboarding.setStep(signupData.onboardingStep);

                    // Remove form data
                    this.viewModel.reset();

                    this.app.goDashboard();

                }.bind(this)).catch(function(err) {
                    
                    err = err && err.responseJSON;
                    
                    if (err && err.errorSource === 'validation' && err.errors) {
                        Object.keys(err.errors).forEach(function(fieldKey) {
                            this.viewModel[fieldKey].error(err.errors[fieldKey]);
                        }.bind(this));
                    }
                    else {
                        var msg = err && err.errorMessage ||
                            err && err.statusText ||
                            'Invalid username or password';

                        this.viewModel.signupError(msg);
                    }

                    ended();
                }.bind(this));
            }
        }.bind(this)
    });
    
    // Focus first bad field on error
    this.registerHandler({
        target: this.viewModel.signupError,
        handler: function(err) {
            // Signup is easy since we mark both unique fields
            // as error on signupError (its a general form error)
            var input = this.$activity.find(':input').get(0);
            if (err)
                input.focus();
            else
                input.blur();
        }.bind(this)
    });
    
    var vm = this.viewModel;
    this.viewModel.facebook = function() {
        var fb = require('../utils/facebookUtils');

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
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    this.viewModel.reset();
    
    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.viewModel.profile(options.route.segments[0]);
    }
};


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

function ViewModel() {
    
    this.firstName = newFieldObs();
    this.lastName = newFieldObs();
    this.phone = newFieldObs();
    this.postalCode = newFieldObs();
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
    this.submitText = ko.pureComputed(function() {
        return (
            this.isSigningUp() ? 'Signing up...' :
            this.facebookUserID() ? 'Sign up with Facebook' :
            'Sign up'
        );
    }, this);
    
    this.performSignup = function performSignup() {

        this.isSigningUp(true);
    }.bind(this);

    this.profile = ko.observable('client');
    this.forServiceProfessional = ko.pureComputed(function() {
        return this.profile() === 'serviceProfessional';
    }, this);
    
    this.reset = function() {
        this.firstName('');
        this.lastName('');
        this.phone('');
        this.postalCode('');
        this.referralCode('');
        this.device('');
        this.facebookUserID('');
        this.facebookAccessToken('');
    };
}
