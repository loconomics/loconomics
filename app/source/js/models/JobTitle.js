/** JobTitle model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    JobTitlePricingType = require('./JobTitlePricingType');

function JobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        jobTitleID: 0,
        singularName: '',
        pluralName: '',
        aliases: '',
        description: null,
        searchDescription: null,
        createdDate: null,
        updatedDate: null
    }, values);

    this.model.defID(['jobTitleID']);

    // TODO: review if, not registered as a property, the list is updated
    // on syncs by using model.updateWith

    // Pricing Types relationship,
    // collection of JobTitlePricingType entities
    this.pricingTypes = ko.observableArray([]);
    if (values && values.pricingTypes) {
        values.pricingTypes.forEach(function(jobpricing) {
            this.pricingTypes.push(new JobTitlePricingType(jobpricing));
        }.bind(this));
    }
}

module.exports = JobTitle;
