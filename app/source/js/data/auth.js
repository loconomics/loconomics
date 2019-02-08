/**
 * Provides user authentication through
 * the REST API
 * @module data/auth
 */
'use strict';

var remote = require('./drivers/restClient');
var getUrlQuery = require('../utils/getUrlQuery');
var param = require('jquery').param;
var session = require('./session');
var userProfile = require('./userProfile');

/**
 * @callback LocalLoginCb
 * @param {UserAuthorization} authorization Response data from login/signup
 * @returns {Promise<UserAuthorization>}
 */

/**
 * Provides a function that expects the remote
 * authorization from a login/signup
 * and open the new user session.
 * @private
 * @param {string} username
  * @returns {LocalLoginCb}
 */
var performLocalLogin = function (username) {
    return function (authorization) {
        // Complete the authorization object adding the username (needed for
        // session and stored authorization)
        authorization.username = username;
        // Starts the user session
        return session.open(authorization)
        // It gives the as parameter the same given authorization object that
        // we have already in the closure
        .then(function(/*authorization*/) {
            // If it includes profile data, save it
            if (authorization.profile) {
                // Set user data (authorization includes an optional profile copy for
                // convenience, but is not saved in the authorization store
                // but at userProfile)
                userProfile.data.model.updateWith(authorization.profile);
                // IMPORTANT: Local name kept in sync with set-up at userProfile module
                userProfile.saveLocal();
            }
            else {
                // No profile included, request it (without wait for it)
                userProfile.sync();
            }
            return authorization;
        });
    };
};

/**
 * Performs a login attempt with the API by using
 * the provided credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<UserAuthorization>}
 */
exports.login = function (username, password) {

    // Reset authentification from requests
    // prior attempt the login
    remote.clearAuthorization();

    return remote.post('auth/login', {
        username: username,
        password: password,
        returnProfile: true
    }).then(performLocalLogin(username));
};

/**
 * Performs a login attempt with the API by using
 * a Facebook accessToken.
 * @param {string} accessToken Token given by the Facebook API
 * @returns {Promise<UserAuthorization>}
 */
exports.facebookLogin = function (accessToken) {

    // Reset the extra headers to attempt the login
    remote.clearAuthorization();

    return remote.post('auth/login/facebook', {
        accessToken: accessToken,
        returnProfile: true
    }).then(function(logged) {
        return performLocalLogin(logged.profile.email)(logged);
    }.bind(this));
};

/**
 * Performs a logout, removing cached authorization
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
    // Don't need to wait the result of the REST operation
    remote.post('auth/logout');

    return session.close();
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
 * @param {string} [data.countryCode]
 * @param {string} [data.phone]
 * @param {string} [data.facebookUserID]
 * @param {string} [data.facebookAccessToken]
 * @param {string} [data.profileType=client] Closed enumeration allowing
 * 'service-professional' and 'client'
 * @param {string} [data.confirmationCode]
 * @param {number} [data.jobTitleID]
 * @param {string} [data.jobTitleName]
 * @returns {Promise<UserAuthorization>}
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
    .then(performLocalLogin(data.email));
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
