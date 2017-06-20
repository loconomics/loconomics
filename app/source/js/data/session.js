/**
 * Manages the user session in the app,
 * includes the profile basic data (name,...),
 * restoring a session from saved credentials,
 * set-up of a new session and
 * closing a session performing clean up tasks
 */
'use strict';

var User = require('../models/User');
var ko = require('knockout');

// TODO about user observable: Is an Alias for the user data
// from UserProfile, needs review/refactor
// if continue to makes sense to keep as an observable or
// permanet self-updated Model instance (it's already keep
// untouched the instance) or plain data with a more explicit
// subscribe mechanism for updates.
var userInstance = User.newAnonymous();

/**
 * Provides the basic user profile data, like
 * name, photo, type of user.
 * It contains data for anonymous user by default,
 * to be updated internally by the session management
 * methods and remote syncing of the data.
 */
exports.user = ko.pureComputed(function() {
    return userInstance;
});

/**
 * Restores the user session from
 * locally saved credentials (if any,
 * no error if nothing).
 * Expected to be call at app start-up,
 * will prevent execution if a session is
 * running.
 */
exports.restore = function() {

};

/**
 * Opens the user session for
 * the given settings, that includes
 * valid IDs and token from remote connection.
 * Automatically closes previous session.
 * This is the next-step after a remote login
 */
exports.open = function() {

};

/**
 * Closes the current user session,
 * clean-ing up user data from memory
 * and local store.
 * This is the next-step after a remote logout
 */
exports.close = function() {

};
