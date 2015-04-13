/** Service Addresses
**/
'use strict';

var Address = require('../models/Address'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');

exports.create = function create(appModel) {

    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'addressID',
        Model: Address
    });
    
    api.addLocalforageSupport('addresses/service/');
    api.addRestSupport(appModel.rest, 'addresses/service/');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    return api;
};
