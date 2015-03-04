/**
**/
'use strict';

var SchedulingPreferences = require('../models/SchedulingPreferences');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new SchedulingPreferences(),
        ttl: { seconds: 5 },
        fetch: function fetch() {
            return appModel.getSchedulingPreferences();
        },
        push: function push() {
            return appModel.setSchedulingPreferences(this.data.model.toPlainObject());
        }
    });
};
