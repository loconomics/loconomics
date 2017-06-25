/** Service professional service
**/
'use strict';

var ServiceProfessionalService = require('../models/ServiceProfessionalService'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('../data/session');

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

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    // Override GroupListRemoteModel's implementation until it
    // supports actual individual fetch. Bypasses local cache.
    api.getItem = function(jobTitleID, serviceID) {
        api.state.isLoading(true);

        // Returns plain data
        return appModel.rest.get(restUrlPrefix + jobTitleID + '/' + serviceID)
             .then(function(data) {
                  api.state.isLoading(false);
                  return data;
             })
             .catch(function(err) {
                  api.state.isLoading(false);
                  throw err;
             });
    };

    var baseSetItem = api.setItem.bind(api);

    // GroupListRemoteModel cache only works for one services API call: ...-services/{jobTitleID}
    // Updates to service objects may change which calls they are returned by. Rather
    // than implement fine-grained control on which cached items are adjusted on object
    // update, clear the cache whenever an item is updated.
    api.setItem = function(item) {
        return baseSetItem(item)
            .then(function(serverObject) {
                api.clearCache();
                return serverObject;
            });
    };

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

    api.getServicesBookableByProvider = function(clientID, jobTitleID) {
        return appModel.rest.get(restUrlPrefix + jobTitleID + '/client/' + clientID);
    };

    return api;
};
