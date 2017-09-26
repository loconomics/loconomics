/**
 * @module kocomponents/location-autocomplete
 * @author ndarilek
 * @overview An accessible location autocomplete input.
 */
'use strict';

var $ = require('jquery');

var TAG_NAME = 'location-autocomplete';
var TEMPLATE = require('../../html/kocomponents/location-autocomplete.html');
var googleMapReady = require('../utils/googleMapReady');
var ko = require('knockout');

function ViewModel(params, refs) {
    // LOCATION AUTOCOMPLETE:
    // Load Google Maps API with Places and prepare the location autocomplete
    var $location = $(refs.root.querySelector('[name=location]'));
    googleMapReady(function(google) {
        var options = {
            types: ['geocode'],
            bounds: null,
            componentRestrictions: {
                country: 'US'
            }
        };

        var autocomplete = new google.maps.places.Autocomplete(
            $location.get(0), options
        );

        google.maps.event.addListener(
            autocomplete,
            'place_changed',
            function() {
                var place = autocomplete.getPlace();
                if (place && place.geometry)
                    params.onGeocodeResult(place);
            }
        );
    });
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {HTMLElement} componentInfo.element the component element
 */
var create = function(params, componentInfo) {
    var refs = {
        root: componentInfo.element
    };
    return new ViewModel(params, refs);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create }
});
