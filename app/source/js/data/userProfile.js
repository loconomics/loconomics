/**
 * Management of the basic user profile data,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var User = require('../models/User');
var RemoteModel = require('./helpers/RemoteModel');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: User.newAnonymous(),
    ttl: { minutes: 1 },
    localStorageName: 'profile',
    fetch: function fetch() {
        return remote.get('me/profile');
    },
    push: function push(data) {
        return remote.put('me/profile', data || this.data.model.toPlainObject());
    }
});
module.exports = api;

var session = require('./session');
session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

api.saveOnboardingStep = function (stepReference) {
    if (typeof(stepReference) === 'undefined') {
        stepReference = api.data.onboardingStep();
    }
    else {
        api.data.onboardingStep(stepReference);
    }

    return remote.put('me/profile/tracking', {
        onboardingStep: stepReference
    })
    .then(function() {
        // If success, save persistent local copy of the data to ensure the
        // new onboardingStep is saved
        local.setItem(api.localStorageName, api.data.model.toPlainObject());
    });
};

/**
 * Request to become the current user profile to a service professional.
 * If the request is successful, the local profile data is updated properly
 */
api.becomeServiceProfessional = function() {
    return remote.post('me/profile/become-service-professional')
    .then(function() {
        api.data.isServiceProfessional(true);
        // If success, save persistent local copy of the data to ensure the
        // profile change is saved
        local.setItem(api.localStorageName, api.data.model.toPlainObject());
    });
};
