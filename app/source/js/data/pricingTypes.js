/**
 * Access to the list of pricing types available,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PricingType = require('../models/PricingType');
var session = require('./session');
var ListRemoteModel = require('./helpers/ListRemoteModel');
var remote = require('./drivers/restClient');

var api = new ListRemoteModel({
    // Types does not changes usually, so big ttl
    listTtl: { days: 1 },
    itemIdField: 'pricingTypeID',
    Model: PricingType
});
module.exports = api;

api.addLocalforageSupport('pricing-types');
api.addRestSupport(remote, 'pricing-types');

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
