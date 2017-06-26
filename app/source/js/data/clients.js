/**
 * Management of the user clients list,
 * local and remote.
 * It allows to make a public search of known clients
 */
// TODO store-jsdocs
'use strict';

var Client = require('../models/Client');
var session = require('./session');
var ListRemoteModel = require('../utils/ListRemoteModel');
var remote = require('./drivers/restClient');

var api = new ListRemoteModel({
    listTtl: { minutes: 1 },
    itemIdField: 'clientUserID',
    Model: Client
});
module.exports = api;

api.addLocalforageSupport('clients');
api.addRestSupport(remote, 'me/clients');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

/**
    Public search of users, possible clients by well
    know fields, with full value match.
**/
var publicSearchRequest = null;
api.publicSearch = function publicSearch(search) {

    // Only one request at a time
    if (publicSearchRequest &&
        publicSearchRequest.abort) {
        try {
            publicSearchRequest.abort();
        } catch (abortErr) {
            console.error('Error aborting request', abortErr);
        }
    }

    var request = remote.get('me/clients/public-search', search);
    publicSearchRequest = request.xhr;

    // Catch 'abort' to avoid communicate a fake error in the promise; the
    // promise will just solve as success with empty array.
    request = request.catch(function(err) {
        if (err && err.statusText === 'abort')
            return [];
        else
            // Rethrow only if is not an 'abort'
            throw err;
    });
    // Set again, removed by the catch returned promise
    request.xhr = publicSearchRequest;

    return request;
};
