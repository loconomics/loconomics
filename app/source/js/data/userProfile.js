/**
 * Management of the basic user profile data,
 * local and remote.
 * @module data/userProfile
 */
'use strict';

var User = require('../models/User');
var RemoteModel = require('../utils/RemoteModel');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');

var rem = new RemoteModel({
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
session.events.on('clearLocalData', function() {
    rem.clearCache();
});

rem.saveOnboardingStep = function (stepReference) {
    if (typeof(stepReference) === 'undefined') {
        stepReference = rem.data.onboardingStep();
    }
    else {
        rem.data.onboardingStep(stepReference);
    }

    return remote.put('me/profile/tracking', {
        onboardingStep: stepReference
    })
    .then(function() {
        // If success, save persistent local copy of the data to ensure the
        // new onboardingStep is saved
        local.setItem(rem.localStorageName, rem.data.model.toPlainObject());
    });
};

module.exports = rem;
