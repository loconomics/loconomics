/**
 * Management of the user license certifications,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var LicenseCertification = require('../models/LicenseCertification');
var session = require('./session');
var GroupRemoteModel = require('./helpers/GroupRemoteModel');
var remote = require('./drivers/restClient');

var api = new GroupRemoteModel({
    // Types does not changes usually, so big ttl
    ttl: { month: 1 },
    itemIdField: 'licenseCertificationID',
    Model: LicenseCertification
});
module.exports = api;

api.addLocalforageSupport('license-certification/');
api.addRestSupport(remote, 'license-certification/');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
