/**
 * Management of the user license certifications,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var LicenseCertification = require('../models/LicenseCertification');
var session = require('./session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new GroupRemoteModel({
    // Types does not changes usually, so big ttl
    ttl: { month: 1 },
    itemIdField: 'licenseCertificationID',
    Model: LicenseCertification
});

exports.addLocalforageSupport('license-certification/');
exports.addRestSupport(remote, 'license-certification/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
