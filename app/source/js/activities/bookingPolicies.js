/**
    Booking Policies activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
var jobTitles = require('../data/jobTitles');
var userJobProfile = require('../data/userJobProfile');
var cancellationPolicies = require('../data/cancellationPolicies');
var userJobProfile = require('../data/userJobProfile');
var cancellationPolicies = require('../data/cancellationPolicies');

var A = Activity.extend(function BookingPoliciesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: 'scheduling', helpLink: this.viewModel.helpLink
    });

    this.defaultNavBar = this.navBar.model.toPlainObject(true);

    // On changing jobTitleID:
    // - load job title name
    // - load job profile with policies preferences
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'Unable to load listing details.',
                        error: err
                    });
                }.bind(this));

                this.viewModel.isLoading(true);
                // Get data for the Job title ID
                userJobProfile.getUserJobTitle(jobTitleID)
                .then(function(userJobTitle) {
                    // Save for use in the view
                    this.viewModel.userJobTitle(userJobTitle);
                    this.viewModel.selectedCancellationPolicyID(userJobTitle.cancellationPolicyID());
                    this.viewModel.instantBooking(userJobTitle.instantBooking());
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'Unable to load policies.',
                        error: err
                    });
                }.bind(this))
                .then(function() {
                    // Finally
                    this.viewModel.isLoading(false);
                }.bind(this));

                // Fix URL
                // If the URL didn't included the jobTitleID, or is different,
                // we put it to avoid reload/resume problems
                var found = /bookingPolicies\/(\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;
                if (urlID !== jobTitleID) {
                    var url = '/bookingPolicies/' + jobTitleID;
                    this.app.shell.replaceState(null, null, url);
                }
            }
            else {
                this.viewModel.jobTitleName('Job Title');
                this.viewModel.userJobTitle(null);
                this.viewModel.selectedCancellationPolicyID(null);
                this.viewModel.instantBooking(null);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar, true);
    }
};

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.jobTitleID(null);
    this.viewModel.selectedCancellationPolicyID(null);
    this.viewModel.instantBooking(null);

    Activity.prototype.show.call(this, state);

    this.updateNavBarState();

    var params = state && state.route && state.route.segments;
    var jid = params[0] |0;
    this.viewModel.jobTitleID(jid);

    // Request to sync policies, just in case there are remote changes
    cancellationPolicies.sync();
    if (!jid) {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {

    this.helpLink = '/help/sections/202884403-Setting-Your-Booking-Policies';

    this.isInOnboarding = onboarding.inProgress;

    this.jobTitleID = ko.observable(0);
    this.userJobTitle = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title');
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
    this.jobTitles.selectJobTitle = function(jobTitle) {

        this.jobTitleID(jobTitle.jobTitleID());

        return false;
    }.bind(this);

    this.submitText = ko.pureComputed(function() {
        return (
            onboarding.inProgress() ?
                'Save and continue' :
                this.isLoading() ?
                    'loading...' :
                    this.isSaving() ?
                        'saving...' :
                        'Save'
        );
    }, this);

    this.save = function() {
        var ujt = this.userJobTitle();
        if (ujt) {
            this.isSaving(true);

            var plain = ujt.model.toPlainObject();
            plain.cancellationPolicyID = this.selectedCancellationPolicyID();
            plain.instantBooking = this.instantBooking();

            userJobProfile.setUserJobTitle(plain)
            .then(function() {
                this.isSaving(false);
                // Move forward:
                if (onboarding.inProgress()) {
                    // Ensure we keep the same jobTitleID in next steps as here:
                    onboarding.selectedJobTitleID(this.jobTitleID());
                    onboarding.goNext();
                } else {
                    app.successSave();
                }
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                app.modals.showError({ title: 'Unable to save booking policies', error: err });
            }.bind(this));
        }
    }.bind(this);

    this.policies = cancellationPolicies.list;
}

