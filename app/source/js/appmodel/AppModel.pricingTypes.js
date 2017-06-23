/** Pricing Types
**/
'use strict';

var PricingType = require('../models/PricingType');
var session = require('../data/session');
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

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    api.getListByIDs = function(pricingTypeIDs) {
        return api.getList()
            .then(function(pricingTypes) {
                return pricingTypes().filter(function(pricingType) {
                    return pricingTypeIDs.indexOf(pricingType.pricingTypeID()) > -1;
                });
             });
    };

    return api;
};
