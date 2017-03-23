/*
    Presenter object grouping services by client specificity and job title during booking.

    Will include groups for all pricing types provided, even if there aren't any services
    for that type in the collection of services provided.
*/
'use strict';

var groupBy = require('../../utils/groupBy'),
    mapBy = require('../../utils/mapBy'),
    GroupedServicesPresenter = require('./GroupedServicesPresenter');

var groupLabel = function(pricingType, clientName) {
    var prefix = 'Select From ',
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        clientLabel = clientName.length > 0 ? (' Just For ' + clientName) : '';

    return prefix + pricingTypeLabel + clientLabel;
};

var groupServices = function(services, pricingTypes, clientName) {
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
            var pricingType = pricingTypesByID[id],
                label = groupLabel(pricingType, isClientSpecific ? clientName :  '');

            return new GroupedServicesPresenter(groups[id], pricingType, label, isClientSpecific);
        });
    };

    return groupByPricingType(clientSpecificServices, true).concat(groupByPricingType(publicServices, false));
};

module.exports = { groupServices: groupServices };
