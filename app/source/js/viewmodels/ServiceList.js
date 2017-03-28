/*
    Common presenter for grouping services in a view model with a label.
*/
'use strict';

var ServiceList = function(options) {
    this.services = options.services;
    this.label = options.label;

    this.newButtons = [];
    this.newButtons.push({
        label: options.addNewLabel,
        pricingTypeID: options.pricingType.pricingTypeID(),
        isClientSpecific: options.isClientSpecific
    });
};

module.exports = ServiceList;
