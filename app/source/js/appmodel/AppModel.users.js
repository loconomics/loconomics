/**
    Query data from other users in the marketplace,
    usually client fetching service professionals data
    to view profile, book them, etc.
**/
'use strict';

exports.create = function create(appModel) {
    
    var api = {};

    //appModel.on('clearLocalData', function() {
    //    api.clearCache();
    //});
    
    api.getServiceProfessionalServices = function(serviceProfessionalUserID, jobTitleID) {
        return appModel.rest.get('users/' + serviceProfessionalUserID + '/service-professional-services/' + jobTitleID);
    };

    return api;
};