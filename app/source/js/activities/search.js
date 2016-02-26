/**
    Search activity
**/
'use strict';

var 
    SearchResults = require('../models/SearchResults'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function SearchActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    //pass in the app model so the view model can use it
    this.viewModel = new ViewModel(this.app.model);
    this.navBar = Activity.createSubsectionNavBar('Back');

});

exports.init = A.init;

function ViewModel(appModel) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable(); 
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();
    this.loadData = function(searchTerm) {
        this.isLoading(true);
        //Call the get rest API method for api/v1/en-US/search
        return appModel.rest.get('search', {
            searchTerm: searchTerm, 
            origLat: "37.788479", 
            origLong: "-122.40297199999998",
            searchDistance: "30"
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
    this.search = function(){
        //creates a variable for the search term to check to see when a user enters more than 4 characters, we'll auto-load the data. 
        var s = this.searchTerm(); 
        if(s && s.length>4){
            this.loadData(s);
        }
    };
    //anything that happens in the computed function after a timeout of 60 seconds, run the code
    ko.computed(function(){
        this.search();
    //add ",this" for ko.computed functions to give context, when the search term changes, only run this function every 60 milliseconds
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 1000 } });
}
