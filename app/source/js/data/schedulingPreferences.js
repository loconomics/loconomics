/**
 * Management of the user schedulingPreferences,
 * local and remote
 */
// TODO store-jsdocs
'use strict';

var SchedulingPreferences = require('../models/SchedulingPreferences');
var session = require('./session');
var RemoteModel = require('./helpers/RemoteModel');
var remote = require('./drivers/restClient');
var calendar = require('./calendar');

var api = new RemoteModel({
    data: new SchedulingPreferences(),
    ttl: { minutes: 1 },
    localStorageName: 'schedulingPreferences',
    fetch: function fetch() {
        return remote.get('me/scheduling-preferences');
    },
    push: function push() {
        return remote.put('me/scheduling-preferences', this.data.model.toPlainObject())
        .then(function(result) {
            // We need to recompute availability as side effect of scheduling preferences changes
            calendar.clearCache();
            // Forward the result
            return result;
        });
    }
});
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
