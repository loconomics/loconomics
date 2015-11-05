/** Service professional service
**/
'use strict';

var ServiceProfessionalService = require('../models/ServiceProfessionalService'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');

exports.create = function create(appModel) {

    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'serviceProfessionalServiceID',
        Model: ServiceProfessionalService
    });

    api.addLocalforageSupport('service-professional-services/');
    api.addRestSupport(appModel.rest, 'me/service-professional-services/');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    return api;
};
