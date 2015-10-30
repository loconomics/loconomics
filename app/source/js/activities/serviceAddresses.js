/**
    Service Addresses activity
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    Activity = require('../components/Activity');

var A = Activity.extends(function ServiceAddressesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/scheduling'
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);

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
                    this.viewModel.serviceAddresses.sourceAddresses(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.serviceAddresses.sourceAddresses([]);
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

A.prototype.applyOwnNavbarRules = function() {
    //jshint maxcomplexity:10
    
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
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);

        var jid = this.viewModel.jobTitleID(),
            jname = this.viewModel.jobTitle() && this.viewModel.jobTitle().singularName() || 'Scheduling',
            url = this.mustReturnTo || (jid && '/jobtitles/' + jid || '/scheduling');

        this.navBar.leftAction().link(url);
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

A.prototype.updateNavBarState = function updateNavBarState() {
    //jshint maxcomplexity:12

    var itIs = this.viewModel.serviceAddresses.isSelectionMode();
    
    this.viewModel.headerText(itIs ? 'Select or add a service location' : 'Locations');

    // Perform updates that apply this request:
    this.app.model.onboarding.updateNavBar(this.navBar) ||
    //this.app.applyNavbarMustReturn(this.requestData) ||
    this.applyOwnNavbarRules();
};

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    // Remember route to go back, from a request of 'mustReturn' or last requested
    this.mustReturnTo = this.requestData.route.query.mustReturn || this.mustReturnTo;

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);
    this.viewModel.requestData = this.requestData;

    this.viewModel.serviceAddresses.isSelectionMode(options.selectAddress === true);
    this.viewModel.clientID(options.clientID || null);

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    
    // Check if it comes from an addressEditor that
    // received the flag 'returnNewAsSelected' and an
    // addressID: we were in selection mode->creating address->must
    // return the just created address to the previous page
    if (options.returnNewAsSelected === true &&
        options.addressID) {
        
        setTimeout(function() {
            delete options.returnNewAsSelected;
            this.viewModel.returnSelected(options.addressID, jobTitleID);
        }.bind(this), 1);
        // quick return
        return;
    }

    this.viewModel.jobTitleID(jobTitleID);

    this.updateNavBarState();
    
    if (jobTitleID === 0) {
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile'),
    ServiceAddresses = require('../viewmodels/ServiceAddresses');

function ViewModel(app) {
    
    this.serviceAddresses = new ServiceAddresses();

    this.headerText = ko.observable('Locations');
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    // Optionally, some times a clientID can be passed in order to create
    // a location for that client where perform a work.
    this.clientID = ko.observable(null);
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceAddress');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        
        return false;
    }.bind(this);

    this.isSyncing = app.model.serviceAddresses.state.isSyncing();
    this.isLoading = ko.computed(function() {
        var add = app.model.serviceAddresses.state.isLoading(),
            jobs = this.jobTitles.isLoading();
        return add || jobs;
    }, this);
    
    this.goNext = function() {
        if (app.model.onboarding.inProgress()) {
            app.model.onboarding.goNext();
        }
    };

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
            app.shell.go('addressEditor/service/' +
                this.jobTitleID() +
                '/' + selectedAddress.addressID()
            );
        }
        
        event.preventDefault();
        event.stopImmediatePropagation();

    }.bind(this);
    
    this.addServiceLocation = function() {
        var url = '#!addressEditor/service/' + this.jobTitleID() + '/serviceLocation';
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);
    
    this.addServiceArea = function() {
        var url = '#!addressEditor/service/' + this.jobTitleID() + '/serviceArea';
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);
    
    this.addClientLocation = function() {
        var url = '#!addressEditor/service/' + this.jobTitleID() + '/clientLocation/' + this.clientID();
        var request = $.extend({}, this.requestData, {
            returnNewAsSelected: this.serviceAddresses.isSelectionMode()
        });
        app.shell.go(url, request);
    }.bind(this);
    
    this.onboardingNextReady = ko.computed(function() {
        var isin = app.model.onboarding.inProgress(),
            hasItems = this.serviceAddresses.sourceAddresses().length > 0;

        return isin && hasItems;
    }, this);
}
