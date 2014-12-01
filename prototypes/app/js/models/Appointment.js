/** Appointment model **/
'use strict';

var ko = require('knockout');

var Client = require('./Client');

function Appointment(def) {
    
    def = def || {};
    
    this.startTime = ko.observable(def.startTime);
    this.endTime = ko.observable(def.endTime);
    
    this.subtotalPrice = ko.observable(def.subtotalPrice);
    this.feePrice = ko.observable(def.feePrice);
    this.pfeePrice = ko.observable(def.pfeePrice);
    this.totalPrice = ko.observable(def.totalPrice);
    this.ptotalPrice = ko.observable(def.ptotalPrice);
    
    this.client = ko.observable(new Client(def.client));
    
    this.pricing = ko.observable(def.pricing);
    this.pricingSummary = ko.observable(def.pricingSummary);
    
    this.location = ko.observable(def.location);
    this.locationSummary = ko.observable(def.locationSummary);
    
    this.notesToClient = ko.observable(def.notesToClient);
    this.notesToSelf = ko.observable(def.notesToSelf);
}

module.exports = Appointment;
