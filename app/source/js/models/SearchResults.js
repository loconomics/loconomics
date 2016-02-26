/** Search Results model.
 **/
'use strict';

var Model = require('./Model'),
    JobTitleSearchResult = require('./JobTitleSearchResult'),
    ServiceProfessionalSearchResult = require('./ServiceProfessionalSearchResult'),
    CategorySearchResult = require('./CategorySearchResult');

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
}

module.exports = SearchResults;