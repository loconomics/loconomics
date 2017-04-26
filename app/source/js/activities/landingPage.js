/**
 *
 *
 *
 **/
'use strict';

var Activity = require('../components/Activity'),
    SignupVM = require('../viewmodels/Signup');

var A = Activity.extend(function LandingPageActivity() {
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
};

function ViewModel(app) {
    this.signup = new SignupVM(app); 
    this.signup.profile('service-professional');
}
