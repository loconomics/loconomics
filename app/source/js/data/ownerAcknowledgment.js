/**
 * Management of the user acknowledgment of membership terms,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var OwnerAcknowledgment = require('../models/OwnerAcknowledgment');
var RemoteModel = require('../utils/RemoteModel');
var session = require('./session');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: new OwnerAcknowledgment(),
    ttl: { minutes: 1 },
    localStorageName: 'ownerAcknowledgment',
    fetch: function fetch() {
        return remote.get('me/owner-acknowledgment')
        .catch(function(err) {
            // Catch Not Found errors, since the first time does not exists
            // a record and is fine.
            if (err && err.status === 404) {
                // Empty data
                api.data.model.reset();
            }
            else {
                // Re-throw any other error
                throw err;
            }
        });
    },
    push: function push() {
        throw { name: 'Raw update of payment plan is not supported; use specialized methods' };
    }
});
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

/**
 * @param {Object} data
 */
api.acknowledge = function acknowledge(data) {
    api.isSaving(true);
    return remote.post('me/owner-acknowledgment', data)
    .then(function(serverData) {
        api.data.model.updateWith(serverData, true);
        // If success, save persistent local copy of the data
        local.setItem(api.localStorageName, serverData);
        api.isSaving(false);
    })
    .catch(function(err) {
        api.isSaving(false);
        throw err;
    });
};
