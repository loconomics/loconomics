/**
 * Manages the user session in the app,
 * includes the profile basic data (name,...),
 * restoring a session from saved credentials,
 * set-up of a new session and
 * closing a session performing clean up tasks
 * @module data/session
 */
'use strict';

var ko = require('knockout');
var local = require('./drivers/localforage');
var credentialsStore = require('./credentials');
var SingleEvent = require('../utils/SingleEvent');

/**
 * Tracks internally if a session is opened (through open/restore),
 * @private {boolean}
 */
var isSessionOpened = false;

/**
 * Event triggered by a session just being opened.
 * @private {SingleEvent}
 */
var openedEvent = new SingleEvent(exports);
/**
 * Event triggered by a session just being restored.
 * @private {SingleEvent}
 */
var restoredEvent = new SingleEvent(exports);
/**
 * Event triggered by a session just closed
 */
var closedEvent = new SingleEvent(exports);

exports.on = {
    opened: openedEvent.subscriber,
    restored: restoredEvent.subscriber,
    closed: closedEvent.subscriber
};

// TODO: Refactor to make 'session' independent of 'userProfile' module.
// Explanation: The userProfile and session modules are very tight right
// now because of the `user` property:
// - is an alias (rather than it's
// own instance and default -see commit ecd33a765-, ideally
// kept updated from userProfile 'data-change' events)
// - at the `restore` method, userProfile is call to ask
// for data from local and request remote update
// This forces us to include userProfile and linked utilites
// like RemoteModel even on bundles like the public pages one where
// they are not needed. Even the relationship between boths
// can be more clear.
// Additionally, user may not need to be an observable but a constant
// instance.
var userProfile = require('./userProfile');
var profile = {
    loadLocalProfile: function() {
        return userProfile.load();
    },
    saveLocalProfile: function() {
        return userProfile.saveLocal();
    }
};

/**
 * Provides the basic user profile data, like
 * name, photo, type of user.
 * It contains data for anonymous user by default,
 * to be updated internally by the session management
 * methods and remote syncing of the data.
 */
exports.user = ko.pureComputed(function() {
    return userProfile.data;
});

// Events emitted by the session
var EventEmitter = require('events').EventEmitter;
exports.events = new EventEmitter();

/**
    Clear the local stored data, but with careful for the special
    config data that is kept.
    @private
**/
var clearLocalData = function () {
    // Clear all local persisted storage
    return local.clear()
    .then(function() {
        // Clear in-memory storage:
        // memory cache is distributed on each module,
        // we trigger an event to notify listening modules
        // so can clean its memory or even make further tasks
        exports.events.emit('clearLocalData');
    });
};

/**
 * Set-ups Google Analytics library, if loaded,
 * with the credentials so identifies the user.
 * @param {Credentials} credentials
 */
var setupGoogleAnalytics = function(credentials) {
    if (window.ga) {
        if (window.cordova) {
            window.ga.setUserId(credentials.userID);
        }
        else {
            window.ga('set', 'userId', credentials.userID);
        }
    }
};

/**
 * Tries to open a session by restoring the user
 * locally saved credentials (if any,
 * no error if nothing).
 * Expected to be call at app start-up,
 * will prevent execution if a session is
 * running.
 * @returns {Promise<Credentials>}
 */
exports.restore = function() {
    if (isSessionOpened) return Promise.resolve(null);

    // If there are credentials saved
    return credentialsStore.get()
    .then(function(credentials) {
        setupGoogleAnalytics(credentials);
        // Load User Profile, from local with server fallback and server synchronization, silently
        return profile.loadLocalProfile()
        .then(function() {
            return credentials;
        }, function() {
            // At catch loadLocalProfile error, continue as success:
            return credentials;
        });
    })
    .then(function(credentials) {
        // Track session as opened
        isSessionOpened = true;
        restoredEvent.emit(credentials);
        return credentials;
    })
    .catch(function() {
        // No need to trigger errors (nothing to restore,
        // local credentials corrupted,
        // remote not available)
    });
};

/**
 * Opens the user session for
 * the given credentials to the remote endpoint.
 * It clears the user session,
 * stores the login credentials
 * and set-up the new session.
 * This is the next-step after a remote login
 * @param {Credentials} loginData Response data from an auth login/signup
 * describing the user credentials and profile
 * @returns {Promise<Credentials>}
 */
exports.open = function(credentials) {
    // Remove any previous local data if any:
    return clearLocalData()
    .then(function() {
        // async local save, don't wait
        credentialsStore.set(credentials);

        // Set user data (credentials includes a profile copy for
        // convenience, but is not saved in the credentials store since
        // it has it's own dedicated store-module userProfile already)
        exports.user().model.updateWith(credentials.profile);
        // IMPORTANT: Local name kept in sync with set-up at userProfile module
        profile.saveLocalProfile();

        setupGoogleAnalytics(credentials);

        // Track session as opened
        isSessionOpened = true;
        openedEvent.emit(credentials);
        return credentials;
    });
};

/**
 * Closes the current user session,
 * clean-ing up user data from memory
 * and local store.
 * This is the next-step after a remote logout
 * @returns {Promise}
 */
exports.close = function() {
    return Promise.all([
        credentialsStore.clear(),
        // Local data clean-up!
        clearLocalData()
    ]).
    then(function() {
        // Track session as closed
        isSessionOpened = false;
        closedEvent.emit();
    });
};
