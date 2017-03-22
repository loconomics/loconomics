/*
    Presenter object grouping services by client specificity and job title during booking
*/
'use strict';

var groupBy = require('../../utils/groupBy'),
    mapBy = require('../../utils/mapBy');

var ProviderBookingServicesPresenter = function(services, pricingType, clientName) {
    this.services = services;
    this.type = pricingType;
    this.group = this.groupLabel(pricingType, clientName);
};

ProviderBookingServicesPresenter.prototype.groupLabel = function(pricingType, clientName) {
    var prefix = 'Select From ',
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        clientLabel = clientName.length > 0 ? (' Just For ' + clientName) : '';

    return prefix + pricingTypeLabel + clientLabel;
};

ProviderBookingServicesPresenter.groupServices = function(services, pricingTypes, clientName) {
    var clientSpecificServices = services.filter(function(service) { return service.isClientSpecific(); }),
        publicServices = services.filter(function(service) { return !service.isClientSpecific(); }),
        allPricingTypeIDs = pricingTypes.map(function(type) { return type.pricingTypeID(); }),
        pricingTypesByID = mapBy(pricingTypes, function(type) { return type.pricingTypeID(); });

    var groupByPricingType = function(services, isClientSpecific) {
        var groups = groupBy(services, function(service) {
            return service.pricingTypeID();
        }, allPricingTypeIDs);

        // Convert the indexed object into an array with some meta-data
        return Object.keys(groups).map(function(id) {
            return new ProviderBookingServicesPresenter(groups[id], pricingTypesByID[id], isClientSpecific ? clientName : '');
        });
    };

    return groupByPricingType(clientSpecificServices, true).concat(groupByPricingType(publicServices, false));
};

module.exports = ProviderBookingServicesPresenter;
