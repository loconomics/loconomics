/**
    UserJobProfileViewModel: loads data and keep state
    to display the listing of job titles from the
    user job profile.
**/
'use strict';

var ko = require('knockout');
var UserJobTitle = require('../models/UserJobTitle');
var userJobProfile = require('../data/userJobProfile');
var showError = require('../modals/error').show;

function UserJobProfileViewModel(app) {

    this.showMarketplaceInfo = ko.observable(false);

    function attachMarketplaceStatus(userJobtitle) {
        userJobtitle.marketplaceStatusHtml = ko.pureComputed(function() {
            var status = this.statusID();
            var isComplete = this.isComplete();
            // L18N
            if (isComplete && status === UserJobTitle.status.on) {
                return 'Marketplace listing: <strong class="text-success">ON</strong>';
            }
            else if (isComplete && status === UserJobTitle.status.off) {
                return 'Marketplace listing: <strong class="text-danger">OFF</strong>';
            }
            else {
                // TODO: read number of steps left to activate from required alerts for the jobtitle
                // '__count__ steps left to activate'
                return '<span class="text-danger">Steps remaining to activate listing</span>';
            }
        }, userJobtitle);
    }

    function attachExtras(userJobtitle) {
        attachMarketplaceStatus(userJobtitle);
    }

    var showLoadingError = function showLoadingError(err) {
        showError({
            title: 'An error happening when loading your job profile.',
            error: err
        });

        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(true);
    }.bind(this);

    this.userJobProfile = ko.observableArray([]);
    // Updated using the live list, for background updates
    userJobProfile.list.subscribe(function(list) {
        // Needs additional properties for the view
        list.forEach(attachExtras);

        this.userJobProfile(list);

        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(false);
    }, this);

    this.isFirstTime = ko.observable(true);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);
    this.thereIsError = ko.observable(false);
    this.baseUrl = ko.observable('/jobtitles');

    this.selectJobTitle = function(jobTitle) {
        // Gollow the next link:
        app.shell.go(this.baseUrl() + '/' + jobTitle.jobTitleID());
        // This function can be replaced by custom handling.
        // Stop events
        return false;
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
        userJobProfile.syncList()
        .catch(showLoadingError);

    }.bind(this);
}

module.exports = UserJobProfileViewModel;
