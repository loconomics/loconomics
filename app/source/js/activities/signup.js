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

                // Notify state:
                var $btn = this.$activity.find('[type="submit"]');
                $btn.button('loading');

                // Clear previous error so makes clear we
                // are attempting
                this.viewModel.signupError('');

                var ended = function ended() {
                    this.viewModel.isSigningUp(false);
                    $btn.button('reset');
                }.bind(this);

                // After clean-up error (to force some view updates),
                // validate and abort on error
                // Manually checking error on each field
                if (this.viewModel.email.error() ||
                    this.viewModel.password.error()) {
                    this.viewModel.signupError('Review your data');
                    ended();
                    return;
                }

                this.app.model.signup(
                    this.viewModel.email(),
                    this.viewModel.password(),
                    this.viewModel.profile()
                ).then(function(signupData) {

                    this.viewModel.signupError('');
                    ended();
                    
                    // Start onboarding
                    this.app.model.onboarding.setStep(signupData.onboardingStep);

                    // Remove form data
                    this.viewModel.email('');
                    this.viewModel.password('');

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
    
    this.viewModel.facebook = function() {
        
    };
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.viewModel.profile(options.route.segments[0]);
    }
};


var FormCredentials = require('../viewmodels/FormCredentials');
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

    var credentials = new FormCredentials();    
    this.email = credentials.username;
    this.password = credentials.password;

    this.signupError = ko.observable('');
    
    this.isSigningUp = ko.observable(false);
    
    this.performSignup = function performSignup() {

        this.isSigningUp(true);
    }.bind(this);

    this.profile = ko.observable('client');
    this.forServiceProfessional = ko.pureComputed(function() {
        return this.profile() === 'serviceProfessional';
    }, this);
}
