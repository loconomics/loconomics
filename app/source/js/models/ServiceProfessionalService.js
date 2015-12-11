/**
    ServiceProfessionalService model: manages an individual
    service from the user and a specific job title.
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    numeral = require('numeral');

function ServiceProfessionalService(values) {
    
    Model(this);
    
    this.model.defProperties({
        serviceProfessionalServiceID: 0,
        serviceProfessionalUserID: 0,
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
    
    this.model.defID(['serviceProfessionalServiceID']);
    
    // One way effect: set priceRate to null when setting on noPriceRate
    // But nothing on off and no other relations to avoid bad side effects.
    this.noPriceRate.subscribe(function(enabled) {
        if (enabled === true) {
            this.priceRate(null);
        }
    }, this);
    
    /**
        Ask for a refresh of the noPriceRate, that must be 'true' if the record exists and
        has no priceRate (to remember the previous value set by the user about noPriceRate).
        It ensure that the internal timestamp keep untouched.
        Cannot be automatic, so need to be called manually after a data load that does not
        want to reflect this change as a data change.
    **/
    this.refreshNoPriceRate = function refreshNoPriceRate() {
        // Not To State Price Rate: if is a saved pricing, mark the noPriceRate if price rate is
        // null or 0; cannot be done with a subscription on priceRate changes because will have
        // the bad side effect of auto mark noPriceRate on setting 0 on priceRate, breaking the
        // explicit purpose of the noPriceRate checkbox:
        if (this.serviceProfessionalServiceID() && (this.priceRate() |0) <= 0) {
            var ts = this.model.dataTimestamp();
            this.noPriceRate(true);
            // Set again timestamp so the model appear as untouched.
            this.model.dataTimestamp(ts);
        }
    };

    // Alternative edition of the serviceDurationMinutes fields:
    // Splited as hours and minutes
    var is = require('is_js');
    this.durationHoursPart = ko.pureComputed({
        read: function() {
            var fullMinutes = this.serviceDurationMinutes();
            
            if (is.not.number(fullMinutes))
                return null;

            return ((fullMinutes|0) / 60) |0;
        },
        write: function(hours) {
            var minutes = this.durationMinutesPart() |0;
            // Value comes from text
            hours = parseInt(hours, 10);
            if (is.not.number(hours))
                this.serviceDurationMinutes(null);
            else
                this.serviceDurationMinutes((hours|0) * 60 + minutes);
        },
        owner: this
    });
    this.durationMinutesPart = ko.pureComputed({
        read: function() {
            var fullMinutes = this.serviceDurationMinutes();

            if (is.not.number(fullMinutes))
                return null;

            return (fullMinutes|0) % 60;
        },
        write: function(minutes) {
            var hours = this.durationHoursPart() |0;
            // Value comes from text
            minutes = parseInt(minutes, 10);
            if (is.not.number(minutes))
                this.serviceDurationMinutes(null);
            else
                this.serviceDurationMinutes(hours * 60 + (minutes|0));
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
            // TODO: l10n
            return sessions + ' sessions, ' + dur;
        else
            return dur;
    }, this);

    this.displayedPrice = ko.pureComputed(function() {
        var price = this.price(),
            rate = this.priceRate(),
            unit = this.priceRateUnit(),
            result;
        // Formatting
        if (price)
            result = numeral(price).format('$0,0.00');
        else
            result = numeral(rate).format('$0');
        // If is not price but rate, add unit
        if (!price && rate && unit) {
            result += '/' + unit;
        }
        return result;
    }, this);
    
    this.displayedDurationAndPrice = ko.pureComputed(function() {
        var dur = this.sessionsAndDuration();
        var pr = this.displayedPrice();
        if (dur && pr)
            return dur + ', ' + pr;
        else
            return dur || pr;
    }, this);
}

module.exports = ServiceProfessionalService;
