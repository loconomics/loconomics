/** Postal Code.

    Access the API to validate and retrieve information for a 
    given postal code.
    
    It just offers a 'get postal code info' method returning
    a plain object from the REST endpoint.
    
    Creates an in-memory cache for frequently used postal codes
**/
'use strict';

exports.create = function create(appModel) {

    var api = {},
        cache = {};
    
    api.getItem = function getItem(postalCode) {
        
        postalCode = postalCode || '';
        if (/^\s*$/.test(postalCode)) {
            return Promise.reject('Postal Code Not Valid');
        }
        
        // Check cache
        if (cache.hasOwnProperty(postalCode)) {
            return Promise.resolve(cache[postalCode]);
        }
        
        return appModel.rest.get('postal-codes/' + postalCode)
        .then(function(info) {
            // Save cache
            if (info) {
                cache[postalCode] = info;
            }
            // return
            return info;
        });
    };

    appModel.on('clearLocalData', function() {
        cache = {};
    });
    
    return api;
};
