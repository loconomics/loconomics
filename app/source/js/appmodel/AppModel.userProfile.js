/** UserProfile
**/
'use strict';

var User = require('../models/User');

var RemoteModel = require('../utils/RemoteModel'),
    localforage = require('localforage');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: User.newAnonymous(),
        ttl: { minutes: 1 },
        // IMPORTANT: Keep the name in sync with set-up at AppModel-account
        localStorageName: 'profile',
        fetch: function fetch() {
            return appModel.rest.get('profile');
        },
        push: function push() {
            return appModel.rest.put('profile', this.data.model.toPlainObject());
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    rem.saveOnboardingStep = function saveOnboardingStep(stepReference) {
        if (typeof(stepReference) === 'undefined') {
            stepReference = rem.data.onboardingStep();
        }
        else {
            rem.data.onboardingStep(stepReference);
        }

        return appModel.rest.put('profile/tracking', {
            onboardingStep: stepReference
        })
        .then(function() {
            // If success, save persistent local copy of the data to ensure the
            // new onboardingStep is saved
            localforage.setItem(rem.localStorageName, rem.data.model.toPlainObject());
        });
    };
    
    return rem;
};
