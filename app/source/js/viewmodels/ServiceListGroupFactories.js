'use strict';

var ServiceCollection = require('../models/ServiceCollection'),
    ServiceListGroup = require('./ServiceListGroup'),
    ServiceList = require('./ServiceList'),
    $ = require('jquery');

var Factories = {};

var ClientBookedServicesListGroup = function(options) {
    ServiceListGroup.call(this, options);
};

ClientBookedServicesListGroup.prototype.listTitle = function(options) {
    var pricingTypeLabel = (options.pricingType && options.pricingType.pluralName()) || 'Services',
        postFix = this.isClientSpecific ? ' Just For You' : '';

    return 'Select From ' + pricingTypeLabel + postFix;
};

ClientBookedServicesListGroup.prototype.newButtons = function() {
    return [];  // no new buttons when client books services
};

ClientBookedServicesListGroup._inherits(ServiceListGroup);

Factories.clientBookedServices = function(services, pricingTypes) {
    var serviceCollection = new ServiceCollection(services),
        options = { pricingTypes: pricingTypes };

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

var ProviderBookedServicesListGroup = function(options) {
    ServiceListGroup.call(this, options);
};

ProviderBookedServicesListGroup.prototype.listTitle = function(options) {
    var pricingTypeLabel = (options.pricingType && options.pricingType.pluralName()) || 'Services';

    return 'Select From ' + pricingTypeLabel;
};

ProviderBookedServicesListGroup._inherits(ServiceListGroup);

var ProviderBookedClientServicesListGroup = function(options) {
    this.clientName = options.clientName;
    ServiceListGroup.call(this, options);
};

ProviderBookedClientServicesListGroup.prototype.listTitle = function(options) {
    var pricingTypeLabel = (options.pricingType && options.pricingType.pluralName()) || 'Services';

    return 'Select From ' + pricingTypeLabel + ' Just For ' + this.clientName;
};

ProviderBookedClientServicesListGroup.prototype.newButtonLabel = function(options) {
    return options.pricingType.addNewLabel() + ' just for ' + this.clientName;
};

ProviderBookedClientServicesListGroup.prototype.newButtons = function(options) {
    return this.pricingTypes.map(function(pricingType) {
        return new ServiceList.NewButton({
                label: options.label,
                pricingTypeID: pricingType.pricingTypeID(),
                isClientSpecific: this.isClientSpecific
            });
    });
};

ProviderBookedClientServicesListGroup._inherits(ServiceListGroup);

Factories.providerBookedServices = function(services, pricingTypes, clientName) {
    services = new ServiceCollection(services);

    var options = { pricingTypes: pricingTypes };

    var clientListGroup = new ProviderBookedClientServicesListGroup($.extend(options, {
            services: services.clientSpecificServices(),
            isClientSpecific: true,
            clientName: clientName
        }));

    var publicListGroup = new ProviderBookedServicesListGroup($.extend(options, {
            services: services.publicServices(),
            isClientSpecific: false,
            defaultPricingTypes: pricingTypes  // create a list for pricing type even if it has no services
        }));

    return [clientListGroup, publicListGroup];
};

var ProviderManagedServicesListGroup = function(options) {
    this.clientName = options.clientName;
    ServiceListGroup.call(this, options);
};

ProviderManagedServicesListGroup.prototype.listTitle = function(options) {
    var clientPostfix = this.clientName.length > 0 ? (' for ' + this.clientName) : '',
        pricingType = options.pricingType,
        pricingTypeLabel = (pricingType && pricingType.pluralName() || 'Services');

    return pricingTypeLabel + clientPostfix;
};

ProviderManagedServicesListGroup._inherits(ServiceListGroup);

Factories.providerManagedServices = function(services, pricingTypes, clientName, isClientSpecific) {
    var serviceListGroup = new ProviderManagedServicesListGroup({
            services: services,
            pricingTypes: pricingTypes,
            defaultPricingTypes: pricingTypes, // show a pricing type even if it has no services
            isClientSpecific: isClientSpecific
        });

    return [serviceListGroup];
};

module.exports = Factories;
