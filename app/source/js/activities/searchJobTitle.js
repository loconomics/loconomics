/**
    SearchJobTitle activity
**/
'use strict';

var 
    ServiceProfessionalSearchResult = require('../models/ServiceProfessionalSearchResult'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function SearchJobTitleActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    //pass in the app model so the view model can use it
    this.viewModel = new ViewModel(this.app.model);
    this.navBar = Activity.createSubsectionNavBar('Back');

});

exports.init = A.init;

// get jobTitleID from the URL that's passed in from the search results preview
A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    var params = this.requestData.route.segments || [];
    var jobTitleID = params[0] || '';
    this.viewModel.loadData(jobTitleID);
};    

function ViewModel(appModel) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.jobTitleID = ko.observable(); 
    //create an object named ServiceProfessionalSearchResult to hold the search results returned from the API
    this.serviceProfessionalSearchResult = new ServiceProfessionalSearchResult();
    this.loadData = function(jobTitleID) {
        this.isLoading(true);
        //Call the get rest API method for api/v1/en-US/search/service-professionals/by-job-title
        return appModel.rest.get('search/service-professionals/by-job-title', {
            jobTitleID: jobTitleID, 
            origLat: "37.788479", 
            origLong: "-122.40297199999998",
            searchDistance: "30"
        })
        .then(function(serviceProfessionalSearchResult) {
            if(serviceProfessionalSearchResult){
                //update ServiceProfessionalSearchResult object with all the data from the API
                this.serviceProfessionalSearchResult.model.updateWith(serviceProfessionalSearchResult, true);
            }
            else {
                this.serviceProfessionalSearchResult.model.reset();
            }
            this.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.isLoading(false);
        }.bind(this));
    };
}
