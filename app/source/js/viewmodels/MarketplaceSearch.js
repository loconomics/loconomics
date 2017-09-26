/**
 * Helper ViewModel class, to reuse across related components, that performs
 * searchs in the marketplace (fetching job titles, service professionals,
 * search categories) automatically on parameters changes; it exposes properties
 * for the parameters, to be linked to form input.
 *
 * NOTE: Combined and replaced code from /viewmodels/SearchJobTitlesVM.js (deleted)
 * and /activities/home.js (code removed), but is mostly the same
 *
 * TODO jsdocs
 * TODO searchTerm removal, replaced by value
 */
'use strict';
var ko = require('knockout');
var search = require('../data/search');
var SearchResults = require('../models/SearchResults');

/**
 * Minimun text length required to perform a search
 * @type {number}
 */
var MIN_LENGTH = 3;

module.exports = function MarketplaceSearchVM() {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable();
    // Alias (Recommended new name to use)
    this.value = this.searchTerm;
    // Coordinates
    this.lat = ko.observable(search.DEFAULT_LOCATION.lat);
    this.lng = ko.observable(search.DEFAULT_LOCATION.lng);
    this.city = ko.observable();
    this.searchDistance = ko.observable(search.DEFAULT_LOCATION.searchDistance);
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();

    /**
     * @member {KnockoutComputed<string>} queryTerm Gets a valid query term to
     * perform a search, otherwise null.
     * It's valid if there is a value and meets the minimum length.
     */
    this.queryTerm = ko.pureComputed(function() {
        var s = this.value();
        return s && s.length >= MIN_LENGTH ? s : null;
    }, this);

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
        .catch(function(err) {
            this.isLoading(false);
            if (err && err.statusText === 'abort') return null;
        }.bind(this));
    };
    //creates a handler function for the html search button (event)
    this.search = function() {
        //creates a variable for the search term to check to see when a user enters more than 2 characters, we'll auto-load the data.
        var s = this.queryTerm();
        if(s) {
            this.loadData(s, this.lat(), this.lng());
        }
        else {
            this.searchResults.model.reset();
        }
    };

    // Auto-search on user typing but throttling it to prevent too much requests
    // that undermine performance.
    // It performs the search one has passed a timeout from latest keystroke
    ko.computed(function() {
        this.search();
    },this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 120 } });
};
