/**
 * Management of the calendar syncing user preferences,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var ko = require('knockout');
var CalendarSyncing = require('../models/CalendarSyncing');
var RemoteModel = require('../utils/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
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

// Extending with the special API method 'resetExportUrl'
exports.isReseting = ko.observable(false);
exports.resetExportUrl = function resetExportUrl() {

    exports.isReseting(true);

    return remote.post('me/calendar-syncing/reset-export-url')
    .then(function(updatedSyncSettings) {
        // Updating the cached data
        exports.data.model.updateWith(updatedSyncSettings);
        exports.isReseting(false);

        return updatedSyncSettings;
    });
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
