/**
 * Helper ViewModel class, to reuse across related components, that performs
 * searchs in the marketplace (fetching job titles, service professionals,
 * search categories) automatically on parameters changes; it exposes properties
 * for the parameters, to be linked to form input.
 *
 * NOTE: Based on original code at /viewmodels/SearchJobTitlesVM.js and
 * /activities/home.js
 * (it expects to replace/combine them).
 */
'use strict';
var ko = require('knockout');
var search = require('../data/search');
var SearchResults = require('../models/SearchResults');

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
        var s = this.searchTerm();
        if(s && s.length > 2) {
            this.loadData(s, this.lat(), this.lng());
        }
        else {
            this.searchResults.model.reset();
        }
    };
    //anything that happens in the computed function after a timeout of 60 seconds, run the code
    ko.computed(function() {
        this.search();
    //add ",this" for ko.computed functions to give context, when the search term changes, only run this function every 60 milliseconds
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 300 } });
};
