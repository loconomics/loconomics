/**
    ServiceProfessionalServiceViewModel
**/
'use strict';

var ko = require('knockout'),
    _ = require('lodash'),
    $ = require('jquery');

function ServiceProfessionalServiceViewModel(app) {

    this.isLoading = ko.observable(false);
    this.list = ko.observableArray([]);
    this.jobTitleID = ko.observable(0);
    // 0 to load current user pricing and allow edit
    this.serviceProfessionalID = ko.observable(null);
    this.jobTitle = ko.observable(null);
    this.isAdditionMode = ko.observable(false);
    // Especial mode when instead of pick and edit we are just selecting
    this.isSelectionMode = ko.observable(false);
    // Currently selected pricing
    this.selectedServices = ko.observableArray([]);
    // Preset selection, from a previous state (loaded data) or incoming selection:
    this.preSelectedServices = ko.observableArray([]);
    // Add activity requestData to keep progress/navigation on links
    this.requestData = ko.observable();
    this.cancelLink = ko.observable(null);
    
    this.allowAddServices = ko.pureComputed(function() {
        return this.serviceProfessionalID() === null;
    }, this);
    
    // Grouped list of pricings:
    // Defined groups by pricing type
    this.groupedServices = ko.computed(function(){

        var list = this.list();
        var isSelection = this.isSelectionMode();
        var groupNamePrefix = isSelection ? 'Select ' : '';

        var groups = [],
            groupsList = [];
        if (!this.isAdditionMode()) {
            groups = _.groupBy(list, function(service) {
                return service.pricingTypeID();
            });

            // Convert the indexed object into an array with some meta-data
            groupsList = Object.keys(groups).map(function(key) {
                var gr = {
                    services: groups[key],
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
        }
        
        if (!this.isSelectionMode()) {
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
                        services: [],
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
        }

        return groupsList;

    }, this);

    /**
        Toggle the selection status of a single pricing, adding
        or removing it from the 'selectedServices' array.
    **/
    this.toggleServiceSelection = function(service) {

        var inIndex = -1,
            isSelected = this.selectedServices().some(function(selectedServices, index) {
            if (selectedServices === service) {
                inIndex = index;
                return true;
            }
        });

        service.isSelected(!isSelected);

        if (isSelected)
            this.selectedServices.splice(inIndex, 1);
        else
            this.selectedServices.push(service);
    }.bind(this);
    
    this.editService = function(service) {
        app.shell.go('serviceProfessionalServiceEditor/' + this.jobTitleID() + '/' + service.serviceProfessionalServiceID());
    }.bind(this);
    
    /**
        Handler for the listview items, managing edition and selection depending on current mode
    **/
    this.tapService = function(service, event) {
        if (this.isSelectionMode()) {
            this.toggleServiceSelection(service);
        }
        else {
            this.editService(service);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
    
    this.tapNewService = function(group, event) {
        
        var url = '#!serviceProfessionalServiceEditor/' + this.jobTitleID() + '/new/' + (group.type() && group.type().pricingTypeID());

        // Passing original data, for in-progress process (as new-booking)
        // and the selected title since the URL could not be updated properly
        // (see the anotated comment about replaceState bug on this file)
        var request = $.extend({}, this.requestData(), {
            selectedJobTitleID: this.jobTitleID()
        });
        if (!request.cancelLink) {
            $.extend(request, {
                cancelLink: this.cancelLink()
            });
        }
        
        // When in selection mode:
        // Add current selection as preselection, so can be recovered later and 
        // the editor can add the new pricing to the list
        if (this.isSelectionMode()) {
            request.selectedServices = this.selectedServices()
            .map(function(pricing) {
                return {
                    serviceProfessionalServiceID: ko.unwrap(pricing.serviceProfessionalServiceID),
                    totalPrice: ko.unwrap(pricing.totalPrice)
                };
            });
        }

        app.shell.go(url, request);

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
    
    var loadDataFor = function loadDataFor(serviceProfessionalID, jobTitleID) {
        if (jobTitleID) {
            this.isLoading(true);
            // Get data for the Job title ID and pricing types.
            // They are essential data
            Promise.all([
                app.model.jobTitles.getJobTitle(jobTitleID),
                app.model.pricingTypes.getList()
            ])
            .then(function(data) {
                var jobTitle = data[0];
                // Save for use in the view
                this.jobTitle(jobTitle);
                // Get services
                if (serviceProfessionalID)
                    return app.model.users.getServiceProfessionalServices(serviceProfessionalID, jobTitleID);
                else
                    return app.model.serviceProfessionalServices.getList(jobTitleID);
            }.bind(this))
            .then(function(list) {

                list = app.model.serviceProfessionalServices.asModel(list);

                // Read presets selection from requestData
                var preset = this.preSelectedServices(),
                    selection = this.selectedServices;

                // Add the isSelected property to each item
                list.forEach(function(item) {
                    var preSelected = preset.some(function(pr) {
                        if (pr.serviceProfessionalServiceID === item.serviceProfessionalServiceID())
                            return true;
                    }) || false;

                    item.isSelected = ko.observable(preSelected);

                    if (preSelected) {
                        selection.push(item);
                    }
                });
                this.list(list);
                
                this.isLoading(false);

            }.bind(this))
            .catch(function (err) {
                this.isLoading(false);
                app.modals.showError({
                    title: 'There was an error while loading.',
                    error: err
                });
            }.bind(this));
        }
        else {
            this.list([]);
            this.jobTitle(null);
        }
    }.bind(this);

    // AUTO LOAD on job title change
    ko.computed(function() {
        loadDataFor(this.serviceProfessionalID(), this.jobTitleID());
    }.bind(this)).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

module.exports = ServiceProfessionalServiceViewModel;
