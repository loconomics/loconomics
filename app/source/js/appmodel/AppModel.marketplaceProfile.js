/** MarketplaceProfile
**/
'use strict';

var MarketplaceProfile = require('../models/MarketplaceProfile');
var session = require('../data/session');
var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new MarketplaceProfile(),
        ttl: { minutes: 1 },
        localStorageName: 'marketplaceProfile',
        fetch: function fetch() {
            return appModel.rest.get('me/marketplace-profile');
        },
        push: function push() {
            return appModel.rest.put('me/marketplace-profile', this.data.model.toPlainObject());
        }
    });

    session.on.cacheCleaningRequested.subscribe(function() {
        rem.clearCache();
    });

    return rem;
};
