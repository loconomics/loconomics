/**
    SplashThanks activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function SplashThanksActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = {
        isServiceProfessional: ko.observable(false)
    };
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var p = state && state.params && state.params[0];
    this.viewModel.isServiceProfessional(p === 'service-professional');
};
