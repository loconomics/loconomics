/** Thread model.

    Describes a thread of messages.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Message = require('./Message');

function Thread(values) {
    
    Model(this);

    this.model.defProperties({
        threadID: 0,
        
        customerUserID: null,
        freelancerUserID: null,
        jobTitleID: null,
        statusID: null,
        subject: null,
        
        createdDate: null,
        updatedDate: null        
    }, values);
    
    this.messages = ko.observableArray([]);
    if (values && values.messages) {
        this.messages(values.messages.map(function(msg) {
            return new Message(msg);
        }));
    }
}

module.exports = Thread;
