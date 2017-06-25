/**
 * Management of the user service addresses (part of public listing),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var Address = require('../models/Address');
var GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'jobTitleID',
    itemIdField: 'addressID',
    Model: Address
});

exports.addLocalforageSupport('addresses/service/');
exports.addRestSupport(remote, 'me/addresses/service/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
