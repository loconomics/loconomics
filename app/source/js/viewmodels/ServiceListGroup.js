/** @module viewmodels/ServiceListGroup */

'use strict';

var groupBy = require('../utils/groupBy'),
    mapBy = require('../utils/mapBy'),
    ServiceList = require('./ServiceList'),
    $ = require('jquery');

/**
 * Creates a new ServiceListGroup view model. Service list group creates lists
 * of services grouped by pricing type. By default, each list includes a button
 * to create a new service of that pricing type.
 * 
 * Default behavior can be changed by overriding the following functions:
 *   listTitle, newButtonLabel, newButtons
 *
 * The interface implented by this object:
 *   title property
 *   serviceLists function
 * 
 * @class
 * @param {Object} options
 * @param {string} options.title (optional) title of the group of lists
 * @param {Array} options.services (optional) array of services to group
 * @param {Array} options.pricingTypes all pricing types referenced by any services in option.services
 * @param {Array} options.defaultPricingTypes (optional) pricing types for which there should be a list regardless of whether there are services of that type in the services collection
 * @param {boolean} options.isClientSpecific true if services in this collection are specific to a client
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

/**
 * Creates lists of services grouped by pricing type
 * 
 * @public
 * @returns {Array} ServiceLists for each group
*/
ServiceListGroup.prototype.serviceLists = function() {
    var groups = groupBy(this.services, function(service) {
              return service.pricingTypeID();
         }, this.defaultGroups());

    return Object.keys(groups).map(function(pricingTypeID) {
        var pricingType = this.pricingTypesByID()[pricingTypeID],
            listTitle = this.listTitle({pricingType: pricingType});

        return new ServiceList({
                services: groups[pricingTypeID],
                title: listTitle,
                newButtons: this.newButtons({pricingType: pricingType})
            });
    }.bind(this));
};

/**
 * Called for each list created by serviceLists. Implement this function
 * in a sub-object to override the default behavior
 * 
 * @protected
 * @param {Object} options
 * @param {PricingType} options.pricingType for the list corresponding to this title
 * @returns the title for the list
*/
ServiceListGroup.prototype.listTitle = function(options) {
    return options.pricingType.pluralName() || 'Services';
};

/**
 * Called for each button for each list created by serviceLists. Implement this function
 * in a sub-object to override the default behavior
 * 
 * @protected
 * @param {Object} options
 * @param {PricingType} options.pricingType pricing type for the list
 * @returns {string} the label for each new button added to the list
*/
ServiceListGroup.prototype.newButtonLabel = function(options) {
    return options.pricingType.addNewLabel();
};

/**
 * Called for each list created by serviceLists. Implement this function
 * in a sub-object to override the default behavior
 * 
 * @protected
 * @param {Object} options
 * @param {PricingType} options.pricingType for the list
 * @returns {Array} ServiceList.NewButton for each new button in the list
 */
ServiceListGroup.prototype.newButtons = function(options) {
    var newButtonOptions = {
            label: this.newButtonLabel({pricingType: options.pricingType}),
            pricingTypeID: options.pricingType.pricingTypeID(),
            isClientSpecific: this.isClientSpecific
        };

    return [new ServiceList.NewButton(newButtonOptions)];
};

/**
 * @private
*/
ServiceListGroup.prototype.defaultGroups = function() {
    return this.defaultPricingTypes.map(function(type) { return type.pricingTypeID(); });
};

/**
 * @private
*/
ServiceListGroup.prototype.pricingTypesByID = function() {
    return mapBy(this.pricingTypes, function(type) { return type.pricingTypeID(); });
};

module.exports = ServiceListGroup;
