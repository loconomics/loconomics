/**
 * Provides user authentication through
 * the REST API
 * @module data/auth
 */
'use strict';

var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');
var getUrlQuery = require('../utils/getUrlQuery');
var param = require('jquery').param;

var EventEmitter = require('events').EventEmitter;
exports.events = new EventEmitter();

//TODO
var user = {};//require user|session data module
var userProfile = {};//require userProfile data module

/**
    Clear the local stored data, but with careful for the special
    config data that is kept.
**/
var clearLocalData = function () {
    // Clear local persisted storage
    local.clear();

    // Clear in-memory storage:
    // memory cache is distributed on each module,
    // we trigger an event to notify listening modules
    // so can clean its memory or even make further tasks
    exports.events.emit('clearLocalData');
};

/**
 * Remote response data for a succesfully logged user
 * @typedef {Object} LoggedData
 * @property {number} userID
 * @property {string} authKey Authentification key for future requests
 * @property {UserProfile} profile Basic profile information of the user
 */

/**
 * @callback LocalLoginCb
 * @param {LoggedData} Response data for login/signup
 * @returns {Promise<LoggedData>}
 */

/**
 * Provides a function that expects the remote
 * response data from a login/signup
 * that, when called, will
 * clear the user session,
 * stores the login credentials
 * and set-up the new session
 * @private
 * @param {string} username
 * @param {string} password
 * @returns {LocalLoginCb}
 */
var performLocalLogin = function (username/*, password*/) {
    return function(logged) {
        // Remove any previous local data if any:
        return clearLocalData()
        .then(function() {

            // use authorization key for each
            // new Rest request
            remote.setAuthorization('LC alu=' + logged.userID + ',alk=' + logged.authKey);

            // async local save, don't wait
            local.setItem('credentials', {
                userID: logged.userID,
                username: username,
                authKey: logged.authKey
            });

            // Set user data
            user().model.updateWith(logged.profile);
            // IMPORTANT: Local name kept in sync with set-up at AppModel.userProfile
            userProfile.saveLocal();

            // Google Analytics
            if (window.ga) {
                if (window.cordova) {
                    window.ga.setUserId(logged.userID);
                }
                else {
                    window.ga('set', 'userId', logged.userID);
                }
            }

            return logged;
        });
    };
};

/**
 * Performs a login attempt with the API by using
 * the provided credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<LoggedData>}
 */
exports.login = function (username, password) {

    // Reset authentification from requests
    // prior attempt the login
    remote.clearAuthorization();

    return remote.post('auth/login', {
        username: username,
        password: password,
        returnProfile: true
    }).then(performLocalLogin(username, password));
};

/**
 * Performs a login attempt with the API by using
 * a Facebook accessToken.
 * @param {string} accessToken Token given by the Facebook API
 * @returns {Promise<LoggedData>}
 */
exports.facebookLogin = function (accessToken) {

    // Reset the extra headers to attempt the login
    remote.clearAuthorization();

    return remote.post('auth/login/facebook', {
        accessToken: accessToken,
        returnProfile: true
    }).then(function(logged) {
        return performLocalLogin(logged.profile.email, null)(logged);
    }.bind(this));
};

/**
 * Performs a logout, removing cached credentials
 * and profile so the app can be filled up with
 * new user information (closes user session).
 * It calls to the API logout call too, to remove
 * any server-side session and notification
 * (removes the cookie too, for browser environment
 * that may use it).
 * It doesn't waits to the remote logout to ends.
 * @returns {Promise}
 */
exports.logout = function logout() {
    // Local app close session
    remote.clearAuthorization();
    local.removeItem('credentials');
    local.removeItem('profile');

    // Local data clean-up!
    clearLocalData();

    // Don't need to wait the result of the REST operation
    remote.post('auth/logout');

    return Promise.resolve();
};

/**
 * Attempts to create a user account, getting logged
 * if successfully like when doing a login call.
 * @param {Object} data
 * @param {string} data.email
 * @param {string} [data.password] Non required when providing
 * Facebook credentials
 * @param {string} [data.firstName]
 * @param {string} [data.lastName]
 * @param {string} [data.phone]
 * @param {string} [data.device]
 * @param {string} [facebookUserID]
 * @param {string} [facebookAccessToken]
 * @param {string} [profileType=client] Closed enumeration allowing
 * 'service-professional' and 'client'
 */
exports.signup = function (data) {

    // Reset the extra headers to attempt the signup
    remote.clearAuthorization();

    data.returnProfile = true;

    // Prepare 'utm' information passed into the query
    var query = getUrlQuery();
    var utm = {
        // Default source
        utm_source: window.cordova ? 'app' : 'web'
    };
    // Get only 'utm_' prefixed names, prepare object
    query.forEach(function(name) {
        if (/^utm_/.test(name)) {
            utm[name] = query[name];
        }
    });

    // The result is the same as in a login, and
    // we do the same as there to get the user logged
    // on the app on sign-up success.
    return remote.post('auth/signup?' + param(utm), data)
    .then(performLocalLogin(data.email, data.password));
};

/**
 * Response data for a reset password request
 * @typedef {Object} ResetPasswordResult
 * @property {string} message Server side message about the result
 */

/**
 * Request an email with token to reset the password for a given user
 * @param {Object} data
 * @param {string} username
 * @param {string} email Alias to username value
 * @returns {Promise<ResetPasswordResult>}
**/
exports.resetPassword = function (data) {
    var username = data.username || data.email;
    return remote.post('auth/reset-password', { username: username });
};

/**
 * Confirm to reset a password providing a new password and valid token
 * @param {Object} data
 * @param {string} token Value provided in the reset password email
 * for user input or inside an URL
 * @param {string} password New password
 * @returns {Promise<ResetPasswordResult>}
 */
exports.confirmResetPassword = function (data) {
    return remote.post('auth/reset-password/confirm', data);
};
