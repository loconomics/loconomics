/**
    Booking Policies activity
**/
'use strict';

import UserJobTitle from '../models/UserJobTitle';
import { item as getUserListing } from '../data/userListings';

var ko = require('knockout');
var Activity = require('../components/Activity');
var userJobProfile = require('../data/userJobProfile');
var cancellationPolicies = require('../data/cancellationPolicies');
var showError = require('../modals/error').show;
var paymentAccount = require('../data/paymentAccount');
var payoutPreferenceRequired = require('../modals/payoutPreferenceRequired');

var A = Activity.extend(function BookingPoliciesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Listing', {
        backLink: 'listingEditor', helpLink: this.viewModel.helpLink
    });
    this.title = ko.pureComputed(function() {
        return this.listingTitle() + ' booking policies';
    }, this.viewModel);

    // On changing jobTitleID:
    // - load job title name
    // - load job profile with policies preferences
});

exports.init = A.init;

A.prototype.show = function show(state) {

    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    var jobTitleID = params[0] |0;

    // Resets
    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.listingTitle('Job Title');
    this.viewModel.userJobTitle(null);
    this.viewModel.selectedCancellationPolicyID(null);
    this.viewModel.instantBooking(null);
    // Load data by the listing job title
    if (jobTitleID) {
        this.viewModel.isLoading(true);
        getUserListing(jobTitleID).onceLoaded()
        .then((listing) => {
            // Direct copy of listing values
            this.viewModel.listingTitle(listing.title);
            this.viewModel.selectedCancellationPolicyID(listing.cancellationPolicyID);
            this.viewModel.instantBooking(listing.instantBooking);
            // Save for use in the view
            this.viewModel.userJobTitle(new UserJobTitle(listing));
            this.viewModel.isLoading(false);
        })
        .catch((error) => {
            this.viewModel.isLoading(false);
            showError({
                title: 'There was an error while loading booking policies.',
                error
            });
        });
    }

    // Request to sync policies, just in case there are remote changes
    cancellationPolicies.sync();
    paymentAccount.sync();
    if (!jobTitleID) {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {

    this.helpLink = '/help/sections/202884403-Setting-Your-Booking-Policies';

    this.jobTitleID = ko.observable(0);
    this.userJobTitle = ko.observable(null);
    this.listingTitle = ko.observable('Job Title');
    // Local copy of the cancellationPolicyID, rather than use
    // it directly from the userJobTitle to avoid that gets saved
    // in memory without press 'save'
    this.selectedCancellationPolicyID = ko.observable(null);
    this.instantBooking = ko.observable(null);

    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/bookingPolicies');

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'loading...' :
                this.isSaving() ?
                    'saving...' :
                    'Save'
        );
    }, this);

    /**
     * It validates if instantBooking is allowed prior save
     * @returns {Promise<boolean>} Whether satisfy validation or not
     */
    this.validateInstantBooking = function() {
        return paymentAccount.whenLoaded()
        .then(function() {
            return !this.instantBooking() || paymentAccount.data.isReady();
        }.bind(this));
    };

    var performSave = function() {
        var ujt = this.userJobTitle();
        if (ujt) {
            this.isSaving(true);

            var plain = ujt.model.toPlainObject();
            plain.cancellationPolicyID = this.selectedCancellationPolicyID();
            plain.instantBooking = this.instantBooking();

            userJobProfile.setUserJobTitle(plain)
            .then(function() {
                this.isSaving(false);
                app.successSave();
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                showError({ title: 'Unable to save booking policies', error: err });
            }.bind(this));
        }
    }.bind(this);

    this.save = function() {
        this.validateInstantBooking()
        .then(function(isValid) {
            if (isValid) {
                performSave();
            }
            else {
                // Direct user to set-up a payout preference
                payoutPreferenceRequired.show({
                    reason: payoutPreferenceRequired.Reason.enablingInstantBooking
                })
                .then(function(done) {
                    if (done) {
                        performSave();
                    }
                })
                .catch(function(err) {
                    showError({
                        title: 'Unable to set-up payout preference',
                        error: err
                    });
                });
            }
        });

    }.bind(this);

    this.policies = cancellationPolicies.list;
}
