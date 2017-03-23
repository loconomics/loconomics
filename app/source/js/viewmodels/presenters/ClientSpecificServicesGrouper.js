/*
    Groups services by client-specificity

    Override the label function 
*/
'use strict';

var groupBy = require('../../utils/groupBy'),
    mapBy = require('../../utils/mapBy'),
    GroupedServicesPresenter = require('./GroupedServicesPresenter');

/*
    options:
      services: array services to group
      pricingTypes: array of pricing types the services can reference (services only have a pricing type ID)
      clientName: name of the client
      defaultPricingTypes: pricing types use to create groups *even if* there are no services of these pricing types
*/
var Grouper = function(options) {
    this.services = options.services || [];
    this.pricingTypes = options.pricingTypes || [];
    this.clientName = options.clientName || '';
    this.defaultPricingTypes = options.defaultPricingTypes || [];
};

/*
    options:
      pricingType: the pricing type object for this group
      isClientSpecific: whether this group represents client-specific pricing
*/
Grouper.prototype.label = function(options) {
    var pricingType = options.pricingType;

    return (pricingType && pricingType.pluralName()) || 'Services';
};

Grouper.prototype.clientSpecificServices = function() {
    return this.services.filter(function(service) { return service.isClientSpecific(); });
};

Grouper.prototype.publicServices = function() {
    return this.services.filter(function(service) { return !service.isClientSpecific(); });
};

Grouper.prototype.defaultPricingTypeIDs = function() {
    return this.defaultPricingTypes.map(function(type) { return type.pricingTypeID(); });
};

Grouper.prototype.pricingTypesByID = function() {
    return mapBy(this.pricingTypes, function(type) { return type.pricingTypeID(); });
};

Grouper.prototype.groupByPricingType = function(services) {
    return groupBy(services, function(service) {
        return service.pricingTypeID();
    }, this.defaultPricingTypeIDs());
};

Grouper.prototype.groupsToPresenters = function(groups, isClientSpecific) {
    return Object.keys(groups).map(function(id) {
        var pricingType = this.pricingTypesByID()[id],
            label = this.label({pricingType: pricingType, isClientSpecific: isClientSpecific});

        return new GroupedServicesPresenter(groups[id], pricingType, label, isClientSpecific);
    }.bind(this));
};

/*
    Generate GroupedServicesPresenters for client-specific and public services
*/
Grouper.prototype.groupServices = function() {
    var clientSpecificGroups = this.groupByPricingType(this.clientSpecificServices(), true),
        publicGroups = this.groupByPricingType(this.publicServices(), false);

    // Convert the indexed object into an array with some meta-data
    var clientSpecificPresenters = this.groupsToPresenters(clientSpecificGroups, true),
        publicPresenters = this.groupsToPresenters(publicGroups, false);

    return clientSpecificPresenters.concat(publicPresenters);
};

module.exports = Grouper;
