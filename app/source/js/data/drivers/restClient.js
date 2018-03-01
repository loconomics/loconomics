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
 * Sets the authorization header value for all future requests
 * @private
 * @param {string} authorizationValue
 */
var setAuthorization = function(authorizationValue) {
    rest.extraHeaders = rest.extraHeaders || {};
    rest.extraHeaders.Authorization = authorizationValue;
};

/**
 * Formats an authentication token for requests as a value for the Authorization
 * header
 * @param {UserAuthorization} userAuthorization
 * @returns {string}
 */
var authorizationValueFromUserAuthorization = function(userAuthorization) {
    return 'Bearer ' + (userAuthorization.authToken || '');
};

/**
 * Clear the authorization value for all future requests
 */
rest.clearAuthorization = function() {
    if (rest.extraHeaders) {
        delete rest.extraHeaders.Authorization;
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
 * so the user is identified in each
 * new request.
 * @param {UserAuthorization} userAuthorization
 */
var newSessionHandler = function(userAuthorization) {
    // use authorization key for each new request
    setAuthorization(authorizationValueFromUserAuthorization(userAuthorization));
};
/**
 * When opening a session, set-ups authorization
 * @param {UserAuthorization} userAuthorization
 */
session.on.opened.subscribe(newSessionHandler);
/**
 * When opening a session, set-ups authorization
 * @param {UserAuthorization} userAuthorization
 */
session.on.restored.subscribe(newSessionHandler);
