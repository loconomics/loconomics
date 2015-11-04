/** Logged user service attributes
**/
'use strict';

var UserJobTitleServiceAttributes = require('../models/UserJobTitleServiceAttributes');

var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {
    var api = new GroupRemoteModel({
        ttl: { minutes: 1 },
        itemIdField: 'jobTitleID',
        Model: UserJobTitleServiceAttributes
    });
    
    api.addLocalforageSupport('service-attributes/');
    api.addRestSupport(appModel.rest, 'me/service-attributes/');    
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    // Additional API calls to fetch related data
    var JobTitleServiceAttributes = require('../models/JobTitleServiceAttributes');
    /**
        Get the public information about available service attributes for a job title
    **/
    api.getJobTitleServiceAttributes = function getJobTitleServiceAttributes(jobTitleID) {
        return appModel.rest.get('job-title-service-attributes/' + (jobTitleID |0))
        .then(function(values) {
            return new JobTitleServiceAttributes(values);
        });
    };
    
    return api;
};
