/** Privacy Settings
**/
'use strict';

var PrivacySettings = require('../models/PrivacySettings');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new PrivacySettings(),
        ttl: { minutes: 1 },
        localStorageName: 'privacySettings',
        fetch: function fetch() {
            return appModel.rest.get('privacy-settings');
        },
        push: function push() {
            return appModel.rest.put('privacy-settings', this.data.model.toPlainObject());
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};
