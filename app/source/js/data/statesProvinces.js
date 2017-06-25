/**
 * Access to the list of states/provinces,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var StateProvince = require('../models/StateProvince');
var session = require('./session');
var ListRemoteModel = require('../utils/ListRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new ListRemoteModel({
    // The data does not changes usually, so very big ttl
    listTtl: { years: 1 },
    itemIdField: 'code',
    Model: StateProvince
});

exports.addLocalforageSupport('states-provinces');
exports.addRestSupport(remote, 'states-provinces');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
