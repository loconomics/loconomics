/**
    Performance activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function PerformanceActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSectionNavBar('Performance');
});

module.exports = A;
