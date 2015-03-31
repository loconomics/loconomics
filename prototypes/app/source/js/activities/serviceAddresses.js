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
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // Getting elements
    this.$listView = this.$activity.find('#addressesListView');

    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select or add a service location' : 'Locations');

            // Update navbar too
            // TODO: Can be other than 'scheduling', like marketplace profile or the job-title?
            this.navBar.leftAction().text(itIs ? 'Booking' : 'Scheduling');
            // Title must be empty
            this.navBar.title('');

            // TODO Replaced by a progress bar on booking creation
            // TODO Or leftAction().text(..) on booking edition (return to booking)
            // or coming from Jobtitle/schedule (return to schedule/job title)?

        }.bind(this)
    });
    
    // Handler to go back with the selected location when 
    // selection mode goes off and requestInfo is for
    // 'select mode'
    // TODO: requestInfo->requestData, mix this with the previous handler for the same target.
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            // We have a request and
            // it requested to select a location
            // and selection mode goes off
            if (this.requestInfo &&
                this.requestInfo.selectAddress === true &&
                itIs === false) {

                // Pass the selected client in the info
                this.requestInfo.selectedAddress = this.viewModel.selectedAddress();
                // And go back
                this.app.shell.goBack(this.requestInfo);
                // Last, clear requestInfo
                this.requestInfo = null;
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    if (options.selectAddress === true) {
        this.viewModel.isSelectionMode(true);
        // preset:
        this.viewModel.selectedAddress(options.selectedAddress);
    }
    
    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    
    this.viewModel.jobTitleID(jobTitleID);

    // Updating list, for the jobTitle
    if (jobTitleID) {
        this.app.model.serviceAddresses.getList(jobTitleID)
        .then(function(list) {

            list = this.app.model.serviceAddresses.asModel(list);
            this.viewModel.addresses(list);

        }.bind(this));
    }
    else {
        this.viewModel.addresses([]);
    }
    
    /* TODO REVIEW, but redirection are not wanted anymore
    else if (options.route && options.route.segments) {
        var id = params[1] |0;
        if (id) {
            if (id === 'new') {
                this.app.shell.go('locationEdition', {
                    create: options.route.segments[1] // 'serviceRadius', 'serviceAddress'
                });
            }
            else {
                this.app.shell.go('locationEdition', {
                    locationID: id
                });
            }
        }
    }*/
};

function ViewModel(app) {

    this.headerText = ko.observable('Locations');
    
    this.jobTitleID = ko.observable(0);

    // List of addresses
    this.addresses = ko.observableArray([]);
    
    this.isLoading = app.model.serviceAddresses.state.isLoading;

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    this.selectedAddress = ko.observable(null);
    
    this.selectAddress = function(selectedAddress) {
        
        if (this.isSelectionMode() === true) {
            this.selectedAddress(selectedAddress);
            this.isSelectionMode(false);
        }
        else {
            app.shell.go('addressEditor/service/' +
                this.jobTitleID() +
                '/' + selectedAddress.addressID()
            );
        }

    }.bind(this);
}
