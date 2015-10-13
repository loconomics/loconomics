/**
    Terms activity
**/
'use strict';

var Activity = require('../components/Activity');

var $ = require('jquery');

var A = Activity.extends(function TermsActivity() {
    
    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;
    
    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    this.$activity.find('#terms-index a').click(function (e) 
    {
        e.preventDefault();
        $(this).tab('show');
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state); 
};
