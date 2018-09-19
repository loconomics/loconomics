/**
    Service Addresses activity
**/
'use strict';

import { item as getUserListing } from '../data/userListings';

var ko = require('knockout');
var $ = require('jquery');
var Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
var serviceAddresses = require('../data/serviceAddresses');
var clientAddresses = require('../data/clientAddresses');
var showError = require('../modals/error').show;
var UserJobProfile = require('../viewmodels/UserJobProfile');
var ServiceAddresses = require('../viewmodels/ServiceAddresses');

var A = Activity.extend(function ServiceAddressesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/scheduling', helpLink: this.viewModel.helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;

    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);

    this.title = ko.pureComputed(function() {
        if(this.isInOnboarding() && this.serviceAddresses.sourceAddresses().length === 0) {
            return 'Where do you work as a ' + this.listingTitle() + '?';
        }
        else if (this.isInOnboarding()) {
            return 'Location for your listing';
        }
        else if(this.serviceAddresses.isSelectionMode()) {
            return 'Choose a place for this booking';
        }
        else {
            return 'Location';
        }
    }, this.viewModel);

    // On changing clientUserID: load its addresses
    this.registerHandler({
        target: this.viewModel.clientUserID,
        handler: function(clientUserID) {
            if (clientUserID) {
                clientAddresses.getList(clientUserID)
                .then(function(list) {
                    list = this.clientAddresses.asModel(list);
                    this.viewModel.clientAddresses.sourceAddresses(list);
                    if (this.requestData.selectedAddressID) {
                        this.viewModel.clientAddresses.presetSelectedAddressID(this.requestData.selectedAddressID);
                    }
                }.bind(this));
            }
            else {
                this.viewModel.clientAddresses.sourceAddresses([]);
                this.viewModel.clientAddresses.selectedAddress(null);
            }
        }.bind(this)
    });

    // Go back with the selected address when triggered in the form/view
    this.viewModel.returnSelected = function(addressID, jobTitleID) {
        // Pass the selected client in the info
        this.requestData.selectedAddressID = addressID;
        this.requestData.selectedJobTitleID = jobTitleID;
        // And go back
        this.app.shell.goBack(this.requestData);
    }.bind(this);
    this.viewModel.returnAddress = function(addressDetails) {
        this.requestData.address = addressDetails;
        // And go back
        this.app.shell.goBack(this.requestData);
    }.bind(this);

    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.applyOwnNavbarRules = function() {
    /* eslint complexity:"off" */

    var itIs = this.viewModel.serviceAddresses.isSelectionMode();

    if (this.requestData.title) {
        // Replace title by title if required
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
    }

    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink, this.requestData);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction, true);

        var jid = this.viewModel.jobTitleID();
        var jname = this.viewModel.listingTitle() || 'Scheduler';
        var url = this.mustReturnTo || (jid && '/listing-editor/' + jid || '/schedulingPreferences');

        this.navBar.leftAction().link(url);
        this.navBar.leftAction().text(this.requestData.navTitle || jname);
    }

    if (itIs && !this.requestData.cancelLink) {
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
    else if (!this.requestData.cancelLink) {
        this.navBar.leftAction().handler(null);
    }
};

A.prototype.updateNavBarState = function updateNavBarState() {
    // Perform updates that apply this request:
    return onboarding.updateNavBar(this.navBar) || this.applyOwnNavbarRules();
};

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Remember route to go back, from a request of 'mustReturn' or last requested
    this.mustReturnTo = this.requestData.route.query.mustReturn || this.mustReturnTo;

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.clientUserID(0);
    this.viewModel.requestData = this.requestData;

    this.viewModel.serviceAddresses.isSelectionMode(options.selectAddress === true);
    this.viewModel.clientUserID(options.clientUserID || null);

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;

    // Check if it comes from an address-editor that
    // received the flag 'returnNewAsSelected': we were in selection mode->creating address->must
    // return the just created address to the previous page
    if (options.returnNewAsSelected === true) {
        setTimeout(function() {
            delete options.returnNewAsSelected;
            if (options.address)
                this.viewModel.returnAddress(options.address);
            else if (options.addressID)
                this.viewModel.returnSelected(options.addressID, jobTitleID);
        }.bind(this), 1);
        // quick return
        return;
    }

    // Resets
    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.listingTitle('Job Title');
    this.viewModel.serviceAddresses.sourceAddresses([]);
    this.viewModel.serviceAddresses.selectedAddress(null);
    // Data for listing
    if (jobTitleID) {
        // Get Listing Title
        const listingDataProvider = getUserListing(jobTitleID);
        this.subscribeTo(listingDataProvider.onData, (listing) => {
            this.viewModel.listingTitle(listing.title);
            this.updateNavBarState();
        });
        this.subscribeTo(listingDataProvider.onDataError, (error) => {
            showError({
                title: 'Unable to load listing details.',
                error
            });
        });
        // Get data for the Job title ID
        return serviceAddresses.getList(jobTitleID)
        .then(function(list) {
            list = serviceAddresses.asModel(list);
            this.viewModel.serviceAddresses.sourceAddresses(list);
            if (this.requestData.selectedAddressID) {
                this.viewModel.serviceAddresses.presetSelectedAddressID(this.requestData.selectedAddressID);
            }
        }.bind(this))
        .catch(function (err) {
            showError({
                title: 'There was an error while loading.',
                error: err
            });
        });
    }
    else {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }

    this.updateNavBarState();
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201965996-setting-your-service-locations-areas';

    this.isInOnboarding = onboarding.inProgress;

    this.serviceAddresses = new ServiceAddresses();

    this.addLocationLabel = ko.pureComputed(function() {
        return this.isInOnboarding() ? 'Place clients come to see you' :
                                       'Add a service location';
    }, this);

    this.addAreaLabel = ko.pureComputed(function() {
        return this.isInOnboarding() ? 'Area where you go to clients' :
                                       'Add a service area/radius';
    }, this);

    this.jobTitleID = ko.observable(0);

    // Optionally, some times a clientUserID can be passed in order to create
    // a location for that client where perform a work.
    this.clientUserID = ko.observable(null);
    this.clientAddresses = new ServiceAddresses();
    // The list of client addresses is used only in selection mode
    this.clientAddresses.isSelectionMode(true);

    this.showSupportingText = ko.pureComputed(function() {
        return !(this.clientAddresses.hasAddresses() || this.serviceAddresses.isSelectionMode());
    }, this);

    this.listingTitle = ko.observable('Job Title');
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceAddress');

    this.isSyncing = serviceAddresses.state.isSyncing();
    this.isLoading = ko.computed(function() {
        var add = serviceAddresses.state.isLoading();
        var jobs = this.jobTitles.isLoading();
        var cli = clientAddresses.state.isLoading();
        return add || jobs || cli;
    }, this);

    this.goNext = function() {
        if (onboarding.inProgress()) {
            // Ensure we keep the same jobTitleID in next steps as here:
            onboarding.selectedJobTitleID(this.jobTitleID());
            onboarding.goNext();
        }
    }.bind(this);

    // Replace default selectAddress
    this.serviceAddresses.selectAddress = function(selectedAddress, event) {
        if (this.serviceAddresses.isSelectionMode() === true) {
            // Run method injected by the activity to return a
            // selected address:
            this.returnSelected(
                selectedAddress.addressID(),
                selectedAddress.jobTitleID()
            );
        }
        else {
            app.shell.go('address-editor/service/' +
                this.jobTitleID() +
                '/' + selectedAddress.addressID()
            );
        }

        event.preventDefault();
        event.stopImmediatePropagation();

    }.bind(this);

    this.clientAddresses.selectAddress = function(selectedAddress, event) {
        if (this.clientAddresses.isSelectionMode() === true) {
            // Run method injected by the activity to return a
            // selected address:
            this.returnAddress(selectedAddress.model.toPlainObject());
        }

        event.preventDefault();
        event.stopImmediatePropagation();

    }.bind(this);

    this.addServiceLocation = function() {
        var url = '#!address-editor/service/' + this.jobTitleID() + '/serviceLocation';
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);

    this.addServiceArea = function() {
        var url = '#!address-editor/service/' + this.jobTitleID() + '/serviceArea';
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);

    this.addClientLocation = function() {
        var url = '#!address-editor/service/' + this.jobTitleID() + '/clientLocation/' + this.clientUserID();
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);

    this.onboardingNextReady = ko.computed(function() {
        var isin = onboarding.inProgress();
        var hasItems = this.serviceAddresses.sourceAddresses().length > 0;

        return isin && hasItems;
    }, this);
}
