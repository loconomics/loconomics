/**
    Jobtitles activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function JobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // On changing jobTitleID:
    // - load addresses
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                ////////////
                // Addresses
                this.app.model.serviceAddresses.getList(jobTitleID)
                .then(function(list) {

                    list = this.app.model.serviceAddresses.asModel(list);
                    this.viewModel.addresses(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
                
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
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.addresses([]);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments || {};
    
    //// Set the job title
    var jobID = params[0] |0;
    this.viewModel.jobTitleID(jobID);
};

function ViewModel(app) {
    
    this.jobTitleID = ko.observable(0);
    this.jobTitleName = ko.observable('Job Title');
    
    this.addresses = ko.observable([]);

    // Computed since it can check several externa loadings
    this.isLoading = ko.pureComputed(function() {

        // TODO: On services support, add the services loading
        return app.model.serviceAddresses.state.isLoading();
        
    }, this);
    
    this.addressesCount = ko.pureComputed(function() {
        
        // TODO l10n.
        // Use i18next plural localization support rather than this manual.
        var count = this.addresses().length,
            one = '1 location',
            more = ' locations';
        
        if (count === 1)
            return one;
        else
            // Small numbers, no need for formatting
            return count + more;

    }, this);
    
}
