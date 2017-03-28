/*
    Groups services by pricing type and produces a ServiceList object
    for each group. 

    Override the listTitle function 
*/
'use strict';

var groupBy = require('../utils/groupBy'),
    mapBy = require('../utils/mapBy'),
    ServiceList = require('./ServiceList'),
    $ = require('jquery');

/*
    options:
      services: array services to group
      pricingTypes: array of pricing types the services can reference (services only have a pricing type ID)
      defaultPricingTypes: pricing types use to create groups *even if* there are no services of these pricing types
      isClientSpecific: are the services in this collection client-specific?
*/
var ServiceListGroup = function(options) {
    var optionsDefaults = {
        title: '',
        services: [],
        pricingTypes: [],
        defaultPricingTypes: [],
        isClientSpecific: false
    };

    options = $.extend(optionsDefaults, options);

    this.title = options.title;
    this.services = options.services;
    this.pricingTypes = options.pricingTypes;
    this.defaultPricingTypes = options.defaultPricingTypes;
    this.isClientSpecific = options.isClientSpecific;
};

/*
    options:
      pricingType: the pricing type object for this group
*/
ServiceListGroup.prototype.listTitle = function(options) {
    return options.pricingType.pluralName() || 'Services';
};

ServiceListGroup.prototype.newButtonLabel = function(options) {
    return options.pricingType.addNewLabel();
};

ServiceListGroup.prototype.defaultGroups = function() {
    return this.defaultPricingTypes.map(function(type) { return type.pricingTypeID(); });
};

ServiceListGroup.prototype.pricingTypesByID = function() {
    return mapBy(this.pricingTypes, function(type) { return type.pricingTypeID(); });
};

ServiceListGroup.prototype.groupingFunction = function(service) {
    return service.pricingTypeID();
};

ServiceListGroup.prototype.groupServices = function() {
    return groupBy(this.services, this.groupingFunction, this.defaultGroups());
};

ServiceListGroup.prototype.newButtons = function(options) {
    var newButtonOptions = {
            label: options.label,
            pricingTypeID: options.pricingTypeID,
            isClientSpecific: this.isClientSpecific
        };

    return [new ServiceList.NewButton(newButtonOptions)];
};

/*
    Generate ServiceLists
*/
ServiceListGroup.prototype.serviceLists = function() {
    var groups = this.groupServices();

    return Object.keys(groups).map(function(pricingTypeID) {
        var pricingType = this.pricingTypesByID()[pricingTypeID],
            listTitle = this.listTitle({pricingType: pricingType}),
            newButtonLabel = this.newButtonLabel({pricingType: pricingType});

        return new ServiceList({
                services: groups[pricingTypeID],
                title: listTitle,
                newButtons: this.newButtons({label: newButtonLabel, pricingTypeID: pricingTypeID})
            });
    }.bind(this));
};

module.exports = ServiceListGroup;
