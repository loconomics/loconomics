/**
 * Management of the weekly schedule user preferences,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var WeeklySchedule = require('../models/WeeklySchedule');
var RemoteModel = require('./helpers/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');
var calendar = require('./calendar');
var userJobProfile = require('./userJobProfile');

var api = new RemoteModel({
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
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

// A weekly schedule change may change the status of userJobTitles and bookMeButtonReady
const save = api.save;
api.save = (data) => save(data).then((result) => {
    userJobProfile.invalidateCache();
    return result;
});
