/**
 * Manages the user session state with
 * credentials as basic data and notifications.
 * Allows to restore a session from saved credentials,
 * set-up of a new session and
 * closing a session performing clean up tasks
 * @module data/session
 */
'use strict';

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
/**
 * Event triggered by a session just closed
 */
var cacheCleaningRequestedEvent = new SingleEvent(exports);

exports.on = {
    opened: openedEvent.subscriber,
    restored: restoredEvent.subscriber,
    closed: closedEvent.subscriber,
    cacheCleaningRequested: cacheCleaningRequestedEvent.subscriber
};

/**
    Clear the local stored data and
    request cache cleaning to data modules
    (task delegated through an event)
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
        cacheCleaningRequestedEvent.emit();
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
 * @returns {Promise<Credentials>} Null if no saved credentials
 */
exports.restore = function() {
    if (isSessionOpened) return Promise.resolve(null);

    // If there are credentials saved
    return credentialsStore.get()
    .then(function(credentials) {
        setupGoogleAnalytics(credentials);
        // Track session as opened
        isSessionOpened = true;
        restoredEvent.emit(credentials);
        return credentials;
    })
    .catch(function() {
        // No need to trigger errors (nothing to restore,
        // or local credentials corrupted, anyway will
        // require a new user login keeping current session
        // as closed/anonymous)

        // Notice no credentials:
        return null;
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
