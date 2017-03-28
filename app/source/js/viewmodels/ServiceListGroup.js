/*
    Groups services by pricing type and produces a ServiceList object
    for each group. 

    Override the label function 
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
      clientName: name of the client
      defaultPricingTypes: pricing types use to create groups *even if* there are no services of these pricing types
      isClientSpecific: are the services in this collection client-specific?
*/
var ServicesListGroup = function(options) {
    var optionsDefaults = {
        title: '',
        services: [],
        pricingTypes: [],
        clientName: '',
        defaultPricingTypes: [],
        isClientSpecific: false,
        labelFunction: ServicesListGroup.prototype.label,
        addNewLabelFunction: ServicesListGroup.prototype.addNewLabel
    };

    options = $.extend(optionsDefaults, options);

    this.title = options.title;
    this.services = options.services;
    this.pricingTypes = options.pricingTypes;
    this.clientName = options.clientName;
    this.defaultPricingTypes = options.defaultPricingTypes;
    this.isClientSpecific = options.isClientSpecific;
    this.label = options.labelFunction;
    this.addNewLabel = options.addNewLabelFunction;
};

/*
    options:
      pricingType: the pricing type object for this group
*/
ServicesListGroup.prototype.label = function(options) {
    return options.pricingType.pluralName() || 'Services';
};

ServicesListGroup.prototype.addNewLabel = function(options) {
    return options.pricingType.addNewLabel();
};

ServicesListGroup.prototype.defaultPricingTypeIDs = function() {
    return this.defaultPricingTypes.map(function(type) { return type.pricingTypeID(); });
};

ServicesListGroup.prototype.pricingTypesByID = function() {
    return mapBy(this.pricingTypes, function(type) { return type.pricingTypeID(); });
};

ServicesListGroup.prototype.groupsByPricingType = function() {
    return groupBy(this.services, function(service) {
        return service.pricingTypeID();
    }, this.defaultPricingTypeIDs());
};

/*
    Generate ServiceLists
*/
ServicesListGroup.prototype.serviceLists = function() {
    var groups = this.groupsByPricingType();

    return Object.keys(groups).map(function(id) {
        var pricingType = this.pricingTypesByID()[id],
            label = this.label({pricingType: pricingType}),
            addNewLabel = this.addNewLabel({pricingType: pricingType});

        return new ServiceList({
                services: groups[id],
                pricingType: pricingType,
                label: label,
                isClientSpecific: this.isClientSpecific,
                addNewLabel: addNewLabel
            });
    }.bind(this));
};

module.exports = ServicesListGroup;
