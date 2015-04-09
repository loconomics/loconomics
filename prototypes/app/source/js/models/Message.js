/** Message model.

    Describes a message that belongs to a Thread.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');

function Message(values) {
    
    Model(this);

    this.model.defProperties({
        messageID: 0,
        threadID: 0,
        sentByUserID: null,
        typeID: null,
        auxT: null,
        auxID: null,
        bodyText: '',
        
        createdDate: null,
        updatedDate: null
    }, values);
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        return moment(this.createdDate()).locale('en-US-LC').calendar();
    }, this);
    
    this.displayedTime = ko.pureComputed(function() {
        return moment(this.createdDate()).locale('en-US-LC').format('LT');
    }, this);
}

module.exports = Message;
