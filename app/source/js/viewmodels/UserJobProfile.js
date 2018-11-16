/**
    UserJobProfileViewModel: loads data and keep state
    to display the listing of job titles from the
    user job profile.
**/
'use strict';

import UserJobTitle from '../models/UserJobTitle';
import ko from 'knockout';
import shell from '../app.shell';
import { show as showError } from '../modals/error';
import { list as userListings } from '../data/userListings';

function UserJobProfileViewModel() {

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

    var showLoadingError = function(error) {
        showError({
            title: 'An error happening when loading your job profile.',
            error
        });

        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(true);
    }.bind(this);

    this.userJobProfile = ko.observableArray([]);
    // Updated using the live list, for background updates
    userListings.onData.subscribe((listings) => {
        // Convert to model with additional properties for the view
        const list = listings.map((listing) => {
            const m = new UserJobTitle(listing);
            attachMarketplaceStatus(m);
            return m;
        });

        this.userJobProfile(list);

        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(false);
    });
    userListings.onDataError.subscribe(showLoadingError);

    this.isFirstTime = ko.observable(true);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);
    this.thereIsError = ko.observable(false);
    this.baseUrl = ko.observable('/jobtitles');

    this.selectJobTitle = function(jobTitle) {
        // Gollow the next link:
        shell.go(this.baseUrl() + '/' + jobTitle.jobTitleID());
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
        // NOTE: In a proper component-based usage of this VM, this call and this
        // whole 'sync' method would not be needed since a load will be triggered
        // by subscribing to onLoad as done previously
        userListings.onceLoaded()
        .catch(showLoadingError);

    }.bind(this);
}

module.exports = UserJobProfileViewModel;
