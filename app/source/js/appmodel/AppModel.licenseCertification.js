/** License Certifications
**/
'use strict';

var LicenseCertification = require('../models/LicenseCertification');
var session = require('../data/session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {

    var api = new GroupRemoteModel({
        // Types does not changes usually, so big ttl
        ttl: { month: 1 },
        itemIdField: 'licenseCertificationID',
        Model: LicenseCertification
    });

    api.addLocalforageSupport('license-certification/');
    api.addRestSupport(appModel.rest, 'license-certification/');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
