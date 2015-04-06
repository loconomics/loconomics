/**
    Freelancer Pricing activity
**/
'use strict';

var ko = require('knockout'),
    _ = require('lodash'),
    Activity = require('../components/Activity'),
    PricingType = require('../models/PricingType');

var A = Activity.extends(function FreelancerPricingActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Job Title');

    // On changing jobTitleID:
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Fill in job title name
                    this.navBar.leftAction().text(jobTitle.singularName());

                    // Get pricing
                    return this.app.model.freelancerPricing.getList(jobTitleID);
                }.bind(this))
                .then(function(list) {

                    list = this.app.model.freelancerPricing.asModel(list);
                    this.viewModel.list(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.list([]);
                this.navBar.leftAction().text('Job Title');
            }
        }.bind(this)
    });
    
    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select services' : 'Services');

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
    
    // Handler to go back with the selected services when 
    // selection mode goes off and requestData is for
    // 'select mode'
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            // We have a request and
            // it requested to select a service
            // and selection mode goes off
            if (this.requestData &&
                this.requestData.selectPricing === true &&
                itIs === false) {

                // Pass the selected client in the info
                this.requestData.selectedPricing = this.viewModel.selectedPricing();
                // And go back
                this.app.shell.goBack(this.requestData);
                // Last, clear requestData
                this.requestData = {};
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);
    this.viewModel.selectedPricing.removeAll();
    
    if (options.selectAddress === true) {
        this.viewModel.isSelectionMode(true);
        // preset:
        this.viewModel.selectedAddress(options.selectedAddress);
    }
    
    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    
    this.viewModel.jobTitleID(jobTitleID);
    
    if (this.requestData.selectPricing === true) {
        this.viewModel.isSelectionMode(true);
        
        /* Trials to presets the selected services, NOT WORKING
        var services = (options.selectedServices || []);
        var selectedServices = this.viewModel.selectedServices;
        selectedServices.removeAll();
        this.viewModel.services().forEach(function(service) {
            services.forEach(function(selService) {
                if (selService === service) {
                    service.isSelected(true);
                    selectedServices.push(service);
                } else {
                    service.isSelected(false);
                }
            });
        });
        */
    }
};

function ViewModel(app) {

    this.headerText = ko.observable('Services');
    
    this.jobTitleID = ko.observable(0);

    this.list = ko.observableArray([]);

    this.isLoading = app.model.freelancerPricing.state.isLoading;
    this.isLocked = this.isLoading;

    // Especial mode when instead of pick and edit we are just selecting
    this.isSelectionMode = ko.observable(false);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSelectionMode() ? 
                    'Save and continue' :
                    ''
        );
    }, this);
    
    // Grouped list of pricings:
    // Defined groups by pricing type
    this.groupedPricing = ko.computed(function(){

        var list = this.list();
        var isSelection = this.isSelectionMode();
        var groupNamePrefix = isSelection ? 'Select ' : '';

        var groups = _.groupBy(list, function(pricingItem) {
            return pricingItem.pricingTypeID();
        });
        
        // Convert the indexed object into an array with some meta-data
        var groupsList = Object.keys(groups).map(function(key) {
            return {
                // TODO: Get group name from the PricingType.pluralName
                group: groupNamePrefix + key,
                pricing: groupsList[key],
                // TODO Load the pricing information
                type: new PricingType()
            };
        });

        return groupsList;

    }, this);

    this.selectedPricing = ko.observableArray([]);
    /**
        Toggle the selection status of a pricing, adding
        or removing it from the 'selectedPricing' array.
    **/
    this.togglePricingSelection = function(pricing) {

        var inIndex = -1,
            isSelected = this.selectedPricing().some(function(selectedPricing, index) {
            if (selectedPricing === pricing) {
                inIndex = index;
                return true;
            }
        });

        pricing.isSelected(!isSelected);

        if (isSelected)
            this.selectedPricing.splice(inIndex, 1);
        else
            this.selectedPricing.push(pricing);

    }.bind(this);
    
    /**
        Ends the selection process, ready to collect selection
        and passing it to the requester activity
    **/
    this.endSelection = function() {
        
        this.isSelectionMode(false);
        
    }.bind(this);
}
