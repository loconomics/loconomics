/**
    ServiceProfessionalServiceViewModel
**/
'use strict';

var ko = require('knockout'),
    groupBy = require('lodash/groupBy'),
    $ = require('jquery');

var EventEmitter = require('events').EventEmitter;

function ServiceProfessionalServiceViewModel(app) {
    // jshint maxstatements:100
    EventEmitter.call(this);

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
    // Set to true if groupedServices should include pricing types that do not have any pricing instances
    this.loadEmptyPricingTypes = ko.observable(false);

    this.isLoading = ko.observable(false);


    this.reset = function() {
        this.isLoading(false);
        this.list([]);
        this.jobTitleID(0);
        this.serviceProfessionalID(null);
        this.jobTitle(null);
        this.isAdditionMode(false);
        this.isSelectionMode(false);
        this.selectedServices([]);
        this.preSelectedServices([]);
        this.requestData();
        this.cancelLink(null);
    };
    
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
            groups = groupBy(list, function(service) {
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
        
        if (this.loadEmptyPricingTypes()) {
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

    this.editServiceURL = function(jobTitleID, serviceID) {
        return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/' + serviceID;
    }.bind(this);

    this.editService = function(service) {
        app.shell.go(this.editServiceURL(this.jobTitleID(), service.serviceProfessionalServiceID()));
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

    this.newServiceURL = function(jobTitleID, pricingTypeID) {
        return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/pricing_type/' + pricingTypeID + '/new';
    }.bind(this);

    this.tapNewService = function(group, event) {
        var url = this.newServiceURL(this.jobTitleID(), group.type() && group.type().pricingTypeID());

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
            request.selectedServices = this.selectedServices().map(this.selectedServiceRequest);
        }

        app.shell.go(url, request);

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);

    this.selectedServiceRequest = function(pricing) {
        return {
            serviceProfessionalServiceID: ko.unwrap(pricing.serviceProfessionalServiceID),
            totalPrice: ko.unwrap(pricing.totalPrice)
        };
    };

    /*
        loadData

        public interface for loading service professional services and supporting data for the view

        serviceProfessionalID: (optional), can be null. When used for
                               client view, include serviceProfessionalID of services provider
        jobTitleID: ID of the job title
        servicesPromise: the promise object for loading service professional services.
                         Should yield list of raw objects, not models.
    */
    this.loadData = function(serviceProfessionalID, jobTitleID, servicesPromise) {
        this.serviceProfessionalID(serviceProfessionalID);
        this.jobTitleID(jobTitleID);

        this.isLoading(true);
        // Get data for the Job title ID and pricing types.
        // They are essential data
        return Promise.all([
            app.model.jobTitles.getJobTitle(jobTitleID),
            app.model.pricingTypes.getList()
        ])
        .then(function(data) {
            var jobTitle = data[0];
            // Save for use in the view
            this.jobTitle(jobTitle);
            // Get services
            return servicesPromise;
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

            this.emit('loaded');

        }.bind(this))
        .catch(function (err) {
            this.isLoading(false);
            app.modals.showError({
                title: 'There was an error while loading.',
                error: err
            });
        }.bind(this));
     }.bind(this);

    this.clearData = function() {
        this.serviceProfessionalID(null);
        this.list([]);
        this.jobTitle(null);
    }.bind(this);
}

ServiceProfessionalServiceViewModel._inherits(EventEmitter);

module.exports = ServiceProfessionalServiceViewModel;
