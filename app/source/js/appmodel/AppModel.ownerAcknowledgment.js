/** OwnerAcknowledgment
**/
'use strict';

var OwnerAcknowledgment = require('../models/OwnerAcknowledgment');
var RemoteModel = require('../utils/RemoteModel');
var localforage = require('localforage');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new OwnerAcknowledgment(),
        ttl: { minutes: 1 },
        localStorageName: 'ownerAcknowledgment',
        fetch: function fetch() {
            return appModel.rest.get('me/owner-acknowledgment')
            .catch(function(err) {
                // Catch Not Found errors, since the first time does not exists
                // a record and is fine.
                if (err && err.status === 404) {
                    // Empty data
                    rem.data.model.reset();
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

    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });

    /**
     * @param {Object} data
     */
    rem.acknowledge = function acknowledge(data) {
        rem.isSaving(true);
        return appModel.rest.post('me/owner-acknowledgment', data)
        .then(function(serverData) {
            rem.data.model.updateWith(serverData, true);
            // If success, save persistent local copy of the data
            localforage.setItem(rem.localStorageName, serverData);
            rem.isSaving(false);
        })
        .catch(function(err) {
            rem.isSaving(false);
            throw err;
        });
    };

    return rem;
};
