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
 * When opening a session,
 * set-ups the client with the authorization
 * credentials so the user is identified in each
 * new request.
 * @param {Credentials} credentials
 */
session.on.opened.subscribe(function(credentials) {
    // use authorization key for each new request
    setAuthorization('LC alu=' + credentials.userID + ',alk=' + credentials.authKey);
});
