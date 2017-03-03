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

    var restUrlPrefix = 'me/service-professional-services/';

    api.addLocalforageSupport('service-professional-services/');
    api.addRestSupport(appModel.rest, restUrlPrefix);
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    api.getClientSpecificServices = function(clientID) {
        return appModel.rest.get(restUrlPrefix + 'client/' + clientID);
    };

    api.getClientSpecificServicesForJobTitle = function(clientID, jobTitleID) {
        return api.getClientSpecificServices(clientID).then(function(services) {
            return services.filter(function(service) {
                return service.jobTitleID == jobTitleID;
            });
        });
    };
    
    return api;
};
