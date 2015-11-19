/**
    Provile activity
    
    Visualizes the public profile of a user, or current user
**/
'use strict';

var ko = require('knockout');

var Activity = require('../components/Activity');

var A = Activity.extend(function ProfileActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    var params = options.route && options.route.segments;
    this.viewModel.requestedUserID(params[0] |0);
};

function ViewModel(app) {

    this.requestedUserID = ko.observable(0);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);
    
    this.profile = ko.pureComputed(function() {
        if (this.requestedUserID() === 0) {
            // Show current user profile
            return app.model.user();
        }
        else {
            // TODO: load another user profile
        }
    }, this);
}
