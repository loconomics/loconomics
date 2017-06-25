/**
 * Management of the user licenses by job title,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var JobTitleLicense = require('../models/JobTitleLicense');
var session = require('./session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new GroupRemoteModel({
    ttl: { minutes: 1 },
    itemIdField: 'jobTitleID',
    Model: JobTitleLicense
});

exports.addLocalforageSupport('job-title-licenses/');
exports.addRestSupport(remote, 'me/job-title-licenses/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
