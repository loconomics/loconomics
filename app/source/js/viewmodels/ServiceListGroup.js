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
var ServicesListGroup = function(options) {
    var optionsDefaults = {
        title: '',
        services: [],
        pricingTypes: [],
        defaultPricingTypes: [],
        isClientSpecific: false,
        listTitleFunction: ServicesListGroup.prototype.listTitle,
        addNewLabelFunction: ServicesListGroup.prototype.addNewLabel,
        newButtonFunction: ServicesListGroup.prototype.newButtons
    };

    options = $.extend(optionsDefaults, options);

    this.title = options.title;
    this.services = options.services;
    this.pricingTypes = options.pricingTypes;
    this.defaultPricingTypes = options.defaultPricingTypes;
    this.isClientSpecific = options.isClientSpecific;
    this.listTitle = options.listTitleFunction;
    this.addNewLabel = options.addNewLabelFunction;
    this.newButtonFunction = options.newButtonFunction;
};

/*
    options:
      pricingType: the pricing type object for this group
*/
ServicesListGroup.prototype.listTitle = function(options) {
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

ServicesListGroup.prototype.newButtons = function(label, pricingTypeID) {
    var options = {
            label: label,
            pricingTypeID: pricingTypeID,
            isClientSpecific: this.isClientSpecific
        };

    return [new ServiceList.NewButton(options)];
};

/*
    Generate ServiceLists
*/
ServicesListGroup.prototype.serviceLists = function() {
    var groups = this.groupsByPricingType();

    return Object.keys(groups).map(function(pricingTypeID) {
        var pricingType = this.pricingTypesByID()[pricingTypeID],
            listTitle = this.listTitle({pricingType: pricingType}),
            addNewLabel = this.addNewLabel({pricingType: pricingType});

        return new ServiceList({
                services: groups[pricingTypeID],
                title: listTitle,
                newButtons: this.newButtonFunction(addNewLabel, pricingTypeID)
            });
    }.bind(this));
};

module.exports = ServicesListGroup;
