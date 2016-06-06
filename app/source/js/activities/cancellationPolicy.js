/**
    Cancellation Policy activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function CancellationPolicyActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: 'scheduling' , helpLink: '/help/relatedArticles/201966026-setting-your-cancellation-policy'
    });
    
    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.jobTitleName('Job Title');
            }
        }.bind(this)
    });
    // On changing jobTitleID:
    // - load addresses
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                this.viewModel.isLoading(true);
                // Get data for the Job title ID
                this.app.model.userJobProfile.getUserJobTitle(jobTitleID)
                .then(function(userJobTitle) {
                    // Save for use in the view
                    this.viewModel.userJobTitle(userJobTitle);
                    this.viewModel.selectedCancellationPolicyID(userJobTitle.cancellationPolicyID());
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this))
                .then(function() {
                    // Finally
                    this.viewModel.isLoading(false);
                }.bind(this));
            }
            else {
                this.viewModel.userJobTitle(null);
                this.viewModel.selectedCancellationPolicyID(null);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.jobTitleID(null);
    this.viewModel.selectedCancellationPolicyID(null);
    
    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    this.viewModel.jobTitleID(params[0] |0);
    
    // Request to sync policies, just in case there are remote changes
    this.app.model.cancellationPolicies.sync();
};

function ViewModel(app) {

    this.jobTitleID = ko.observable(0);
    this.userJobTitle = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title'); 
    // Local copy of the cancellationPolicyID, rather than use
    // it directly from the userJobTitle to avoid that gets saved
    // in memory without press 'save'
    this.selectedCancellationPolicyID = ko.observable(null);
    
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);
    
    this.submitText = ko.pureComputed(function() {
        return (
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

            app.model.userJobProfile.setUserJobTitle(plain)
            .then(function() {
                this.isSaving(false);
                app.successSave();
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                app.modals.showError({ title: 'Error saving Cancellation Policy preference', error: err });
            }.bind(this));
        }
    }.bind(this);

    this.policies = app.model.cancellationPolicies.list;
}

