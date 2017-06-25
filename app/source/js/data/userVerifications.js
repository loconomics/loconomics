/**
 * Management of the user verifications,
 * local and remote.
 */
/*
    TODO Maybe the ListRemoteModel is not the most appropiated because it allows 1 ID
    while user-verifications have multi-ID fields and there is no an invidual access,
    but it's really a list not a flat RemoteModel.
    NOTE May require a query per job-title in future? Or just filtering the list?
*/
// TODO store-jsdocs
'use strict';

var UserVerification = require('../models/UserVerification');
var ListRemoteModel = require('../utils/ListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new ListRemoteModel({
    listTtl: { minutes: 10 },
    itemIdField: 'verificationID',
    Model: UserVerification
});

exports.addLocalforageSupport('user-verifications');
exports.addRestSupport(remote, 'me/verifications');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
