/**
 * Management of the user marketplace profile,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

import { list as userListings } from './userListings';

var MarketplaceProfile = require('../models/MarketplaceProfile');
var session = require('./session');
var RemoteModel = require('./helpers/RemoteModel');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
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
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

// A marketplace profile change may change the status of listings and bookMeButtonReady
// and alerts, like profile picture (this data module may not allow upload but is ever
// used behind a picture upload, in order to update URL)
const save = api.save.bind(api);
api.save = (data) => save(data).then((result) => {
    userListings.invalidateCache();
    return result;
});
