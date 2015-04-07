/**
    Freelancer Pricing model: manages an individual
    pricing/package from the user and a specific job title.
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    numeral = require('numeral');

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
    
    this.durationText = ko.pureComputed(function() {
        var minutes = this.serviceDurationMinutes() || 0;
        // TODO: l10n
        return minutes ? numeral(minutes).format('0,0') + ' minutes' : '';
    }, this);
    
    this.sessionsAndDuration = ko.pureComputed(function() {
        var sessions = this.numberOfSessions(),
            dur = this.durationText();
        if (sessions > 1)
            return sessions + ', ' + dur;
        else
            return dur;
    }, this);

    this.displayedPrice = ko.pureComputed(function() {
        var price = this.price(),
            rate = this.priceRate(),
            unit = this.priceRateUnit(),
            result = price || rate;
        // Formatting
        result = numeral(result).format('$0,0');
        // If is not price but rate, add unit
        if (!price && rate && unit) {
            result += '/' + unit;
        }
        return result;
    }, this);
}

module.exports = FreelancerPricing;
