/**
    Home activity (aka Search)
    //used to get apisearch results by term, lat, long,
**/
'use strict';
var $ = require('jquery');
var ko = require('knockout');
var Activity = require('../components/Activity');
var SignupVM = require('../viewmodels/Signup');
var snapPoints = require('../utils/snapPoints');
var SearchJobTitlesVM = require('../viewmodels/SearchJobTitlesVM');
var googleMapReady = require('../utils/googleMapReady');
require('geocomplete');
var user = require('../data/userProfile').data;

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
    googleMapReady(function(/*UNCOMMENT FOR USE THE 'WITHOUT PLUGIN' CODE:*//*google*/) {
        var vm = this.viewModel.search();
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
    }.bind(this));
});

exports.init = A.init;

A.prototype._registerSnapPoints = function() {

    var $searchBox = this.$activity.find('[name=s]'),
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
    this.viewModel.reset();
};

function ViewModel(app) {
    this.isServiceProfessional = user.isServiceProfessional;
    this.isClient = user.isClient;

    ///
    /// Signup
    // Component API entry point: expects SignupVM
    this.signup = ko.observable();
    this.resetSignup = function() {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.reset();

            // Presets: settings we require to keep the same
            // like untouched by the reset
            signup.profile(SignupVM.profileType.serviceProfessional);
            // Hide and preset the country
            signup.isCountryVisible(false);
            // default preset is already united state in the VM
        }
    };
    this.signup.subscribe(this.resetSignup.bind(this));
    // Redirect on success signup
    this.signupRedirect = function() {
        app.goDashboard();
    };
    this.setSignupJobTitle = function(id, name) {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.jobTitleID(id || undefined);
            signup.jobTitleName(name || undefined);
        }
    };

    // A static utility (currently only used to conditionally show/hide DownloadApp links)
    this.inApp = ko.observable(!!window.cordova);

    this.reset = function() {
        // Reset user values, no preset settings
        this.search().searchTerm('');
        this.resetSignup();
    }.bind(this);

    // API entry-point for search component
    this.search = ko.observable(new SearchJobTitlesVM(app));
    this.search().onClickJobTitle = function(jobTitle, e) {
        // For anonymous users, we just
        // let the link to scroll down to sign-up form (hash link must be in place)
        // setting up the jobTitleID value in the signup data
        if (app.model.userProfile.data.isAnonymous()) {
            this.setSignupJobTitle(jobTitle.jobTitleID());
        }
        else {
            // For logged users, assist them to add the job title:
            e.preventDefault();
            e.stopImmediatePropagation();

            var url = 'addJobTitles?s=' + encodeURIComponent(jobTitle.singularName()) + '&id=' + encodeURIComponent(jobTitle.jobTitleID());
            app.shell.go(url);
        }
    }.bind(this);
    this.search().onClickNoJobTitle = function(jobTitleName, e) {
        // For anonymous users, we just
        // let the link to scroll down to sign-up form (hash link must be in place)
        // settingup the jobTitleName value in the signup data
        // (and reset any previous ID just in case)
        if (app.model.userProfile.data.isAnonymous()) {
            this.setSignupJobTitle(null, jobTitleName);
        }
        else {
            // For logged users, assist them to add the job title:
            e.preventDefault();
            e.stopImmediatePropagation();
            // Go to addJobTitles
            var url = 'addJobTitles?s=' + encodeURIComponent(jobTitleName) + '&autoAddNew=true';
            app.shell.go(url);
        }
    }.bind(this);
    this.search().jobTitleHref('#learnMoreProfessionals-signup');
    this.search().noJobTitleHref('#learnMoreProfessionals-signup');
}
