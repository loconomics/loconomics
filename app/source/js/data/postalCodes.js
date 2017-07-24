/**
 * Provides validation and context information
 * for postal codes, using the remote API.
 * Creates an in-memory cache for frequently used postal codes.
 *
 */
// TODO jsdocs
'use strict';

var session = require('./session');
var remote = require('./drivers/restClient');

var cache = {};

exports.getItem = function getItem(postalCode) {
    // Check cache
    if (cache.hasOwnProperty(postalCode)) {
        return Promise.resolve(cache[postalCode]);
    }

    return remote.get('postal-codes/' + postalCode)
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
 * @param {string} postalCode postal code to validate
 * @returns {Boolean} true if postal code is valid
 */
exports.isValid = function(postalCode) {
    return !(/^\s*$/).test(postalCode);
};

/**
 * @static
 * @param {Object} addressObject address with city, stateProvinceCode and stateProvinceName fields
 * @param {Object} addressModel address-like model that will be updated with values from addressObject
 */
exports.updateAddressModel = function(addressObject, addressModel) {
    if (addressModel.city) addressModel.city(addressObject.city);
    if (addressModel.stateProvinceCode) addressModel.stateProvinceCode(addressObject.stateProvinceCode);
    if (addressModel.stateProvinceName) addressModel.stateProvinceName(addressObject.stateProvinceName);
};

/**
 * An address object with empty fields.
 *
 * @constant
 */
exports.emptyAddress = {
    city: '',
    stateProvinceCode: '',
    stateProvinceName: ''
};
