/** States Provinces
**/
'use strict';

var LicenseCertification = require('../models/LicenseCertification');

var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        // Types does not changes usually, so very big ttl
        listTtl: { years: 1 },
        itemIdField: 'licenseCertificationID',
        Model: LicenseCertification
    });

    api.addLocalforageSupport('license-certification');
    api.addRestSupport(appModel.rest, 'license-certification');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};
