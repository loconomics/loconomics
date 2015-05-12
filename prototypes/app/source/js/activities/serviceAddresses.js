/**
    Service Addresses activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function ServiceAddressesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Job Title');
    
    // Getting elements
    this.$listView = this.$activity.find('#addressesListView');

    // On changing jobTitleID:
    // - load addresses
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    if (!this.viewModel.isSelectionMode()) {
                        // Fill in job title name
                        this.navBar.leftAction().text(jobTitle.singularName());
                    }
                    
                    // Get addresses
                    return this.app.model.serviceAddresses.getList(jobTitleID);
                }.bind(this))
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
            }
            else {
                this.viewModel.addresses([]);
                this.navBar.leftAction().text('Job Title');
            }
        }.bind(this)
    });
    
    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select or add a service location' : 'Locations');

            // Update navbar too
            // TODO: Can be other than 'scheduling', like marketplace profile or the job-title?
            this.navBar.leftAction().text(itIs ? 'Booking' : 'Scheduling');

            if (this.requestData.title) {
                // Replace title
                this.navBar.title(this.requestData.title);
                this.navBar.leftAction().text('');
            }
            else {
                // Title must be empty
                this.navBar.title('');
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
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);
    this.viewModel.isSelectionMode(false);

    if (options.selectAddress === true) {
        this.viewModel.isSelectionMode(true);
    }

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;

    this.viewModel.jobTitleID(jobTitleID);
    
    if (jobTitleID === 0) {
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {

    this.headerText = ko.observable('Locations');
    
    this.jobTitleID = ko.observable(0);
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceAddress');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        
        return false;
    }.bind(this);

    // List of addresses
    this.addresses = ko.observableArray([]);
    
    this.isSyncing = app.model.serviceAddresses.state.isSyncing();
    this.isLoading = ko.computed(function() {
        var add = app.model.serviceAddresses.state.isLoading(),
            jobs = this.jobTitles.isLoading();
        return add || jobs;
    }, this);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    this.selectAddress = function(selectedAddress) {
        
        if (this.isSelectionMode() === true) {
            this.isSelectionMode(false);
            // Run method injected by the activity to return a 
            // selected address:
            this.returnSelected(
                selectedAddress.addressID(),
                selectedAddress.jobTitleID()
            );
        }
        else {
            app.shell.go('addressEditor/service/' +
                this.jobTitleID() +
                '/' + selectedAddress.addressID()
            );
        }

    }.bind(this);
}
