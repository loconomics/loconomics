/**
 * Access to list of addresses created on behalf of clients
 * by service professional,
 * local and remote.
 * Every list of addresses is accesed by client userID.
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
    groupIdField: 'userID',
    itemIdField: 'addressID',
    Model: Address
});

exports.addLocalforageSupport('addresses/clients/');
exports.addRestSupport(remote, 'me/addresses/clients/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
