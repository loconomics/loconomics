/** Pricing Types
**/
'use strict';

var PricingType = require('../models/PricingType');

var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        // Types does not changes usually, so big ttl
        listTtl: { days: 1 },
        itemIdField: 'pricingTypeID',
        Model: PricingType
    });

    api.addLocalforageSupport('pricing-types');
    api.addRestSupport(appModel.rest, 'pricing-types');

    return api;
};
