/**
    Login activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function LoginActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.anonymous;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Log in');
    this.navBar.rightAction(null);
    
    // Updating URL for the view
    var app = this.app;
    var act = this;
    this.registerHandler({
        target: this.viewModel.view,
        handler: function(view) {
            if (!act.isNotFirstTime) return;
            switch (view) {
                case 'reset-password': {
                    app.shell.pushState(undefined, undefined, '/login/reset-password');
                    break;
                }
                case 'confirm-reset': {
                    app.shell.pushState(undefined, undefined, '/login/reset-password/confirm');
                    break;
                }
                default:
                case 'login': {
                    app.shell.pushState(undefined, undefined, '/login');
                    break;
                }
            }
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.viewModel.reset();
    var params = state && state.route && state.route.segments;
    var query = state && state.route && state.route.query;
    
    var redirectUrl = state.redirectUrl || query.redirectUrl;
    if (!redirectUrl && state.requiredLevel) {
        // Called from the shell access control after a failed access to an activity,
        // automatically use previous activity and returning URL
        redirectUrl = this.app.shell.referrerRoute && this.app.shell.referrerRoute.url;
    }
    this.viewModel.redirectUrl(redirectUrl);
    
    if (params[0] === 'reset-password') {
        var t = query.token || '';
        this.viewModel.resetToken(t);
        if (params[1] === 'confirm') {
            this.viewModel.goConfirm();
        }
        else {
            this.viewModel.goReset();
        }
    }
    else {
        this.viewModel.goLogin();
    }
    // Needed to avoid a problem of an early execution of the 'view handler' (at the super.show call)
    // that uses the default value for 'view' rather than the value that the URL sets.
    this.isNotFirstTime = true;
};

var FormCredentials = require('../viewmodels/FormCredentials');
var fb = require('../utils/facebookUtils');

// Facebook login support: native/plugin or web?
var facebookLogin = function() {
    if (window.facebookConnectPlugin) {
        // native/plugin
        return new Promise(function(s, e) {
            window.facebookConnectPlugin.login(['email'], s, e);
        });
    }
    else {        
        // email,user_about_me
        return fb.login({ scope: 'email' });
    }  
};

function ViewModel(app) {

    var credentials = new FormCredentials();    
    this.username = credentials.username;
    this.password = credentials.password;
    this.confirmPassword = ko.observable('');
    this.resetToken = ko.observable('');
    this.view = ko.observable('login');
    this.requestResetMessage = ko.observable('');
    this.isWorking = ko.observable(false);
    this.redirectUrl = ko.observable('');

    this.reset = function() {
        this.username('');
        this.password('');
        this.confirmPassword('');
        this.resetToken('');
        this.requestResetMessage('');
        this.isWorking(false);
        // The view is NEVER reset here, because can cause infinite loops. Must be managed outside by the 
        // activity.show, properly.
        //this.view('login');
    };
    
    this.loginButtonText = ko.pureComputed(function() {
        return this.isWorking() ? 'Logging you in...' : 'Log in';
    }, this);
    this.requestResetButtonText = ko.pureComputed(function() {
        return this.isWorking() ? 'Requesting a reset code...' : 'Reset my password';
    }, this);
    this.confirmResetButtonText = ko.pureComputed(function() {
        return this.isWorking() ? 'Resetting password...' : 'Reset my password';
    }, this);
    
    this.performLogin = function performLogin() {
        // Validation
        if (this.username.error() ||
            this.password.error() ||
            !this.username() ||
            !this.password()) {
            app.modals.showError({
                title: 'Validation',
                error: 'Type a valid e-mail and a password'
            });
            return;
        }
        this.isWorking(true);

        app.model.login(
            this.username(),
            this.password()
        ).then(function(/*loginData*/) {
            // Is implicit at reset: this.isWorking(false);
            this.reset();
            this.isWorking(false);
            
            if (app.model.onboarding.goIfEnabled())
                return;
            else if (this.redirectUrl())
                app.shell.go(this.redirectUrl());
            else
                app.goDashboard();

        }.bind(this)).catch(function(err) {
            this.isWorking(false);
            var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                err && err.statusText ||
                'Invalid username or password';
            app.modals.showError({
                title: 'Error logging in',
                error: msg
            });
        }.bind(this));
    }.bind(this);
    
    this.requestReset = function requestReset() {
        this.isWorking(true);
        app.model.resetPassword({ username: this.username() }).then(function(result) {
            this.requestResetMessage(result.message);
            this.isWorking(false);
            this.goConfirm();
        }.bind(this))
        .catch(function(error) {
            this.isWorking(false);
            app.modals.showError({
                title: 'Error requesting a password reset',
                error: error
            });
        }.bind(this));
    }.bind(this);

    this.confirmReset = function confirmReset() {
        this.isWorking(true);
        app.model.confirmResetPassword({
            password: this.password(),
            confirm: this.confirmPassword(),
            token: this.resetToken()
        }).then(function(result) {
            app.modals.showNotification({
                title: 'Done!',
                message: result.message
            });
            this.isWorking(false);
            this.goLogin();
        }.bind(this))
        .catch(function(error) {
            this.isWorking(false);
            app.modals.showError({
                title: 'Error resetting the password',
                error: error
            });
        }.bind(this));
    }.bind(this);
    
    // Facebook Login
    this.facebook = function() {
        facebookLogin()
        .then(function (result) {
            var accessToken = result.authResponse && result.authResponse.accessToken || result.auth && result.auth.accessToken;
            this.isWorking(true);
            return app.model.facebookLogin(accessToken)
            .then(function(/*loginData*/) {
                // Is implicit at reset: this.isWorking(false);
                this.reset();
                this.isWorking(false);

                if (this.redirectUrl())
                    app.shell.go(this.redirectUrl());
                else
                    app.goDashboard();

            }.bind(this));
        }.bind(this))
        .catch(function(err) {
            this.isWorking(false);
            var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                err && err.statusText ||
                'Invalid Facebook login';
            app.modals.showError({
                title: 'Error logging in',
                error: msg
            });
        }.bind(this));
    }.bind(this);

    this.goLogin = function() {
        this.view('login');
    }.bind(this);
    this.goReset = function() {
        this.view('reset-password');
    }.bind(this);
    this.goConfirm = function() {
        this.view('confirm-reset');
    }.bind(this);
}
