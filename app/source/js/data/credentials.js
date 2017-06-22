/**
 * Manages locally stored credentials.
 * This let identify the user and authorize it
 * at the remote webservice.
 * @module data/credentials
 */
'use strict';
var STORE_NAME = 'credentials';
var local = require('./drivers/localforage');

/**
 * Remote response data for a succesfully logged user
 * @typedef {Object} Credentials
 * @property {string} username
 * @property {number} userID
 * @property {string} authKey Authentification key for future requests
 * @property {UserProfile} profile Basic profile information of the user
 */

/**
 * Check if the given object seems to have
 * valid credentials by checking for almost a
 * value on required properties.
 * @private
 * @param {Credentials} credentials
 */
var seemsValidCredentials = function(credentials) {
    return !!(
        credentials &&
        credentials.userID &&
        credentials.username &&
        credentials.authKey
    );
};

/**
 * Returns the stored credentials,
 * or throws error if not found or looks corrupt
 * @returns {Promise<Credentials>}
 */
exports.get = function() {
    return local
    .getItem(STORE_NAME)
    .then(function(credentials) {
        if (seemsValidCredentials(credentials)) {
            return credentials;
        }
        else {
            throw new Error('Credentials not found');
        }
    });
};

/**
 * Stores the given credentials locally.
 * Let's the app to keep the user logged between executions
 * until explicitely removes them.
 * It throws error if given credentials don't seem valid
 * @param {Credentials} credentials
 * @returns {Promise}
 */
exports.set = function(credentials) {
    if (seemsValidCredentials(credentials)) {
        return local.setItem(STORE_NAME, {
            userID: credentials.userID,
            username: credentials.username,
            authKey: credentials.authKey
        });
    }
    else {
        throw new Error('Invalid credentials');
    }
};

/**
 * Removes the stored credentials
 * @returns {Promise}
 */
exports.clear = function() {
    return local.removeItem(STORE_NAME);
};
