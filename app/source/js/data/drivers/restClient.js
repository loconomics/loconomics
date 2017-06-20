/**
 * REST API client data driver.
 * Provides a REST client instance ready
 * to use with the app set-up
 */
'use strict';

var API_BASE_URL = '/api/v1/en-US/';
var Rest = require('../../utils/Rest');
var presets = require('../appPresets');

/**
 * Exposed rest client
 */
var rest = new Rest(presets.siteUrl + API_BASE_URL);

module.exports = rest;

/// Additional public methods
/**
 * Sets the authorization value for all future requests
 */
rest.setAuthorization = function(authKey) {
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
