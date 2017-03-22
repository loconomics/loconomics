/*
    Presenter object grouping services by client specificity and job title during services management
*/
'use strict';

var groupBy = require('../../utils/groupBy'),
    mapBy = require('../../utils/mapBy');

var ProviderManagingServicesPresenter = function(services, pricingType, clientName) {
    this.services = services;
    this.type = pricingType;
    this.group = this.groupLabel(pricingType, clientName);
};

ProviderManagingServicesPresenter.prototype.groupLabel = function(pricingType, clientName) {
    var clientPostfix = clientName.length > 0 ? (' for ' + clientName) : '',
        pricingTypeLabel = (pricingType && pricingType.pluralName() || 'Services');

    return pricingTypeLabel + clientPostfix;
};

ProviderManagingServicesPresenter.groupServices = function(list, pricingTypes, clientName) {
    var pricingTypesByID = mapBy(pricingTypes, function(type) { return type.pricingTypeID(); });

    var groups = [],
        groupsList = [];

    groups = groupBy(list, function(service) {
        return service.pricingTypeID();
    });

    // Convert the indexed object into an array with some meta-data
    groupsList = Object.keys(groups).map(function(key) {
        return new ProviderManagingServicesPresenter(groups[key], pricingTypesByID[key], clientName);
    });

    // Since the groupsList is built from the existent pricing items
    // if there are no records for some pricing type (or nothing when
    // just created the job title), that types/groups are not included,
    // so review and include now.
    // NOTE: as a good side effect of this approach, pricing types with
    // some pricing will appear first in the list (nearest to the top)
    pricingTypes.forEach(function (pricingType) {

        var typeID = pricingType.pricingTypeID();
        // Not if already in the list
        if (groups.hasOwnProperty(typeID))
            return;

        var presenter = new ProviderManagingServicesPresenter([], pricingType, clientName);

        groupsList.push(presenter);
    });

    return groupsList;
};

module.exports = ProviderManagingServicesPresenter;
