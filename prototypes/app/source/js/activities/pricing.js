/**
    Pricing activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout'),
    _ = require('lodash');
    
var A = Activity.extends(function PricingActivity() {

    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.Frelancer;
    
    // On show, will be updated with the JobTitle name
    this.navBar = Activity.createSubsectionNavBar('Job title');

    this.viewModel = new ViewModel();
    
    // Handler to go back with the selected service when 
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
    
    var params = options && options.route && options.route.segments || [];
    
    // Get jobTitleID
    var jobTitleID = params[0] |0;

    if (jobTitleID) {
        // Get data for the Job title ID
        this.app.model.userJobProfile.getUserJobTitleAndJobTitle(jobTitleID)
        .then(function(info) {
            
            // info: { jobTitleID, jobTitle, userJobTitle }
            var jobTitle = info.jobTitle;
            
            // Fill in job title name
            this.navBar.leftAction().text(jobTitle.singularName());
            
            // TODO Load job title pricing on this activity:
            //this.viewModel.services(userJobtitle.services());
            console.log('Job Title Pricing/Services load not supported still');
        }.bind(this))
        .catch(function(err) {
            this.app.modals.showError({
                error: err
            });
        }.bind(this));
    }

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

/*function Selectable(obj) {
    obj.isSelected = ko.observable(false);
    return obj;
}*/

function ViewModel() {

    // Full list of services
    this.pricing = ko.observableArray([]);
    this.isLoading = ko.observable(false);
    this.isLocked = this.isLoading;

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);
    
    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSelectionMode() ? 
                    'Save and continue' :
                    'Save'
        );
    }, this);

    // Grouped list of pricings:
    // Defined groups: regular services and add-ons
    this.groupedPricing = ko.computed(function(){

        var pricing = this.pricing();
        var isSelection = this.isSelectionMode();
        var groupNamePrefix = isSelection ? 'Select ' : '';

        var groups = _.groupBy(pricing, function(pricingItem) {
            return pricingItem.pricingTypeID();
        });
        
        // Convert the indexed object into an array with some meta-data
        var groupsList = Object.keys(groups).map(function(key) {
            return {
                // TODO: Get group name from the PricingType.pluralName
                group: groupNamePrefix + key,
                pricing: groupsList[key]
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
