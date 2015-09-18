/** Thread model.

    Describes a thread of messages.
 **/
'use strict';

var Model = require('./Model'),
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
        
        messages: {
            isArray: true,
            Model: Message
        },
        
        createdDate: null,
        updatedDate: null        
    }, values);
}

module.exports = Thread;
