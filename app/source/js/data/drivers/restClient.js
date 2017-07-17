/**
 * REST API client data driver.
 * Provides a REST client instance ready
 * to use with the app set-up
 */
'use strict';

var API_BASE_URL = '/api/v1/en-US/';
var Rest = require('../../utils/Rest');
var presets = require('../appPresets');
var session = require('../session');

/**
 * Exposed rest client
 */
var rest = new Rest(presets.siteUrl + API_BASE_URL);

module.exports = rest;

/**
 * Sets the authorization value for all future requests
 * @private
 * @param {string} authKey
 */
var setAuthorization = function(authKey) {
    rest.extraHeaders = rest.extraHeaders || {};
    rest.extraHeaders.Authorization = authKey;
};

/**
 * Formats an authentication key string for requests (authKey)
 * given a Credentials object
 * @param {Credentials} credentials
 * @returns {string}
 */
var authKeyFromCredentials = function(credentials) {
    return 'LC alu=' + credentials.userID + ',alk=' + credentials.authKey;
};

/**
 * Clear the authorization value for all future requests
 */
rest.clearAuthorization = function() {
    if (rest.exraHeaders) {
        delete rest.exraHeaders.Authorization;
    }
};

/**
 * When closing a session,
 * removes the auth key for next requests.
 */
session.on.closed.subscribe(function() {
    rest.clearAuthorization();
});

/**
 * Handler for new session notifications (open, restore).
 * It set-ups the client with the authorization
 * credentials so the user is identified in each
 * new request.
 * @param {Credentials} credentials
 */
var newSessionHandler = function(credentials) {
    // use authorization key for each new request
    setAuthorization(authKeyFromCredentials(credentials));
};
/**
 * When opening a session, set-ups authorization
 * @param {Credentials} credentials
 */
session.on.opened.subscribe(newSessionHandler);
/**
 * When opening a session, set-ups authorization
 * @param {Credentials} credentials
 */
session.on.restored.subscribe(newSessionHandler);
