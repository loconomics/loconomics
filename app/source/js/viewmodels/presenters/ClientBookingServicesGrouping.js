/*
    Presenter object grouping services by client specificity and job title.

    Creates different groups for client-specific services and those that are not.
*/
'use strict';

var ClientSpecificServicesGrouper = require('./ClientSpecificServicesGrouper');

var listTitle = function(options) {
    var prefix = 'Select From ',
        pricingType = options.pricingType,
        pricingTypeLabel = (pricingType && pricingType.pluralName()) || 'Services',
        postFix = this.isClientSpecific ? ' Just For You' : '';

    return prefix + pricingTypeLabel + postFix;
};

var groupServices = function(services, pricingTypes) {
    var grouper = new ClientSpecificServicesGrouper({
            services: services,
            pricingTypes: pricingTypes,
            listTitleFunction: listTitle
        });

    return grouper.groupServices();
};

module.exports = { groupServices: groupServices };
