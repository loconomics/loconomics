/**
 * @module kocomponents/location-autocomplete
 * @author ndarilek
 * @overview An accessible location autocomplete input.
 */
'use strict';

var TAG_NAME = 'location-autocomplete';
var TEMPLATE = require('../../html/kocomponents/location-autocomplete.html');
var googleMapReady = require('../utils/googleMapReady');
var ko = require('knockout');

function ViewModel(params) {
    this.value = ko.observable(ko.unwrap(params.value));
    this.suggestions = ko.observableArray();
    this.onSelect = params.onSelect;
    var self = this;
    // Load Google Maps API with Places.
    googleMapReady(function(google) {
        var autocomplete = new google.maps.places.AutocompleteService();
        self.value.subscribe(function(newValue) {
            if(newValue)
                autocomplete.getPlacePredictions({
                    input: newValue,
                    componentRestrictions: {
                        country: 'US'
                    }
                }, function(results) {
                    var suggestions = results.map(function(r) { return r.description; });
                    self.suggestions(suggestions);
                });
            else
                self.suggestions([]);
        });

        /*
        google.maps.event.addListener(
            autocomplete,
            'place_changed',
            function() {
                var place = autocomplete.getPlace();
                if (place && place.geometry)
                    params.onGeocodeResult(place);
            }
        );*/
    });
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel
});
