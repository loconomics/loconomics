/** User Verifications

    TODO Maybe the ListRemoteModel is not the most appropiated because it allows 1 ID
    while user-verifications have multi-ID fields and there is no an invidual access,
    but it's really a list not a flat RemoteModel.
    NOTE May require a query per job-title in future? Or just filtering the list?
**/
'use strict';

var UserVerification = require('../models/UserVerification'),
    ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {

    var api = new ListRemoteModel({
        listTtl: { minutes: 10 },
        itemIdField: 'verificationID',
        Model: UserVerification
    });

    api.addLocalforageSupport('user-verifications');
    api.addRestSupport(appModel.rest, 'me/verifications');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};
