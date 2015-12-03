/**
**/
'use strict';

var WeeklySchedule = require('../models/WeeklySchedule'),
    RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new WeeklySchedule(),
        ttl: { minutes: 1 },
        localStorageName: 'weeklySchedule',
        fetch: function fetch() {
            return appModel.rest.get('me/weekly-schedule');
        },
        push: function push() {
            return appModel.rest.put('me/weekly-schedule', this.data.model.toPlainObject(true))
            .then(function(result) {
                // We need to recompute availability as side effect of schedule
                appModel.calendar.clearCache();
                // Forward the result
                return result;
            });
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};
