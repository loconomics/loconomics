/** MarketplaceProfile
**/
'use strict';

var MarketplaceProfile = require('../models/MarketplaceProfile');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new MarketplaceProfile(),
        ttl: { minutes: 1 },
        localStorageName: 'marketplaceProfile',
        fetch: function fetch() {
            return appModel.rest.get('marketplace-profile');
        },
        push: function push() {
            return appModel.rest.put('marketplace-profile', this.data.model.toPlainObject());
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};
