/**
 * Management of the user marketplace profile,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var MarketplaceProfile = require('../models/MarketplaceProfile');
var session = require('./session');
var RemoteModel = require('../utils/RemoteModel');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
    data: new MarketplaceProfile(),
    ttl: { minutes: 1 },
    localStorageName: 'marketplaceProfile',
    fetch: function fetch() {
        return remote.get('me/marketplace-profile');
    },
    push: function push() {
        return remote.put('me/marketplace-profile', this.data.model.toPlainObject());
    }
});

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
