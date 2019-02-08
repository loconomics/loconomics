/**
 * Management of the weekly schedule user preferences,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

import SingleEvent from '../utils/SingleEvent';
import { list as userListings } from './userListings';

var WeeklySchedule = require('../models/WeeklySchedule');
var RemoteModel = require('./helpers/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

/**
 * Notifies when a change was pushed successfully to the server
 * @private {SingleEvent}
 */
const onDataChanged = new SingleEvent();

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
            onDataChanged.emit();
            // Forward the result
            return result;
        });
    }
});

// A weekly schedule change may change the status of listings and bookMeButtonReady
const save = api.save.bind(api);
api.save = (data) => save(data).then((result) => {
    userListings.invalidateCache();
    return result;
});

api.onDataChanged = onDataChanged.subscriber;

export default api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
