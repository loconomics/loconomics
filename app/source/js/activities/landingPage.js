/**
 * Landing page activity. This is meant to be used within landing pages, not with in the app.
 *
 * @exports a landing page activity, which extends components/Activity
 **/
'use strict';

var Activity = require('../components/Activity'),
    SignupVM = require('../viewmodels/Signup');

var A = Activity.extend(function LandingPageActivity() {
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);

    this.registerHandler({
        target: this.viewModel.signup,
        event: 'signedup',
        handler: function(signedupData) {
            window.location.href = signedupData.redirectUrl;
        }.bind(this)
    });

});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
};

function ViewModel(app) {
    this.signup = new SignupVM(app); 
    this.signup.profile('service-professional');
}
