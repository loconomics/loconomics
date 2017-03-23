/*
    Presenter object grouping services by client specificity and job title
    during services management.

    Separates services by pricing type
*/
'use strict';

var groupBy = require('../../utils/groupBy'),
    mapBy = require('../../utils/mapBy'),
    GroupedServicesPresenter = require('./GroupedServicesPresenter');

var groupLabel = function(pricingType, clientName) {
    var clientPostfix = clientName.length > 0 ? (' for ' + clientName) : '',
        pricingTypeLabel = (pricingType && pricingType.pluralName() || 'Services');

    return pricingTypeLabel + clientPostfix;
};

var groupServices = function(list, pricingTypes, clientName, isClientSpecific) {
    var pricingTypesByID = mapBy(pricingTypes, function(type) { return type.pricingTypeID(); });

    var groups = groupBy(list, function(service) {
        return service.pricingTypeID();
    });

    // Convert the indexed object into an array with some meta-data
    var groupsList = Object.keys(groups).map(function(key) {
        var pricingType = pricingTypesByID[key],
            label = groupLabel(pricingType, clientName);

        return new GroupedServicesPresenter(groups[key], pricingType, label, isClientSpecific);
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

        var label = groupLabel(pricingType, clientName),
            presenter = new GroupedServicesPresenter([], pricingType, label, isClientSpecific);

        groupsList.push(presenter);
    });

    return groupsList;
};

module.exports = { groupServices: groupServices };
