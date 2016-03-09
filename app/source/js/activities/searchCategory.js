/**
    Category Search activity
**/
'use strict';

var 
    JobTitleSearchResult = require('../models/JobTitleSearchResult'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function SearchCategoryActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    //pass in the app model so the view model can use it
    this.viewModel = new ViewModel(this.app.model);
    this.navBar = Activity.createSubsectionNavBar('Back');

});

exports.init = A.init;

// get categoryID from the URL that's passed in from the search results preview
A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    var params = this.requestData.route.segments || [];
    var categoryID = params[0] || '';
    this.viewModel.loadData(categoryID);
};    

function ViewModel(appModel) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.categoryID = ko.observable(); 
    //create an object named JobTitleSearchResult to hold the search results returned from the API
    this.jobTitleSearchResult = new JobTitleSearchResult();
    this.loadData = function(categoryID) {
        this.isLoading(true);
        //Call the get rest API method for api/v1/en-US/search/job-titles/by-category
        return appModel.rest.get('search/job-titles/by-category', {
            categoryID: categoryID, 
            origLat: "37.788479", 
            origLong: "-122.40297199999998",
            searchDistance: "30"
        })
        .then(function(jobTitleSearchResult) {
            if(jobTitleSearchResult){
                //update JobTitleSearchResult object with all the data from the API
                this.jobTitleSearchResult.model.updateWith(jobTitleSearchResult, true);
            }
            else {
                this.jobTitleSearchResult.model.reset();
            }
            this.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.isLoading(false);
        }.bind(this));
    };
           
}
