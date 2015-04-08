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
        priceRateUnit: 'hour',
        // Special property, not in source data just only an explicit
        // way to avoid validation of priceRate if not explicit value set
        noPriceRate: false,
        isPhone: false,
        // Array of integers, IDs of serviceAttributes
        serviceAttributes: [],
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['freelancerPricingID']);
    
    // One way effect: set priceRate to null when setting on noPriceRate
    // But nothing on of and no other relations to avoid bade side effects.
    this.noPriceRate.subscribe(function(enabled) {
        if (enabled === true) {
            this.priceRate(null);
        }
    }, this);

    // Alternative edition of the serviceDurationMinutes fields:
    // Splited as hours and minutes
    this.durationHoursPart = ko.pureComputed({
        read: function() {
            var fullMinutes = this.serviceDurationMinutes() |0;
            return (fullMinutes / 60) |0;
        },
        write: function(hours) {
            hours = hours |0;
            var minutes = this.durationMinutesPart() |0;
            this.serviceDurationMinutes(hours * 60 + minutes);
        },
        owner: this
    });
    this.durationMinutesPart = ko.pureComputed({
        read: function() {
            var fullMinutes = this.serviceDurationMinutes() |0;
            return fullMinutes % 60;
        },
        write: function(minutes) {
            minutes = minutes |0;
            var hours = this.durationHoursPart() |0;
            this.serviceDurationMinutes(hours * 60 + minutes);
        },
        owner: this
    });
    
    
    /// Visual representation of several fields
    
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
