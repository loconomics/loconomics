/**
 * Management of the weekly schedule user preferences,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var WeeklySchedule = require('../models/WeeklySchedule');
var RemoteModel = require('../utils/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');
var calendar = require('./calendar');

module.exports = new RemoteModel({
    data: new WeeklySchedule(),
    ttl: { minutes: 1 },
    localStorageName: 'weeklySchedule',
    fetch: function fetch() {
        return remote.get('me/weekly-schedule');
    },
    push: function push() {
        return remote.put('me/weekly-schedule', this.data.model.toPlainObject(true))
        .then(function(result) {
            // We need to recompute availability as side effect of schedule
            calendar.clearCache();
            // Forward the result
            return result;
        });
    }
});

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
