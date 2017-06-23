/** Postal Code.

    Access the API to validate and retrieve information for a
    given postal code.

    It just offers a 'get postal code info' method returning
    a plain object from the REST endpoint.

    Creates an in-memory cache for frequently used postal codes
**/
'use strict';
var session = require('../data/session');

exports.create = function create(appModel) {

    var api = {},
        cache = {};

    api.getItem = function getItem(postalCode) {
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

    session.on.cacheCleaningRequested.subscribe(function() {
        cache = {};
    });

    /**
     * @static
     * @param {string} postal code to validate
     * @returns {Boolean} true if postal code is valid
     */
    api.isValid = function(postalCode) {
        return !(/^\s*$/).test(postalCode);
    };

    /**
     * @static
     * @param {Object} address with city, stateProvinceCode and stateProvinceName fields
     * @param {Object} address-like model that will be updated with values from addressObject
     */
    api.updateAddressModel = function(addressObject, addressModel) {
        if (addressModel.city) addressModel.city(addressObject.city);
        if (addressModel.stateProvinceCode) addressModel.stateProvinceCode(addressObject.stateProvinceCode);
        if (addressModel.stateProvinceName) addressModel.stateProvinceName(addressObject.stateProvinceName);
    };

    /**
     * An address object with empty fields.
     *
     * @constant
     */
    api.emptyAddress = {
        city: '',
        stateProvinceCode: '',
        stateProvinceName: ''
    };

    return api;
};
