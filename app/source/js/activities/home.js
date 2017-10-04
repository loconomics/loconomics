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
var ActionForValue = require('../kocomponents/home/search-box').ActionForValue;
require('../kocomponents/location-autocomplete');

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

function ViewModel(shell) {
    // Inherits
    MarketplaceSearchVM.call(this);

    this.getJobTitleUrl = function(id) {
        return '/searchJobTitle/' + id + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
    }.bind(this);
    this.getServiceProfessionalUrl = function(id) {
        return '/profile/' + id;
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
