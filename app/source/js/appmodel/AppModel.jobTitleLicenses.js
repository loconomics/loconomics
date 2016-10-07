/** job title licenses applicable to a given user
**/
'use strict';

var JobTitleLicense = require('../models/JobTitleLicense');

var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {
    var api = new GroupRemoteModel({
        ttl: { minutes: 1 },
        itemIdField: 'jobTitleID',
        Model: JobTitleLicense
    });
    
    api.addLocalforageSupport('job-title-licenses/');
    api.addRestSupport(appModel.rest, 'me/job-title-licenses/');    
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    return api;
};
