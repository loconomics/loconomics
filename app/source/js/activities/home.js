/**
    Home activity (aka Search)
    //used to get apisearch results by term, lat, long,
**/
'use strict';
var $ = require('jquery');

var SearchResults = require('../models/SearchResults');
var ko = require('knockout');
var Activity = require('../components/Activity');
var snapPoints = require('../utils/snapPoints');

var googleMapReady = require('../utils/googleMapReady');
require('geocomplete');
var user = require('../data/userProfile').data;
var search = require('../data/search');
require('../kocomponents/home/search-box');

var A = Activity.extend(function HomeActivity() {

    Activity.apply(this, arguments);
    this.navBar = Activity.createSectionNavBar(null);
    var navBar = this.navBar;
    navBar.additionalNavClasses('AppNav--home');
    this.accessLevel = null;
    this.title('Find and book local services');
    this.viewModel = new ViewModel();
    this.viewModel.nav = this.app.navBarBinding;
    // We need a reference to later calculate snap-point based on Nav height
    this.$header = $('.AppNav');

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-fixed-header',
        handler: function(e, what) {
            var cs = navBar.additionalNavClasses();
            if (what === 'after') {
                navBar.additionalNavClasses(cs + ' is-fixed');
                //$header.addClass('is-fixed');
            }
            else {
                navBar.additionalNavClasses(cs.replace('is-fixed', ''));
                //$header.removeClass('is-fixed');
            }
        }
    });

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-search',
        handler: function(e, what) {
            var cs = navBar.additionalNavClasses();
            if (what === 'after') {
                navBar.additionalNavClasses(cs + ' is-search');
                //$header.addClass('is-search');
            }
            else {
                navBar.additionalNavClasses(cs.replace('is-search', ''));
                //$header.removeClass('is-search');
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

        // Check if pop-up was displayed already to don't bother users
        // And of course we must not attempt that ones that are already users :-)
        var showIt = !localStorage.sanFranciscoLaunchPopup && user.isAnonymous();
        if (showIt) {
            this.app.modals.showAnnouncement({
                message: 'We\'re an app for booking local services that\'s cooperatively owned by service professionals. Right now we\'re busy recruiting service professional owners in San Francisco and Oakland. Click below to learn more.',
                primaryButtonText: 'I\'m a service professional',
                primaryButtonLink: '#!/learnMoreProfessionals',
                secondaryButtonText: 'I\'m a potential client',
                secondaryButtonLink: '#!/'
            })
            .then(function() {
                // Once closed (from clicking everywhere, close button or clicking main buttons)
                localStorage.sanFranciscoLaunchPopup = true;
            });
        }
    }
    this.viewModel.searchTerm('');
};


function ViewModel() {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable();
    // Coordinates
    this.lat = ko.observable(search.DEFAULT_LOCATION.lat);
    this.lng = ko.observable(search.DEFAULT_LOCATION.lng);
    this.city = ko.observable();
    this.searchDistance = ko.observable(search.DEFAULT_LOCATION.searchDistance);
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();

    this.loadData = function(searchTerm, lat, lng) {
        this.isLoading(true);

        return search.byTerm(searchTerm, lat, lng)
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
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 300 } });

    this.searchResults.getJobTitleUrl = function(id) {
        return '/searchJobTitle/' + id + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
    }.bind(this);
    this.searchResults.getServiceProfessionalUrl = function(id) {
        return '/profile/' + id;
    }.bind(this);
    this.searchResults.getSearchCategoryUrl = function(categoryID) {
        return '/searchCategory/' + categoryID + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
    }.bind(this);

    this.onSelect = function() {
        // Nothing, just prevent default behavior
    };
}
