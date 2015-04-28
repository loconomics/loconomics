/**
    Freelancer Pricing activity
**/
'use strict';

var ko = require('knockout'),
    _ = require('lodash'),
    Activity = require('../components/Activity');

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
                // Get data for the Job title ID and pricing types.
                // They are essential data
                Promise.all([
                    this.app.model.jobTitles.getJobTitle(jobTitleID),
                    this.app.model.pricingTypes.getList()
                ])
                .then(function(data) {
                    var jobTitle = data[0];
                    // Fill in job title name
                    this.navBar.leftAction().text(jobTitle.singularName());
                    // Save for use in the view
                    this.viewModel.jobTitle(jobTitle);

                    // Get pricing
                    return this.app.model.freelancerPricing.getList(jobTitleID);
                }.bind(this))
                .then(function(list) {

                    list = this.app.model.freelancerPricing.asModel(list);
                    // Add the isSelected property to each item
                    list.forEach(function(item) {
                        item.isSelected = ko.observable(false);
                    });
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
                this.viewModel.jobTitle(null);
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

            if (this.requestData.progressStep) {
                // Replace title by process step if required
                this.navBar.title(this.requestData.progressStep);
                this.navBar.leftAction().text('');
            }
            else {
                // Title must be empty
                this.navBar.title('');
            }            
        }.bind(this)
    });

    // Go back with the selected pricing when triggered in the form/view
    this.viewModel.returnSelected = function(pricing, jobTitleID) {
        // Pass the selected client in the info
        this.requestData.selectedPricing = pricing;
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
    this.viewModel.selectedPricing.removeAll();

    // Params
    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    
    this.viewModel.jobTitleID(jobTitleID);
    
    if (jobTitleID === 0) {
        this.viewModel.jobTitles.sync();
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

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {

    this.headerText = ko.observable('Services');
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/freelancerPricing');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        
        return false;
    }.bind(this);

    this.list = ko.observableArray([]);

    this.isLoading = ko.computed(function() {
        return (
            app.model.freelancerPricing.state.isLoading() ||
            app.model.pricingTypes.state.isLoading() ||
            app.model.jobTitles.state.isLoading()
        );
    });
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
            var gr = {
                pricing: groups[key],
                // Load the pricing information
                type: app.model.pricingTypes.getObservableItem(key)
            };
            gr.group = ko.computed(function() {
                return groupNamePrefix + (
                    this.type() && this.type().pluralName() ||
                    'Services'
                );
            }, gr);
            return gr;
        });
        
        // Since the groupsList is built from the existent pricing items
        // if there are no records for some pricing type (or nothing when
        // just created the job title), that types/groups are not included,
        // so review and include now.
        // NOTE: as a good side effect of this approach, pricing types with
        // some pricing will appear first in the list (nearest to the top)
        var pricingTypes = this.jobTitle() && this.jobTitle().pricingTypes();
        if (pricingTypes && pricingTypes.length) {
            pricingTypes.forEach(function (jobType) {
                
                var typeID = jobType.pricingTypeID();
                // Not if already in the list
                if (groups.hasOwnProperty(typeID))
                    return;

                var gr = {
                    pricing: [],
                    type: app.model.pricingTypes.getObservableItem(typeID)
                };
                gr.group = ko.computed(function() {
                    return groupNamePrefix + (
                        this.type() && this.type().pluralName() ||
                        'Services'
                    );
                }, gr);

                groupsList.push(gr);
            });
        }

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
        // Run method injected by the activity to return a 
        // selected address:
        this.returnSelected(
            this.selectedPricing().map(function(pricing) {
                return {
                    freelancerPricingID: ko.unwrap(pricing.freelancerPricingID),
                    totalPrice: ko.unwrap(pricing.price)
                };
            }),
            this.jobTitleID()
        );
    }.bind(this);
    
    this.editPricing = function(pricing) {
        app.shell.go('freelancerPricingEditor/' + this.jobTitleID() + '/' + pricing.freelancerPricingID());
    }.bind(this);
    
    /**
        Handler for the listview items, managing edition and selection depending on current mode
    **/
    this.tapPricing = function(pricing) {
        if (this.isSelectionMode()) {
            this.togglePricingSelection(pricing);
        }
        else {
            this.editPricing(pricing);
        }
    }.bind(this);
}
