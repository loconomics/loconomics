/*
    Common presenter for grouping services in a view model with a label.
*/
'use strict';

var ServiceList = function(options) {
    this.services = options.services;
    this.title = options.title;
    this.newButtons = options.newButtons || [];
};

ServiceList.NewButton = function(options) {
    this.label = options.label;
    this.pricingTypeID = options.pricingTypeID;
    this.isClientSpecific = options.isClientSpecific;
};

module.exports = ServiceList;
