/**
    Utility reducing common boilerplate to perform look-up of well know address details
    based on the postal code, and validating the code at the same time, for commo address data models
    that ever share the same naming for address fields.
    NOTE: using a rated computed that avoids excesive request being performed on typing changes.
    NOTE: it needs a reference to the app.model to perform the remote look-up using the common API.
    // TODO the code is derived from a handler at addressEditor for the same look-up, REPLACE THERE WITH THIS
**/
'use strict';
var ko = require('knockout');

module.exports = function createPostalCodeAutolookup(options) {
    if (!options) throw 'Options required at postal code auto-lookup';
    if (!options.address) throw 'Address observable required (must have address-like observable fields with standard names)';
    if (!options.postalCodeError) throw 'Postal Code Error observable required';
    if (!options.appModel) throw 'A reference to the App Model instance is required';

    var address = options.address;
    var postalCodeError = options.postalCodeError;
    var appModel = options.appModel;

    // Closure that runs the (remote) look-up for a given postal code
    // and sets the error or address values at the observables on scope
    var lookup = function postalCodeLookup(postalCode) {
        if (postalCode && !/^\s*$/.test(postalCode)) {
            appModel.postalCodes.getItem(postalCode)
            .then(function(info) {
                if (info) {
                    address.city(info.city);
                    address.stateProvinceCode(info.stateProvinceCode);
                    address.stateProvinceName(info.stateProvinceName);
                    postalCodeError('');
                }
            })
            .catch(function(err) {
                address.city('');
                address.stateProvinceCode('');
                address.stateProvinceName('');
                // Expected errors, a single message, set
                // on the observable
                var msg = typeof(err) === 'string' ? err : null;
                if (msg || err && err.responseJSON && err.responseJSON.errorMessage) {
                    postalCodeError(msg || err.responseJSON.errorMessage);
                }
                else {
                    // Log to console for debugging purposes, on regular use an error on the
                    // postal code is not critical and can be transparent; if there are 
                    // connectivity or authentification errors will throw on saving the address
                    console.error('Server error validating Zip Code', err);
                }
            });
        }
    };

    // It creates a rated computed that reacts to postalCode changes, requesting the look-up
    ko.computed(function() {
        var postalCode = address.postalCode();
        lookup(postalCode);
    })
    // Avoid excessive requests by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 200, method: 'notifyWhenChangesStop' } });
};
