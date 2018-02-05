/**
    Payments activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var A = Activity.extend(function PaymentsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSectionNavBar('Payments');
    this.title('Coming soon');
});

module.exports = A;
