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
require('./input-autocomplete');

function ViewModel(params) {
    this.value = ko.observable(ko.unwrap(params.value));
    this.suggestions = ko.observableArray();

    var google = null;
    this.onSelect = function(text, result) {
        if (typeof(params.onSelect) === 'function') {
            var placesService = new google.maps.places.PlacesService(document.querySelector('#google-maps-places-attribution'));
            placesService.getDetails({
                placeId: result.place_id
            }, function(place) {
                if (place) {
                    params.onSelect(place);
                }
            });
        }
    };

    var self = this;
    // Load Google Maps API with Places.
    googleMapReady(function(goog) {
        google = goog;

        var autocomplete = new google.maps.places.AutocompleteService();
        self.value.subscribe(function(newValue) {
            if(newValue)
                autocomplete.getPlacePredictions({
                    input: newValue,
                    componentRestrictions: {
                        country: 'US'
                    }
                }, function(results) {
                    self.suggestions(results);
                });
            else
                self.suggestions([]);
        });
    });
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel,
    synchronous: true
});
