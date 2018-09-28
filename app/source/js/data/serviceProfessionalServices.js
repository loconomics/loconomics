/**
 * Management of the user services offered as a service professional,
 * grouped by the job titles of its listing,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

import { list as userListings } from './userListings';

var ServiceProfessionalService = require('../models/ServiceProfessionalService');
var GroupListRemoteModel = require('./helpers/GroupListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'jobTitleID',
    itemIdField: 'serviceProfessionalServiceID',
    Model: ServiceProfessionalService
});
module.exports = api;

var restUrlPrefix = 'me/service-professional-services/';

api.addLocalforageSupport('service-professional-services/');
api.addRestSupport(remote, restUrlPrefix);

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

// A change on services may change the status of listings and bookMeButtonReady
// since there is an alert for services
api.onChangedData.subscribe(() => {
    userListings.invalidateCache();
});

// Override GroupListRemoteModel's implementation until it
// supports actual individual fetch. Bypasses local cache.
api.getItem = function(jobTitleID, serviceID) {
    api.state.isLoading(true);

    // Returns plain data
    return remote.get(restUrlPrefix + jobTitleID + '/' + serviceID)
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
    return remote.get(restUrlPrefix + 'client/' + clientID);
};

api.getClientSpecificServicesForJobTitle = function(clientID, jobTitleID) {
    return api.getClientSpecificServices(clientID).then(function(services) {
        return services.filter(function(service) {
            return service.jobTitleID == jobTitleID;
        });
    });
};

api.getServicesBookableByProvider = function(clientID, jobTitleID) {
    return remote.get(restUrlPrefix + jobTitleID + '/client/' + clientID);
};
