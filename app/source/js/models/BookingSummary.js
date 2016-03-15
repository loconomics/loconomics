/** BookingSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');
    
function BookingSummary(values) {
    
    Model(this);

    // Only actual data as properties,
    // configuration values goes in manual observables later
    this.model.defProperties({
        quantity: 0,
        concept: '',
        time: { isDate: true },
        timeFormat: ' [@] h:mma'
    }, values);
    
   // this.concept = ko.observable(values && values.concept);
   // this.timeFormat = ko.observable(values && values.timeFormat);

    this.phrase = ko.pureComputed(function(){
        var t = this.timeFormat() && 
            this.time() && 
            moment(this.time()).format(this.timeFormat()) ||
            '';        
        return this.concept() + t;
    }, this);

    this.url = ko.pureComputed(function() {
        var url = this.time() &&
            '/calendar/' + this.time().toISOString();
        
        return url;
    }, this);
}

module.exports = BookingSummary;
