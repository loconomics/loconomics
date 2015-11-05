/**
    Login activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function LoginActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.anonymous;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Log in');
    this.navBar.rightAction(null);
    
    // Perform log-in request when is requested by the form:
    this.registerHandler({
        target: this.viewModel.isLogingIn,
        handler: function(v) {
            if (v === true) {

                // Perform loging

                // Notify state:
                var $btn = this.$activity.find('[type="submit"]');
                $btn.button('loading');

                // Clear previous error so makes clear we
                // are attempting
                this.viewModel.loginError('');

                var ended = function ended() {
                    this.viewModel.isLogingIn(false);
                    $btn.button('reset');
                }.bind(this);

                // After clean-up error (to force some view updates),
                // validate and abort on error
                // Manually checking error on each field
                if (this.viewModel.username.error() ||
                    this.viewModel.password.error()) {
                    this.viewModel.loginError('Review your data');
                    ended();
                    return;
                }

                this.app.model.login(
                    this.viewModel.username(),
                    this.viewModel.password()
                ).then(function(/*loginData*/) {

                    this.viewModel.loginError('');
                    ended();

                    // Remove form data
                    this.viewModel.username('');
                    this.viewModel.password('');
                    
                    if (this.requestData && this.requestData.redirectUrl)
                        this.app.shell.go(this.requestData.redirectUrl);
                    else
                        this.app.goDashboard();

                }.bind(this)).catch(function(err) {

                    var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                        err && err.statusText ||
                        'Invalid username or password';

                    this.viewModel.loginError(msg);
                    ended();
                }.bind(this));
            }
        }.bind(this)
    });
    
    // Focus first bad field on error
    this.registerHandler({
        target: this.viewModel.loginError,
        handler: function(err) {
            // Login is easy since we mark both unique fields
            // as error on loginError (its a general form error)
            var input = this.$activity.find(':input').get(0);
            if (err)
                input.focus();
            else
                input.blur();
        }.bind(this)
    });
    
    this.viewModel.facebook = function() {
        var fb = require('../utils/facebookUtils');
        
        // Notify state:
        var $btn = this.$activity.find('[type="submit"]');
        $btn.button('loading');

        // Clear previous error so makes clear we
        // are attempting
        this.viewModel.loginError('');

        
        var ended = function ended() {
            this.viewModel.isLogingIn(false);
            $btn.button('reset');
        }.bind(this);

        // email,user_about_me
        fb.login({ scope: 'email' })
        .then(function (result) {
            return this.app.model.facebookLogin(result.auth.accessToken)
            .then(function(/*loginData*/) {
                this.viewModel.loginError('');
                ended();

                // Remove form data
                this.viewModel.username('');
                this.viewModel.password('');

                if (this.requestData && this.requestData.redirectUrl)
                    this.app.shell.go(this.requestData.redirectUrl);
                else
                    this.app.goDashboard();

            }.bind(this));
        })
        .catch(function(err) {

            var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                err && err.statusText ||
                'Invalid login';

            this.viewModel.loginError(msg);
            ended();
        }.bind(this));
    }.bind(this);
});

exports.init = A.init;

var FormCredentials = require('../viewmodels/FormCredentials');

function ViewModel() {

    var credentials = new FormCredentials();    
    this.username = credentials.username;
    this.password = credentials.password;

    this.loginError = ko.observable('');
    
    this.isLogingIn = ko.observable(false);
    
    this.performLogin = function performLogin() {

        this.isLogingIn(true);        
    }.bind(this);
}
