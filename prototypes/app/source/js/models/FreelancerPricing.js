/**
    Freelancer Pricing model: manages an individual
    pricing/package from the user and a specific job title.
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

function FreelancerPricing(values) {
    
    Model(this);
    
    this.model.defProperties({
        freelancerPricingID: 0,
        freelancerUserID: 0,
        jobTitleID: 0,
        pricingTypeID: 0,
        name: '',
        description: null,
        price: null,
        serviceDurationMinutes: null,
        firstTimeClientsOnly: false,
        numberOfSessions: 1,
        priceRate: null,
        priceRateUnit: null,
        isPhone: false,
        // Array of integers, IDs of serviceAttributes
        serviceAttributes: [],
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['freelancerPricingID']);
    
    this.durationText = ko.computed(function() {
        var minutes = this.serviceDurationMinutes() || 0;
        // TODO: Formatting, localization
        return minutes ? minutes + ' minutes' : '';
    }, this);
}

module.exports = FreelancerPricing;
