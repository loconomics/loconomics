/**
    Home activity (aka Search)
    //used to get apisearch results by term, lat, long, 
**/
'use strict';
var $ = require('jquery');

var 
    SearchResults = require('../models/SearchResults'),
    ko = require('knockout'),
    Activity = require('../components/Activity'),
    SignupVM = require('../viewmodels/Signup'),
    snapPoints = require('../utils/snapPoints');

var googleMapReady = require('../utils/googleMapReady');
require('geocomplete');


var A = Activity.extend(function LearnMoreProfessionalsActivity() {

    Activity.apply(this, arguments);
    this.navBar = Activity.createSectionNavBar(null);
    var navBar = this.navBar;
    navBar.additionalNavClasses('AppNav--home');
    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    this.viewModel.nav = this.app.navBarBinding;
    var $header = this.$header = $('.AppNav');

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-fixed-header',
        handler: function(e, what) {
            if (what === 'after') {
                $header.addClass('is-fixed');
            }
            else {
                $header.removeClass('is-fixed');
            }
        }
    });
    
    // Redircect on success
    this.registerHandler({
        target: this.viewModel.signup,
        event: 'signedup',
        handler: function() {
            this.app.goDashboard();
        }.bind(this)
    });

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-search',
        handler: function(e, what) {
            if (what === 'after') {
                $header.addClass('is-search');
            }
            else {
                $header.removeClass('is-search');
            }
        }
    });
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
                vm.city(place.formatted_address);
                console.log('LOCATION: ', place);
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
    searchDistance: 30,
    city: 'San Francisco, CA USA'
};

A.prototype._registerSnapPoints = function() {

    var $searchBox = this.$activity.find('#homeSearch'),
        // Calculate the position where search box is completely hidden, and get 1 on the worse case -- bad value coerced to 0,
        // negative result because some lack of data (content hidden)
        searchPoint = Math.max(1, (
            // Top offset with the scrolling area plus current scrollTop to know the actual position inside the positioning context
            // (is an issue if the section is showed with scroll applied on the activity)
            $searchBox.offset().top + this.$activity.scrollTop() +
            // Add the box height but sustract the header height because that is fixed and overlaps
            $searchBox.outerHeight() - this.$header.outerHeight()
        ) |0);
    
    var pointsEvents = {
        // Just after start scrolling
        0: 'scroll-fixed-header'
    };
    pointsEvents[searchPoint] = 'scroll-search';

    snapPoints(this.$activity, pointsEvents);
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    if (!this._notFirstShow) {
        this._registerSnapPoints();
        this._notFirstShow = true;
    }
    this.viewModel.searchTerm('');
};


function ViewModel(app) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable();
    this.isServiceProfessional = ko.pureComputed(function() {
        var u = app.model.user();
        return u && u.isServiceProfessional();
    });
    this.isClient = ko.pureComputed(function() {
        var u = app.model.user();
        return u && u.isClient();
    });
    //Signup
    this.signup = new SignupVM(app); 
    this.signup.profile('service-professional');
    // Coordinates
    this.lat = ko.observable(DEFAULT_LOCATION.lat);
    this.lng = ko.observable(DEFAULT_LOCATION.lng);
    this.city = ko.observable();
    this.searchDistance = ko.observable(DEFAULT_LOCATION.searchDistance);
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();
    this.loadData = function(searchTerm, lat, lng) {
        this.isLoading(true);
        //Call the get rest API method for api/v1/en-US/search
        return app.model.rest.get('search', {
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
        else{
            this.searchResults.model.reset();
        }
    };
    //anything that happens in the computed function after a timeout of 60 seconds, run the code
    ko.computed(function(){
        this.search();
    //add ",this" for ko.computed functions to give context, when the search term changes, only run this function every 60 milliseconds
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 1000 } });
    
    this.isInput = ko.pureComputed(function() {
        var s = this.searchTerm();
        return s && s.length > 2;
    }, this);
    
    this.clickJobtitle = function(d, e) {
        // For anonymous users, we just let the link to scroll down to sign-up form (hash link must be in place)
        // For logged users, assist them to add the job title:
        if (!app.model.userProfile.data.isAnonymous()) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var url = 'addJobTitles?s=' + encodeURIComponent(d.singularName()) + '&id=' + encodeURIComponent(d.jobTitleID());
            app.shell.go(url);
        }
    };
    
    this.clickNoJobTitle = function(d, e) {
        // For anonymous users, we just let the link to scroll down to sign-up form (hash link must be in place)
        // For logged users, assist them to add the job title:
        if (!app.model.userProfile.data.isAnonymous()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Go to addJobTitles
            var url = 'addJobTitles?s=' + encodeURIComponent(this.searchTerm()) + '&autoAddNew=true';
            app.shell.go(url);
        }
    };
    
    this.resultsButtonText = ko.pureComputed(function() {
        var anon = app.model.userProfile.data.isAnonymous();
        return anon ? 'Sign up' : 'Add';
    }, this);
    
    this.thereAreJobTitles = ko.pureComputed(function() {
        var jts = this.searchResults.jobTitles();
        return jts.length > 0;
    }, this);
}
