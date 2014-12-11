/** Appointment model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client'),
    Location = require('./Location');

function Appointment(values) {
    
    Model(this);

    this.model.defProperties({
        startTime: null,
        endTime: null,
        
        subtotalPrice: 0,
        feePrice: 0,
        pfeePrice: 0,
        totalPrice: 0,
        ptotalPrice: 0,
        
        pricing: {}, // TODO future Pricing model
        pricingSummary: '', // TODO Future computed from pricing fields
        
        notesToClient: '',
        notesToSelf: ''
    }, values);
    
    values = values || {};

    this.client = ko.observable(new Client(values.client));
    this.location = ko.observable(new Location(values.location));
    
    this.locationSummary = ko.computed(function() {
        return this.location().singleLine();
    }, this);
}

module.exports = Appointment;
