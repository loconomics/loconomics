/** @module viewmodels/ServiceList */
'use strict';

/**
 * Creates a list of services with a title and buttons for creating new services.
 * @class
 *
 * @params {Object} options
 * @params {Array} options.services (models/ServiceProfessionalService) list of services to be represented by buttons
 * @params {string} options.title title for the list
 * @params {Array} options.newButtons (optional) ServiceList.NewButton objects for each new service button to display in the list
 */
var ServiceList = function(options) {
    this.services = options.services;
    this.title = options.title;
    this.newButtons = options.newButtons || [];
};

/**
 * New button objects for a service list
 * @class
 *
 */
ServiceList.NewButton = function(options) {
    this.label = options.label;
    this.pricingTypeID = options.pricingTypeID;
    this.isClientSpecific = options.isClientSpecific;
};

module.exports = ServiceList;
