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
        console.log('Selection', text, result);
        if (typeof(params.onSelect) === 'function') {
            // TODO Get 'place' from result or another API
            var place = null;
            if (place) {
                params.onSelect(place);
            }
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
