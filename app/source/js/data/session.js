/**
 * Manages the user session state with
 * the stored user auth key and events.
 * Allows to restore a session from saved authorization,
 * set-up of a new session and
 * closing a session performing clean up tasks
 * @module data/session
 */
'use strict';

var local = require('./drivers/localforage');
var userAuthKeyStore = require('./userAuthKey');
var SingleEvent = require('../utils/SingleEvent').default;

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
 * Tries to open a session by restoring the user
 * locally saved user auth key (if any,
 * no error if nothing).
 * Expected to be call at app start-up,
 * will prevent execution if a session is
 * running.
 * @returns {Promise<UserAuthKey>} Null if no saved data
 */
exports.restore = function() {
    if (isSessionOpened) return Promise.resolve(null);

    // If there are data saved
    return userAuthKeyStore.get()
    .then(function(userAuthKey) {
        // Track session as opened
        isSessionOpened = true;
        restoredEvent.emit(userAuthKey);
        return userAuthKey;
    });
};

/**
 * Opens the user session for
 * the given user auth key data to the remote endpoint.
 * It clears the user session,
 * stores the login authorization
 * and set-up the new session.
 * This is the next-step after a remote login
 * @param {UserAuthKey} loginData Response data from an auth login/signup
 * describing the user authorization and profile
 * @returns {Promise<UserAuthKey>}
 */
exports.open = function(userAuthKey) {
    // Remove any previous local data if any:
    return clearLocalData()
    .then(function() {
        // async local save, don't wait
        userAuthKeyStore.set(userAuthKey);

        // Track session as opened
        isSessionOpened = true;
        openedEvent.emit(userAuthKey);
        return userAuthKey;
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
        userAuthKeyStore.clear(),
        // Local data clean-up!
        clearLocalData()
    ]).
    then(function() {
        // Track session as closed
        isSessionOpened = false;
        closedEvent.emit();
    });
};
