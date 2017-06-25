/**
 * Management of the basic user profile data,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var User = require('../models/User');
var RemoteModel = require('../utils/RemoteModel');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
    data: User.newAnonymous(),
    ttl: { minutes: 1 },
    localStorageName: 'profile',
    fetch: function fetch() {
        return remote.get('me/profile');
    },
    push: function push() {
        return remote.put('me/profile', this.data.model.toPlainObject());
    }
});

var session = require('./session');
session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

exports.saveOnboardingStep = function (stepReference) {
    if (typeof(stepReference) === 'undefined') {
        stepReference = exports.data.onboardingStep();
    }
    else {
        exports.data.onboardingStep(stepReference);
    }

    return remote.put('me/profile/tracking', {
        onboardingStep: stepReference
    })
    .then(function() {
        // If success, save persistent local copy of the data to ensure the
        // new onboardingStep is saved
        local.setItem(exports.localStorageName, exports.data.model.toPlainObject());
    });
};
