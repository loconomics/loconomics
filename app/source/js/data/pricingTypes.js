/**
 * Access to the list of pricing types available,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PricingType = require('../models/PricingType');
var session = require('./session');
var ListRemoteModel = require('../utils/ListRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new ListRemoteModel({
    // Types does not changes usually, so big ttl
    listTtl: { days: 1 },
    itemIdField: 'pricingTypeID',
    Model: PricingType
});

exports.addLocalforageSupport('pricing-types');
exports.addRestSupport(remote, 'pricing-types');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

exports.getListByIDs = function(pricingTypeIDs) {
    return exports.getList()
    .then(function(pricingTypes) {
        return pricingTypes().filter(function(pricingType) {
            return pricingTypeIDs.indexOf(pricingType.pricingTypeID()) > -1;
        });
    });
};
