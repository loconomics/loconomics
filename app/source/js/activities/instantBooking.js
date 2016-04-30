/**
    Jobtitles activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extend(function JobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/scheduling'
    });
    
    // On changing jobTitleID:
    // - load addresses
    // - load job title information
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {
                ////////////
                // Job Title
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {

                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                }.bind(this))
                .catch(function(err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading the job title.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.jobTitleName('Job Title');
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);

    // Parameters
    var params = state && state.route && state.route.segments || {};
    
    // Set the job title
    var jobID = params[0] |0;
    this.viewModel.jobTitleID(jobID);
};

function ViewModel(app) {
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    this.userJobTitle = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title'); 
    
    // Retrieves a computed that will link to the given named activity adding the current
    // jobTitleID and a mustReturn URL to point this page so its remember the back route
    this.getJobUrlTo = function(name) {
        // Sample '/serviceProfessionalServices/' + jobTitleID()
        return ko.pureComputed(function() {
            return (
                '/' + name + '/' + this.jobTitleID() + '?mustReturn=jobtitles/' + this.jobTitleID() +
                '&returnText=' + this.jobTitleName()
            );
        }, this);
    };
    
    this.instantBooking = ko.pureComputed(function() {
        return this.userJobTitle() && this.userJobTitle().instantBooking();
    }, this);
    
    this.instantBookingLabel = ko.pureComputed(function() {
        return this.instantBooking() ? 'ON' : 'OFF';
    }, this);
    
    this.toggleInstantBooking = function() {
        var current = this.instantBooking();
        if (this.userJobTitle()) {
            // Change immediately, while saving in background
            this.userJobTitle().instantBooking(!current);
            // Push change to server
            var plain = this.userJobTitle().model.toPlainObject();
            plain.instantBooking = !current;

            app.model.userJobProfile.setUserJobTitle(plain)
            .catch(function(err) {
                app.modals.showError({ title: 'Error saving Instant Booking preference', error: err });
                // On error, original value must be restored (so can attempt to change it again)
                this.userJobTitle().instantBooking(current);
            }.bind(this));
        }
    };
}
