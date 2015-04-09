/** Message model.

    Describes a message from a MailFolder.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');

function MessageView(values) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        createdDate: null,
        updatedDate: null,
        
        subject: '',
        content: null,
        link: '#',

        actionIcon: null,
        actionText: null,
        
        classNames: ''

    }, values);
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedTime = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').format('LT');
        
    }, this);
}

module.exports = MessageView;

/**
    Creates a MessageView instance from a Thread instance.
    It's better to have almost one message in the thread (the latest
    one first, or the one to highlight) to build a
    more detailed MessageView
**/
MessageView.fromThread = function(thread) {
    
    var msg = thread.messages();
    msg = msg && msg[0] || null;
    
    return new MessageView({
        id: thread.threadID(),
        createdDate: thread.createdDate(),
        updatedDate: thread.updatedDate(),
        subject: thread.subject(),
        content: msg && msg.bodyText() || '',
        link: '#!/conversation/' + thread.threadID(),
        actionIcon: 'glyphicon glyphicon-share-alt',
        actionText: '' // Example: 'ListView-item--tag-warning'
    });
};
