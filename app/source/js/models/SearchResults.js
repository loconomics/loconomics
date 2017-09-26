/** Search Results model.
 **/
'use strict';

var Model = require('./Model');
var JobTitleSearchResult = require('./JobTitleSearchResult');
var ServiceProfessionalSearchResult = require('./ServiceProfessionalSearchResult');
var CategorySearchResult = require('./CategorySearchResult');
var ko = require('knockout');

function SearchResults(values) {
    //Calling Model and passing in the arrays using the defProperties method. The properties will be a ko observable using defProperties.
    Model(this);

    this.model.defProperties({
        jobTitles: {
            isArray: true,
            Model: JobTitleSearchResult
        },
        serviceProfessionals: {
            isArray: true,
            Model: ServiceProfessionalSearchResult
        },
        categories: {
            isArray: true,
            Model: CategorySearchResult
        },
    }, values);

    this.length = ko.pureComputed(function() {
        return this.jobTitles().length + this.serviceProfessionals().length + this.categories().length;
    }, this);
}

module.exports = SearchResults;