/*
    Common presenter for grouping services in a view model with a label.
*/
'use strict';

var GroupedServicesPresenter = function(options) {
    this.services = options.services;
    this.type = options.pricingType;
    this.label = options.label;
    this.isClientSpecific = options.isClientSpecific;
    this.addNewLabel = options.addNewLabel;
};

module.exports = GroupedServicesPresenter;
