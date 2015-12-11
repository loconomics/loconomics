/**
    Provile activity
    
    Visualizes the public profile of a user, or current user
**/
'use strict';

var ko = require('knockout');

var Activity = require('../components/Activity');
var PublicUser = require('../models/PublicUser');

var A = Activity.extend(function ProfileActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

A.prototype.loadData = function(userID, jobTitleID) {
    this.viewModel.reset();
    if (userID) {
        this.viewModel.isLoading(true);
        this.app.model.users.getUser(userID)
        .then(function(data) {
            var pu = new PublicUser(data);
            this.viewModel.user(pu);
            if (!jobTitleID)
                return pu.jobProfile() && pu.jobProfile()[0] && pu.jobProfile()[0].jobTitleID();
            else
                return jobTitleID;
        }.bind(this))
        .then(function(jobTitleID) {
            // For service professionals:
            if (jobTitleID) {
                this.viewModel.user().selectedJobTitleID(jobTitleID);
                // TODO Load extra job data
            }
        }.bind(this))
        .catch(function(err) {
            this.app.modals.showError({ error: err, title: 'The user profile could not be loaded.' });
        }.bind(this))
        .then(function() {
            // always
            this.viewModel.isLoading(false);
        }.bind(this));
    }
};

/**
    Parameters: /{userID:int}/{jobTitleID:int}
    Both are optional.
    If no userID, the current user profile is showed
    If not jobTitleID, the first one is returned
**/
A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = options.route && options.route.segments;
    // Get requested userID or the current user profile
    var userID = (params[0] |0) || this.app.model.user().userID();
    var jobTitleID = params[1] |0;
    this.loadData(userID, jobTitleID);
};

function ViewModel() {
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);

    this.reset = function() {
        this.user(null);
    };
}
