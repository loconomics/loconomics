/**
 * Management of the calendar syncing user preferences,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var ko = require('knockout');
var CalendarSyncing = require('../models/CalendarSyncing');
var RemoteModel = require('./helpers/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: new CalendarSyncing(),
    ttl: { minutes: 1 },
    localStorageName: 'calendarSyncing',
    fetch: function fetch() {
        return remote.get('me/calendar-syncing');
    },
    push: function push() {
        return remote.put('me/calendar-syncing', this.data.model.toPlainObject());
    }
});
module.exports = api;

// Extending with the special API method 'resetExportUrl'
api.isReseting = ko.observable(false);
api.resetExportUrl = function resetExportUrl() {

    api.isReseting(true);

    return remote.post('me/calendar-syncing/reset-export-url')
    .then(function(updatedSyncSettings) {
        // Updating the cached data
        api.data.model.updateWith(updatedSyncSettings);
        api.isReseting(false);

        return updatedSyncSettings;
    });
};

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
