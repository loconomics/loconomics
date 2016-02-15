/**
    ServiceAddressesViewModel
**/
'use strict';

var ko = require('knockout');

function ServiceAddressesViewModel() {
    
    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);
    this.sourceAddresses = ko.observableArray([]);
    this.selectedAddress = ko.observable(null);
    
    this.reset = function() {
        this.isSelectionMode(false);
        this.sourceAddresses([]);
        this.selectedAddress(null);
    };
    
    this.addresses = ko.pureComputed(function() {
        var list = this.sourceAddresses();
        if (this.isSelectionMode()) {
            // Filter by service addresses (excluding service area)
            list = list.filter(function(add) {
                return add.isServiceLocation();
            });
        }
        return list;
    }, this);
    
    this.hasAddresses = ko.pureComputed(function() {
        var adds = this.addresses();
        return (adds && adds.length > 0);
    }, this);
    
    // Useful list of only service-area addresses for
    // uses in some selection modes, like in booking
    this.serviceAreas = ko.pureComputed(function() {
        var list = this.sourceAddresses();
        // Filter by service area
        return list.filter(function(add) {
            return add.isServiceArea();
        });
    }, this);

    this.selectAddress = function(selectedAddress, event) {
        this.selectedAddress(selectedAddress);
        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
    
    this.observerSelected = function(item) {
        return ko.pureComputed(function() {
            //return this.selectedAddress() === item;
            var sid = this.selectedAddress() && ko.unwrap(this.selectedAddress().addressID),
                iid = item && ko.unwrap(item.addressID);
            return sid === iid;
        }, this);
    }.bind(this);
}

module.exports = ServiceAddressesViewModel;
