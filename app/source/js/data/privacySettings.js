/**
 * Management of the user privacy settings,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PrivacySettings = require('../models/PrivacySettings');
var session = require('./session');
var RemoteModel = require('./helpers/RemoteModel');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: new PrivacySettings(),
    ttl: { minutes: 1 },
    localStorageName: 'privacySettings',
    fetch: function fetch() {
        return remote.get('me/privacy-settings');
    },
    push: function push() {
        return remote.put('me/privacy-settings', this.data.model.toPlainObject());
    }
});
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
