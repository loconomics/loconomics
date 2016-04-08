/**
    Feedback activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function FeedbackActivity() {
    
    Activity.apply(this, arguments);
    
    this.navBar = Activity.createSectionNavBar('Talk to us');
});

exports.init = A.init;
