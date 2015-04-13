/** UserProfile
**/
'use strict';

var User = require('../models/User');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: User.newAnonymous(),
        ttl: { minutes: 1 },
        // IMPORTANT: Keep the name in sync with set-up at AppModel-account
        localStorageName: 'profile',
        fetch: function fetch() {
            return appModel.rest.get('profile');
        },
        push: function push() {
            return appModel.rest.put('profile', this.data.model.toPlainObject());
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};
