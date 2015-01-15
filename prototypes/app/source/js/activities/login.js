/**
    Index activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    User = require('../models/User');

var singleton = null;

exports.init = function initLogin($activity, app) {

    if (singleton === null)
        singleton = new LoginActivity($activity, app);
    
    return singleton;
};

function LoginActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navAction = NavAction.goBack;
    
    this.dataView.isLogingIn.subscribe(function(v) {
        if (v === true) {
            
            // Perform loging
            var $btn = $activity.find('[type="submit"]');
            $btn.button('loading');
            
            var ended = function ended() {
                this.dataView.isLogingIn(false);
                $btn.button('reset');
            }.bind(this);
            
            app.model.login(
                this.dataView.username(),
                this.dataView.password()
            ).then(function() {
                
                // TODO Get User info
                fakeLogin(this.app);
                
                this.dataView.loginError('');
                ended();
                
                // NOTE: onboarding or not?
                var onboarding = false;
                if (onboarding) {
                    this.app.shell.go('onboardingHome');
                }
                else {
                    this.app.shell.go('home');
                }

            }.bind(this)).catch(function() {
                
                this.dataView.loginError('Invalid username or password');
                ended();
            }.bind(this));
        }
    }.bind(this));
}

LoginActivity.prototype.show = function show(options) {
    
    // NOTE: direclty editing the app status.
    this.app.status('login');
};

function ViewModel() {
    
    this.username = ko.observable('');
    this.password = ko.observable('');
    this.loginError = ko.observable('');
    
    this.isLogingIn = ko.observable(false);
    
    this.performLogin = function performLogin() {

        this.isLogingIn(true);        
    }.bind(this);
}

// TODO: remove after implement real login
function fakeLogin(app) {
    app.model.user(new User({
        email: 'test@loconomics.com',
        firstName: 'Username',
        onboardingStep: null,
        isProvider: true
    }));
}
