/*
    Presenter object grouping services by client specificity and job title
    during services management.

    Separates services by pricing type and includes all pricing types even if
    there are no services for that type.
*/
'use strict';

var ServiceListGroup = require('../ServiceListGroup');

var label = function(options) {
    var clientPostfix = this.clientName.length > 0 ? (' for ' + this.clientName) : '',
        pricingType = options.pricingType,
        pricingTypeLabel = (pricingType && pricingType.pluralName() || 'Services');

    return pricingTypeLabel + clientPostfix;
};

var groupServices = function(services, pricingTypes, clientName, isClientSpecific) {
    var grouper = new ServiceListGroup({
            services: services,
            pricingTypes: pricingTypes,
            defaultPricingTypes: pricingTypes, // show a pricing type even if it has no services
            clientName: clientName,            // label relies on client name
            isClientSpecific: isClientSpecific,
            labelFunction: label
        });

    return grouper.serviceLists();
};

module.exports = { groupServices: groupServices };
