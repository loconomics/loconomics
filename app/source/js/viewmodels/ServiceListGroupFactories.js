/** @module viewmodels/ServiceListGroupFactories
 *
 *  Exports factory functions to create ServiceListGroup objects. Each factory
 *  function handles a different scenario for grouping lists of services.
 * 
 *  Each factory uses an object that inherits from viewmodels/ServiceListGroup.
 *  These objects override the default behavior of ServiceListGroup to
 *  implement the particular details of each use case.
 *
 */

'use strict';

var ServiceCollection = require('../models/ServiceCollection');
var ServiceListGroup = require('./ServiceListGroup');
var ServiceList = require('./ServiceList');
var $ = require('jquery');

/**
 * @exports viewmodels/ServiceListGroupFactories
 */
var Factories = {};

/**
 * Implements ServiceListGroup for client booking services.
 * 
 * @class
 * @private
 */
var ClientBookedServicesListGroup = function(options) {
    ServiceListGroup.call(this, options);
};

ClientBookedServicesListGroup._inherits(ServiceListGroup);

/**
 * @override
 */
ClientBookedServicesListGroup.prototype.listTitle = function(options) {
    var pricingTypeLabel = (options.pricingType && options.pricingType.pluralName()) || 'Services';
    var postFix = this.isClientSpecific ? ' Just For You' : '';

    return pricingTypeLabel + postFix;
};

/**
 * @override
 */
ClientBookedServicesListGroup.prototype.newButtons = function() {
    return [];  // no new buttons when client books services
};

/**
 * Factory creating array of services list group objects for client booking services.
 *
 * @param {Array} services client-specific and public services bookable by the client
 * @param {Array} pricingTypes PricingType objects referenced by any service in services
 * @returns {Array} service list groups
 */
Factories.clientBookedServices = function(services, pricingTypes) {
    var serviceCollection = new ServiceCollection(services);
    var options = { pricingTypes: pricingTypes };

    var clientListGroup = new ClientBookedServicesListGroup($.extend(options, {
            services: serviceCollection.clientSpecificServices(),
            isClientSpecific: true
        }));

    var publicListGroup = new ClientBookedServicesListGroup($.extend(options, {
            services: serviceCollection.publicServices(),
            isClientSpecific: false
        }));

    return [clientListGroup, publicListGroup];
};

/**
 * Implements ServiceListGroup for provider booking services.
 * 
 * @class
 * @private
 */
var ProviderBookedServicesListGroup = function(options) {
    ServiceListGroup.call(this, options);
};

ProviderBookedServicesListGroup._inherits(ServiceListGroup);

/**
 * @override
 */
ProviderBookedServicesListGroup.prototype.listTitle = function(options) {
    var pricingTypeLabel = (options.pricingType && options.pricingType.pluralName()) || 'Services';

    return pricingTypeLabel;
};

/**
 * Implements ServiceListGroup interface for client-specific services bookable
 * by a provider. This deviates from the other factory classes because it does
 * not inherit from ServiceListGroup. The behavior of this object is substantially
 * different from that object.
 * 
 * @implements {viewmodels/ServiceListGroup}
 *
 * @class
 * @private
 */
var ProviderBookedClientServicesListGroup = function(options) {
    this.clientName = options.clientName;
    this.pricingTypes = options.pricingTypes;
    this.services = options.services;

    this.title = 'Offerings only available to ' + options.clientName;
};

ProviderBookedClientServicesListGroup.prototype.newButtons = function() {
    var clientName = this.clientName;

    return this.pricingTypes.map(function(pricingType) {
        return new ServiceList.NewButton({
                label: pricingType.addNewLabel() + ' just for ' + clientName,
                pricingTypeID: pricingType.pricingTypeID(),
                isClientSpecific: true
            });
    });
};

ProviderBookedClientServicesListGroup.prototype.serviceLists = function() {
    var serviceList = new ServiceList({
            services: this.services,
            title: '',
            newButtons: this.newButtons()
        });

    return [serviceList];
};

/**
 * Factory creating array of services list group objects for provider booking services.
 *
 * @param {Array} services client-specific and public services bookable by the provider
 * @param {Array} pricingTypes PricingType objects referenced by any service in services
 * @param {string} clientName
 * @returns {Array} service list groups
 */
Factories.providerBookedServices = function(services, pricingTypes, clientName) {
    services = new ServiceCollection(services);

    var options = { pricingTypes: pricingTypes };

    var clientListGroup = new ProviderBookedClientServicesListGroup($.extend(options, {
            services: services.clientSpecificServices(),
            clientName: clientName
        }));

    var publicListGroup = new ProviderBookedServicesListGroup($.extend(options, {
            services: services.publicServices(),
            isClientSpecific: false,
            defaultPricingTypes: pricingTypes,  // create a list for pricing type even if it has no services
            title: 'Offerings Available to Everyone'
        }));

    return [clientListGroup, publicListGroup];
};

/**
 * Implements ServiceListGroup for provider managing services
 * 
 * @class
 * @private
 */
var ProviderManagedServicesListGroup = function(options) {
    this.clientName = options.clientName;
    ServiceListGroup.call(this, options);
};

ProviderManagedServicesListGroup._inherits(ServiceListGroup);

/**
 * @override
 */
ProviderManagedServicesListGroup.prototype.listTitle = function(options) {
    var clientPostfix = this.clientName.length > 0 ? (' for ' + this.clientName) : '';
    var pricingType = options.pricingType;
    var pricingTypeLabel = (pricingType && pricingType.pluralName() || 'Services');

    return pricingTypeLabel + clientPostfix;
};

/**
 * Factory creating array of services list group objects for provider managing services.
 *
 * @param {Array} services client-specific and public services bookable by the provider
 * @param {Array} pricingTypes PricingType objects referenced by any service in services
 * @param {string} clientName
 * @param {boolean} isClientSpecific true if services are client-specific, false otherwise
 * @returns {Array} service list groups
 */
Factories.providerManagedServices = function(services, pricingTypes, clientName, isClientSpecific) {
    var serviceListGroup = new ProviderManagedServicesListGroup({
            services: services,
            clientName: clientName,
            pricingTypes: pricingTypes,
            defaultPricingTypes: pricingTypes, // show a pricing type even if it has no services
            isClientSpecific: isClientSpecific
        });

    return [serviceListGroup];
};

module.exports = Factories;
