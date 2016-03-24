/** BookingSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');

function BookingSummary(values) {
    
    Model(this);

    this.model.defProperties({
        quantity: 0,
        concept: '',
        time: { isDate: true },
        timeFormat: ' [@] h:mma'
    }, values);
    
    this.timePhrase = ko.pureComputed(function() {
        return (
            this.timeFormat() && 
            this.time() && 
            moment(this.time()).format(this.timeFormat()) ||
            ''
        );
    }, this);

    this.phrase = ko.pureComputed(function(){
        return this.concept() + this.timePhrase();
    }, this);

    this.url = ko.pureComputed(function() {
        var url = this.time() &&
            '/calendar/' + this.time().toISOString();
        
        return url;
    }, this);
}

module.exports = BookingSummary;
