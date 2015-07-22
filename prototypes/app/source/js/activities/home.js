/**
    Home activity (aka Search)
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function HomeActivity() {
    
    Activity.apply(this, arguments);
    this.navBar = null;

    this.accessLevel = null;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    
};
