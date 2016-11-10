/** Payment Account
**/
'use strict';

var PaymentAccount = require('../models/PaymentAccount');
var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new PaymentAccount(),
        ttl: { minutes: 1 },
        localStorageName: 'paymentAccount',
        fetch: function fetch() {
            return appModel.rest.get('me/payment-account');
        },
        push: function push() {
            return appModel.rest.put('me/payment-account', this.data.model.toPlainObject());
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};
