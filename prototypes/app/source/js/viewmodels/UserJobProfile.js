/**
    UserJobProfileViewModel: loads data and keep state
    to display the listing of job titles from the 
    user job profile.
**/
'use strict';

var ko = require('knockout');

function UserJobProfileViewModel(app) {
    
    // Load and save job title info
    var jobTitlesIndex = {};
    function syncJobTitle(jobTitleID) {
        return app.model.jobTitles.getJobTitle(jobTitleID)
        .then(function(jobTitle) {
            jobTitlesIndex[jobTitleID] = jobTitle;

            // TODO: errors? not-found job title?
        });
    }
    // Creates a 'jobTitle' observable on the userJobTitle
    // model to have access to a cached jobTitle model.
    function attachJobTitle(userJobTitle) {
        userJobTitle.jobTitle = ko.computed(function(){
            return jobTitlesIndex[this.jobTitleID()];
        }, userJobTitle);
    }
    
    this.userJobProfile = ko.observableArray([]);
    // Updated using the live list, for background updates
    app.model.userJobProfile.list.subscribe(function(list) {
        // We need the job titles info before end
        Promise.all(list.map(function(userJobTitle) {
            return syncJobTitle(userJobTitle.jobTitleID());
        }))
        .then(function() {
            // Create jobTitle property before update
            // observable with the profile
            list.forEach(attachJobTitle);

            this.userJobProfile(list);

            this.isLoading(false);
            this.isSyncing(false);
            this.thereIsError(false);
        }.bind(this))
        .catch(showLoadingError);
    }, this);

    this.isFirstTime = ko.observable(true);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);
    this.thereIsError = ko.observable(false);
    this.baseUrl = ko.observable('/jobtitles');
    
    this.selectJobTitle = function() {
        // Hook to allow for custom handler rather than follow
        // the URL. On that cases, remember to return false
        return true;
    };
    
    var showLoadingError = function showLoadingError(err) {
        app.modals.showError({
            title: 'An error happening when loading your job profile.',
            error: err && err.error || err
        });
        
        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(true);
    }.bind(this);

    // Loading and sync of data
    this.sync = function sync() {
        var firstTime = this.isFirstTime();
        this.isFirstTime(false);

        if (firstTime) {
            this.isLoading(true);
        }
        else {
            this.isSyncing(true);
        }

        // Keep data updated:
        app.model.userJobProfile.syncList()
        .catch(showLoadingError);

    }.bind(this);
}

module.exports = UserJobProfileViewModel;
