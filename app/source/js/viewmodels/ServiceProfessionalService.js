/**
    ServiceProfessionalServiceViewModel
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery');

var EventEmitter = require('events').EventEmitter;
var jobTitles = require('../data/jobTitles');
var pricingTypes = require('../data/pricingTypes');
var serviceProfessionalServices = require('../data/serviceProfessionalServices');

function ServiceProfessionalServiceViewModel(app) {
    // jshint maxstatements:100
    EventEmitter.call(this);

    this.list = ko.observableArray([]);
    this.jobTitleID = ko.observable(0);
    // 0 to load current user pricing and allow edit
    this.serviceProfessionalID = ko.observable(null);
    this.jobTitle = ko.observable(null);
    this.pricingTypes = ko.observableArray([]);
    this.isAdditionMode = ko.observable(false);
    // Especial mode when instead of pick and edit we are just selecting
    this.isSelectionMode = ko.observable(false);
    // Currently selected pricing
    this.selectedServices = ko.observableArray([]);
    // Preset selection, from a previous state (loaded data) or incoming selection:
    this.preSelectedServices = ko.observableArray([]);

    this.isLoading = ko.observable(false);

    this.reset = function() {
        this.isLoading(false);
        this.list([]);
        this.jobTitleID(0);
        this.pricingTypes([]);
        this.serviceProfessionalID(null);
        this.jobTitle(null);
        this.isAdditionMode(false);
        this.isSelectionMode(false);
        this.selectedServices([]);
        this.preSelectedServices([]);
    };

    /**
      * Implementations of this view model should specify a factory function
      * for creating list groups from services depending on the desired behavior
      *
      * @see {@link viewmodels/ServiceListGroupFactories}
      * @function
      * @abstract
      * @returns an array of viewmodels/ServiceListGroup objects
      */
    this.serviceListGroupsFactory = function() {
        return [];
    };

    this.serviceListGroups = ko.computed(function() {
        return this.serviceListGroupsFactory(this.list(), this.pricingTypes());
    }, this);

    /**
     * Toggle the selection of a given service from the list of services.
     * It identifies automatically if was included in the list already,
     * removing or adding to reflect the change.
     * @param {Object} service The model object representing a service/offering
     * @private
     */
    var toggleAtSelectedServices = function(service) {
        var inIndex = -1;
        var wasSelected = this.selectedServices()
        .some(function(item, index) {
            if (item === service) {
                inIndex = index;
                return true;
            }
        });

        if (wasSelected)
            this.selectedServices.splice(inIndex, 1);
        else
            this.selectedServices.push(service);
    }.bind(this);

    /**
        Toggle the selection status of a single pricing, adding
        or removing it from the 'selectedServices' array.
    **/
    this.toggleServiceSelection = function(service) {
        // Toggle selection of the service
        service.isSelected(!service.isSelected());
        // And update list of selectedServices for this change
        toggleAtSelectedServices(service);
    }.bind(this);

    this.editServiceURL = function(jobTitleID, serviceID) {
        return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/' + serviceID;
    }.bind(this);

    // Override in implementing viewmodel
    this.editServiceRequest = function() {
        return {};
    }.bind(this);

    this.editService = function(service) {
        app.shell.go(this.editServiceURL(this.jobTitleID(), service.serviceProfessionalServiceID()),
                     this.editServiceRequest());
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

    /**
     * Handler for the 'change' event at a checkbox used in selection mode,
     * so rather than use tapService/toggleServiceSelection we invert the control,
     * detecting the value change for checked that auto updates service.isSelected
     * and we update the list of selectedServices based on that.
     */
    this.onCheckboxChange = function(service) {
        toggleAtSelectedServices(service);
    }.bind(this);

    this.newServiceURL = function(jobTitleID, pricingTypeID) {
        return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/pricingType/' + pricingTypeID + '/new';
    }.bind(this);

    // Override in implementing viewmodel
    this.newServiceRequest = function() {
        return {};
    }.bind(this);

    this.tapNewService = function(newButton, event) {
        var url = this.newServiceURL(this.jobTitleID(), newButton.pricingTypeID, newButton.isClientSpecific);

        // Passing original data, for in-progress process (as new-booking)
        // and the selected title since the URL could not be updated properly
        // (see the anotated comment about replaceState bug on this file)
        var request = $.extend({}, this.newServiceRequest(), {
            selectedJobTitleID: this.jobTitleID()
        });

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
        return jobTitles.getJobTitle(jobTitleID)
        .then(function(jobTitle) {
            this.jobTitle(jobTitle);

            var pricingTypeIDs = jobTitle.pricingTypes().map(function(type) { return type.pricingTypeID(); });

            return pricingTypes.getListByIDs(pricingTypeIDs);
        }.bind(this))
        .then(function(pricingTypes) {
            this.pricingTypes(pricingTypes);

            // Get services
            return servicesPromise;
        }.bind(this))
        .then(function(list) {

            list = serviceProfessionalServices.asModel(list);

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
