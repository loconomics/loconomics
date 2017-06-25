/**
 * Management of the user home address,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var Address = require('../models/Address');
var session = require('./session');
var RemoteModel = require('../utils/RemoteModel');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
    data: new Address(),
    ttl: { minutes: 1 },
    localStorageName: 'homeAddress',
    fetch: function fetch() {
        return remote.get('me/addresses/home');
    },
    push: function push() {
        return remote.put('me/addresses/home', this.data.model.toPlainObject());
    }
});

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
