/*
    Common presenter for grouping services in a view model with a label.
*/
'use strict';

var GroupedServicesPresenter = function(services, pricingType, label, isClientSpecific) {
    this.services = services;
    this.type = pricingType;
    this.label = label;
    this.isClientSpecific = isClientSpecific;
};

module.exports = GroupedServicesPresenter;
