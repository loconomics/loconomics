/** Service LicensesCertifications

// TODO Initial work, complete and test
**/
'use strict';

var UserLicenseCertification = require('../models/UserLicenseCertification'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');

exports.create = function create(appModel) {

    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'licenseCertificationID',
        Model: UserLicenseCertification
    });
    
    api.addLocalforageSupport('userLicenseCertifications');
    api.addRestSupport(appModel.rest, 'me/user-license-certifications/');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    return api;
};
