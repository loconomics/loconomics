/**
 * Management of the user privacy settings,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PrivacySettings = require('../models/PrivacySettings');
var session = require('./session');
var RemoteModel = require('../utils/RemoteModel');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
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

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
