/** Customers
**/
'use strict';

var Customer = require('../models/Customer');

var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        listTtl: { minutes: 1 },
        itemIdField: 'customerUserID',
        Model: Customer
    });

    api.addLocalforageSupport('customers');
    api.addRestSupport(appModel.rest, 'customers');
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    /**
        Public search of users, possible customers by well
        know fields, with full value match.
    **/
    var publicSearchRequest = null;
    api.publicSearch = function publicSearch(search) {

        // Only one request at a time
        if (publicSearchRequest &&
            publicSearchRequest.abort) {
            try {
                publicSearchRequest.abort();
            } catch (abortErr) {
                console.error('Error aborting request', abortErr);
            }
        }
        
        var request = appModel.rest.get('customers/public-search', search);
        publicSearchRequest = request.xhr;
        
        // Catch 'abort' to avoid communicate a fake error in the promise; the
        // promise will just solve as success with empty array.
        request = request.catch(function(err) {
            if (err && err.statusText === 'abort')
                return [];
            else
                // Rethrow only if is not an 'abort'
                return err;
        });
        // Set again, removed by the catch returned promise
        request.xhr = publicSearchRequest;

        return request;
    };

    return api;
};
