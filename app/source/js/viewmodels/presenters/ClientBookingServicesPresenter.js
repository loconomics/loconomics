/*
    Presenter object grouping services by client specificity and job title.

    Creates different groups for client-specific services and those that are not.

    Only creates groups for pricing types for which there are services in
    the collection.
*/
'use strict';

var ClientSpecificServicesGrouper = require('./ClientSpecificServicesGrouper');

var label = function(options) {
    var prefix = 'Select From ',
        pricingType = options.pricingType,
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        postFix = options.isClientSpecific ? ' Just For You' : '';

    return prefix + pricingTypeLabel + postFix;
};

var groupServices = function(services, pricingTypes) {
    var grouper = new ClientSpecificServicesGrouper({services: services, pricingTypes: pricingTypes});

    grouper.label = label;

    return grouper.groupServices();
};

module.exports = { groupServices: groupServices };
