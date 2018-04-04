/**
    Home activity (aka Search)
    //used to get apisearch results by term, lat, long,
**/
'use strict';
var $ = require('jquery');

var MarketplaceSearchVM = require('../viewmodels/MarketplaceSearch');
var Activity = require('../components/Activity');
var snapPoints = require('../utils/snapPoints');
var user = require('../data/userProfile').data;
//var ActionForValue = require('../kocomponents/home/search-box').ActionForValue;
var ActionForValue = require('../kocomponents/job-title-autocomplete').ActionForValue;
require('../kocomponents/location-autocomplete');
require('../kocomponents/lead-generation/newsletter');
require('../kocomponents/lead-generation/refer');

var A = Activity.extend(function HomeActivity() {

    Activity.apply(this, arguments);
    this.navBar = Activity.createSectionNavBar(null);
    var navBar = this.navBar;
    navBar.additionalNavClasses('AppNav--home');
    this.accessLevel = null;
    this.title('Find and schedule local services.');
    this.viewModel = new ViewModel(this.app.shell);
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
});

exports.init = A.init;

A.prototype._registerSnapPoints = function() {

    var $searchBox = this.$activity.find('#home-jobTitleAutocomplete'); //homeSearch');
    // Calculate the position where search box is completely hidden, and get 1 on the worse case -- bad value coerced to 0,
    // negative result because some lack of data (content hidden)
    var searchPoint = Math.max(1, (
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

function ViewModel(shell) {
    this.isAnonymous = user.isAnonymous;
    // Inherits
    MarketplaceSearchVM.call(this);

    this.getJobTitleUrl = function(id) {
        return '/searchJobTitle/' + id + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
    }.bind(this);
    this.getServiceProfessionalUrl = function(id) {
        return '/listing/' + id;
    }.bind(this);
    this.getSearchCategoryUrl = function(categoryID) {
        return '/searchCategory/' + categoryID + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
    }.bind(this);

    this.onSelect = function(textValue, data) {
        if (!data) return;
        if (data.jobTitleID) {
            shell.go(this.getJobTitleUrl(data.jobTitleID()));
        }
        else if (data.userID) {
            shell.go(this.getServiceProfessionalUrl(data.userID()));
        }
        else if (data.categoryID) {
            shell.go(this.getSearchCategoryUrl(data.categoryID()));
        }
        return {
            value: ActionForValue.clear
        };
    }.bind(this);

    this.onPlaceSelect = function(place) {
        // Save to viewmodel
        this.lat(place.geometry.location.lat());
        this.lng(place.geometry.location.lng());
        this.city(place.formatted_address);
    }.bind(this);
}
