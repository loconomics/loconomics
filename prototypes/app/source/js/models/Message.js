/** Message model.

    Describes a message that belongs to a Thread.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var Model = require('./Model');

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
}

module.exports = Message;
