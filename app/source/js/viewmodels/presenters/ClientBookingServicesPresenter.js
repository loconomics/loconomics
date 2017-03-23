/*
    Presenter object grouping services by client specificity and job title.

    Creates different groups for client-specific services and those that are not.

    Only creates groups for pricing types for which there are services in
    the collection.
*/
'use strict';

var groupBy = require('lodash/groupBy'),
    mapBy = require('../../utils/mapBy'),
    GroupedServicesPresenter = require('./GroupedServicesPresenter');

var groupLabel = function(pricingType, isClientSpecific) {
    var prefix = 'Select From ',
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        postFix = isClientSpecific ? ' Just For You' : '';

    return prefix + pricingTypeLabel + postFix;
};

var groupServices = function(services, pricingTypes) {
    var clientSpecificServices = services.filter(function(service) { return service.isClientSpecific(); }),
        publicServices = services.filter(function(service) { return !service.isClientSpecific(); }),
        pricingTypesByID = mapBy(pricingTypes, function(type) { return type.pricingTypeID(); });

    var groupByPricingType = function(services, isClientSpecific) {
        var groups = groupBy(services, function(service) {
            return service.pricingTypeID();
        });

        // Convert the indexed object into an array with some meta-data
        return Object.keys(groups).map(function(id) {
            var pricingType = pricingTypesByID[id],
                label = groupLabel(pricingType, isClientSpecific);

            return new GroupedServicesPresenter(groups[id], pricingType, label, isClientSpecific);
        });
    };

    return groupByPricingType(clientSpecificServices, true).concat(groupByPricingType(publicServices, false));
};

module.exports = { groupServices: groupServices };
