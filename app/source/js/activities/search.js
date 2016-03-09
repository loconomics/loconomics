/**
    Search activity
**/
'use strict';

var 
    SearchResults = require('../models/SearchResults'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var googleMapReady = require('../utils/googleMapReady');
require('geocomplete');

var A = Activity.extend(function SearchActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    //pass in the app model so the view model can use it
    this.viewModel = new ViewModel(this.app.model);
    this.navBar = Activity.createSubsectionNavBar('Back');

    // LOCATION AUTOCOMPLETE:
    // Load Google Maps API with Places and prepare the location autocomplete
    var $location = this.$activity.find('[name=location]');
    var vm = this.viewModel;
    googleMapReady(function(/*UNCOMMENT FOR USE THE 'WITHOUT PLUGIN' CODE:*//*google*/) {
        var options = {
            types: ['geocode'],
            bounds: null,
            componentRestrictions: {
                country: 'US'
            }
        };
        
        // WITH PLUGIN:
        $location.geocomplete(options);
        $location.on('geocode:result', function(e, place) {
            if (place && place.geometry) {
                // Save to viewmodel
                vm.lat(place.geometry.location.lat());
                vm.lng(place.geometry.location.lng());
                console.log('LOCATION: ', place.geometry);
            }
        });

        // WITHOUT PLUGIN: Calling direclty Google Maps API, core feature of the plugin
        /*
        var autocomplete = new google.maps.places.Autocomplete(
            $location.get(0), options
        );
        
        google.maps.event.addListener(
            autocomplete,
            'place_changed',
            function() {
                var place = autocomplete.getPlace();
                if (place && place.geometry) {
                    // Save to viewmodel
                    vm.lat(place.geometry.location.lat());
                    vm.lng(place.geometry.location.lng());
                    console.log('LOCATION: ', place.geometry);
                }
            }
        );*/
    });
});

exports.init = A.init;

var DEFAULT_LOCATION = {
    lat: '37.788479',
    lng: '-122.40297199999998',
    searchDistance: 30
};

function ViewModel(appModel) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable();
    // Coordinates
    this.lat = ko.observable();
    this.lng = ko.observable();
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();
    this.loadData = function(searchTerm, lat, lng) {
        this.isLoading(true);
        //Call the get rest API method for api/v1/en-US/search
        return appModel.rest.get('search', {
            searchTerm: searchTerm, 
            origLat: lat || DEFAULT_LOCATION.lat,
            origLong: lng || DEFAULT_LOCATION.lng,
            searchDistance: DEFAULT_LOCATION.searchDistance
        })
        .then(function(searchResults) {
            if(searchResults){
                //update searchResults object with all the data from the API
                this.searchResults.model.updateWith(searchResults, true);
            }
            else {
                this.searchResults.model.reset();
            }
            this.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.isLoading(false);
        }.bind(this));
    };
    //creates a handler function for the html search button (event)
    this.search = function() {
        //creates a variable for the search term to check to see when a user enters more than 2 characters, we'll auto-load the data. 
        var s = this.searchTerm();
        if(s && s.length > 2) {
            this.loadData(s, this.lat(), this.lng());
        }
    };
    //anything that happens in the computed function after a timeout of 60 seconds, run the code
    ko.computed(function(){
        this.search();
    //add ",this" for ko.computed functions to give context, when the search term changes, only run this function every 60 milliseconds
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 1000 } });
}
