/**
 * Management of the user services offered as a service professional,
 * grouped by the job titles of its listing,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var ServiceProfessionalService = require('../models/ServiceProfessionalService');
var GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'jobTitleID',
    itemIdField: 'serviceProfessionalServiceID',
    Model: ServiceProfessionalService
});

var restUrlPrefix = 'me/service-professional-services/';

exports.addLocalforageSupport('service-professional-services/');
exports.addRestSupport(remote, restUrlPrefix);

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

// Override GroupListRemoteModel's implementation until it
// supports actual individual fetch. Bypasses local cache.
exports.getItem = function(jobTitleID, serviceID) {
    exports.state.isLoading(true);

    // Returns plain data
    return remote.get(restUrlPrefix + jobTitleID + '/' + serviceID)
            .then(function(data) {
                exports.state.isLoading(false);
                return data;
            })
            .catch(function(err) {
                exports.state.isLoading(false);
                throw err;
            });
};

var baseSetItem = exports.setItem.bind(exports);

// GroupListRemoteModel cache only works for one services API call: ...-services/{jobTitleID}
// Updates to service objects may change which calls they are returned by. Rather
// than implement fine-grained control on which cached items are adjusted on object
// update, clear the cache whenever an item is updated.
exports.setItem = function(item) {
    return baseSetItem(item)
        .then(function(serverObject) {
            exports.clearCache();
            return serverObject;
        });
};

exports.getClientSpecificServices = function(clientID) {
    return remote.get(restUrlPrefix + 'client/' + clientID);
};

exports.getClientSpecificServicesForJobTitle = function(clientID, jobTitleID) {
    return exports.getClientSpecificServices(clientID).then(function(services) {
        return services.filter(function(service) {
            return service.jobTitleID == jobTitleID;
        });
    });
};

exports.getServicesBookableByProvider = function(clientID, jobTitleID) {
    return remote.get(restUrlPrefix + jobTitleID + '/client/' + clientID);
};
