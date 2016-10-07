/**
    Utility reducing common boilerplate to perform look-up of well know address details
    based on the postal code, and validating the code at the same time, for commo address data models
    that ever share the same naming for address fields.
    NOTE: using a rated computed that avoids excesive request being performed on typing changes.
    NOTE: it needs a reference to the app.model to perform the remote look-up using the common API.
    
**/
'use strict';
var ko = require('knockout');

/**
    @param options {
        address:object Reference to an object with observable properties for the address information. The object
            don't need to be strictly an Address model, but any object with address-like properties, being all optional except postalCode.
            It can be too an observable with the object as value, if the value is null/empty the computation is not done (there is
            an 'enabled' observable as option to allow disabling temporarly the look-up without need to set a null here).
        appModel:object Reference to the app.model instance, needed to access the appModel of postal codes
        enabled:bool An observable or computed that behave as a switch that allows external control
            about if the lookup must be performed or not. It's optional, being true by default (as ko.observable(true))
        postalCodeError:string An observable that the lookup process will update with the
            error message of validating the postal code, or set to null if was successfully.
    }
**/
module.exports = function createPostalCodeAutolookup(options) {
    if (!options) throw 'Options required at postal code auto-lookup';
    if (!options.address) throw 'Address observable required (must have address-like observable fields with standard names)';
    if (!ko.isObservable(options.postalCodeError)) throw 'Postal Code Error observable required';
    if (!options.appModel) throw 'A reference to the App Model instance is required';

    var postalCodeError = options.postalCodeError;
    var appModel = options.appModel;
    // Optional 'enabled' observable, true by default
    var enabled = ko.isObservable(options.enabled) ? options.enabled : ko.observable(true);

    // Closure that runs the (remote) look-up for a given postal code
    // and sets the error or address values at the observables on scope
    var lookup = function postalCodeLookup(address, postalCode) {
        if (postalCode && !/^\s*$/.test(postalCode)) {
            // TODO Being able, here or at the appModel, to abort requests when a new one is needed because the code changed
            appModel.postalCodes.getItem(postalCode)
            .then(function(info) {
                if (info) {
                    if (address.city) address.city(info.city);
                    if (address.stateProvinceCode) address.stateProvinceCode(info.stateProvinceCode);
                    if (address.stateProvinceName) address.stateProvinceName(info.stateProvinceName);
                    postalCodeError('');
                }
            })
            .catch(function(err) {
                //jshint maxcomplexity:10
                if (address.city) address.city('');
                if (address.stateProvinceCode) address.stateProvinceCode('');
                if (address.stateProvinceName) address.stateProvinceName('');
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
        if (!enabled()) return;
        // Get address, can be just an object or an observable that contains the 'address-like' object
        // If no value, just skipt the same as is when disabled
        var address = ko.unwrap(options.address);
        // IMPORTANT: Do NOT check too if the address has a postalCode field, since we WANT an error being throw
        // if the required postalCode does not exists
        if (!address) return;
        var postalCode = address.postalCode();
        lookup(address, postalCode);
    })
    // Avoid excessive requests by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 200, method: 'notifyWhenChangesStop' } });
};
