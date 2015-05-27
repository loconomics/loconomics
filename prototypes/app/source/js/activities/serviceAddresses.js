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
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/scheduling'
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();

    // On changing jobTitleID:
    // - load addresses
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Save for use in the view
                    this.viewModel.jobTitle(jobTitle);
                    // Update navbar (may indicate the jobTitle name)
                    this.updateNavBarState();
                    
                    // Get addresses
                    return this.app.model.serviceAddresses.getList(jobTitleID);
                }.bind(this))
                .then(function(list) {

                    list = this.app.model.serviceAddresses.asModel(list);
                    this.viewModel.sourceAddresses(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.sourceAddresses([]);
                this.viewModel.jobTitle(null);
                this.updateNavBarState();
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
    
    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    //jshint maxcomplexity:10

    var itIs = this.viewModel.isSelectionMode();
    
    this.viewModel.headerText(itIs ? 'Select or add a service location' : 'Locations');

    if (this.requestData.title) {
        // Replace title by title if required
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
    }

    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction);
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);
        
        var jid = this.viewModel.jobTitleID(),
            jname = this.viewModel.jobTitle() && this.viewModel.jobTitle().singularName() || 'Scheduling';
        
        this.navBar.leftAction().link(jid ? '/jobtitles/' + jid : '/scheduling');
        this.navBar.leftAction().text(jname);
    }
    
    if (itIs && !this.requestData.cancelLink) {
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
    else if (!this.requestData.cancelLink) {
        this.navBar.leftAction().handler(null);
    }
};

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);

    this.viewModel.isSelectionMode(options.selectAddress === true);

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;

    this.viewModel.jobTitleID(jobTitleID);
    
    this.updateNavBarState();
    
    if (jobTitleID === 0) {
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {

    this.headerText = ko.observable('Locations');
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceAddress');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        
        return false;
    }.bind(this);

    // List of addresses
    this.sourceAddresses = ko.observableArray([]);
    this.addresses = ko.computed(function() {
        var list = this.sourceAddresses();
        if (this.isSelectionMode()) {
            // Filter by service addresses (excluding service area)
            list = list.filter(function(add) {
                return add.isServiceLocation();
            });
        }
        return list;
    }, this);
    
    this.isSyncing = app.model.serviceAddresses.state.isSyncing();
    this.isLoading = ko.computed(function() {
        var add = app.model.serviceAddresses.state.isLoading(),
            jobs = this.jobTitles.isLoading();
        return add || jobs;
    }, this);

    this.selectAddress = function(selectedAddress, event) {
        
        if (this.isSelectionMode() === true) {
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
        
        event.preventDefault();
        event.stopImmediatePropagation();

    }.bind(this);
}
