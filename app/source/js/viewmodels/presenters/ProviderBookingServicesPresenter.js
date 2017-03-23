/*
    Presenter object grouping services by client specificity and job title during booking.

    Will include groups for all pricing types provided, even if there aren't any services
    for that type in the collection of services provided.
*/
'use strict';

var ClientSpecificServicesGrouper = require('./ClientSpecificServicesGrouper');

var label = function(options) {
    var prefix = 'Select From ',
        pricingType = options.pricingType,
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        clientLabel = options.isClientSpecific ? (' Just For ' + this.clientName) : '';

    return prefix + pricingTypeLabel + clientLabel;
};

var groupServices = function(services, pricingTypes, clientName) {
    var grouper = new ClientSpecificServicesGrouper({
            services: services,
            pricingTypes: pricingTypes,
            defaultPricingTypes: pricingTypes, // show a pricing type even if it has no services
            clientName: clientName             // label relies on client name
        });

    grouper.label = label;

    return grouper.groupServices();
};

module.exports = { groupServices: groupServices };
