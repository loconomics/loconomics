/*
    Presenter object grouping services by client specificity and job title
*/
'use strict';

var groupBy = require('lodash/groupBy');

var ClientBookingServicesPresenter = function(services, pricingType, isClientSpecific) {
    this.services = services;
    this.type = pricingType;
    this.group = this.groupLabel(isClientSpecific);
};

ClientBookingServicesPresenter.prototype.groupLabel = function(isClientSpecific) {
    var prefix = 'Select From ',
        pricingType = (this.type() && this.type().pluralName()) || 'Services',
        postFix = isClientSpecific ? ' Just For You' : '';

    return prefix + pricingType + postFix;
};

ClientBookingServicesPresenter.groupServices = function(services, pricingTypesByID) {
    var clientSpecificServices = services.filter(function(service) { return service.isClientSpecific(); }),
        publicServices = services.filter(function(service) { return !service.isClientSpecific(); });

    var groupByPricingType = function(services, isClientSpecific) {
        var groups = groupBy(services, function(service) {
            return service.pricingTypeID();
        });

        // Convert the indexed object into an array with some meta-data
        return Object.keys(groups).map(function(id) {
            return new ClientBookingServicesPresenter(groups[id], pricingTypesByID(id), isClientSpecific);
        });
    };

    return groupByPricingType(clientSpecificServices, true).concat(groupByPricingType(publicServices, false));
};

module.exports = ClientBookingServicesPresenter;
