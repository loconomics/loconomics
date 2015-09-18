/** Message model.

    Describes a message from a MailFolder.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');

function MessageView(values, app) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        createdDate: null,
        updatedDate: null,
        
        subject: '',
        content: null,
        link: '#',
        
        tag: '',
        classNames: '',
        
        sourceThread: null,
        sourceMessage: null

    }, values);
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedTime = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').format('LT');

    }, this);
    
    this.quickDateTime = ko.pureComputed(function() {
        var date = this.createdDate();

        var m = moment(date).locale('en-US-LC'),
            t = moment().startOf('day');

        if (m.isAfter(t)) {
            return m.format('LT');
        }
        else {
            return m.fromNow();
        }
    }, this);
    
    this.customer = ko.computed(function() {
        var s = this.sourceMessage();
        if (!s || !app) return null;

        var cid = s.sentByUserID();
        if (cid) {
            if (cid === app.model.userProfile.data.userID())
                return app.model.userProfile.data;
            else
                return app.model.customers.getObservableItem(cid, true)();
        }
        return null;
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

module.exports = MessageView;

/**
    Creates a MessageView instance from a Thread instance.
    It's better to have almost one message in the thread (the latest
    one first, or the one to highlight) to build a
    more detailed MessageView
**/
MessageView.fromThread = function(app, thread) {
    
    var msg = thread.messages();
    msg = msg && msg[0] || null;
    
    // TODO: more different tag/classes depending on booking state as per design
    // NOTE: That requires to load the booking or request by auxID and wait for it
    var tag, classNames;
    if (msg.auxT() === 'Booking') {
        tag = 'Booking';
        classNames = 'text-success';
    } else if (msg.auxT() === 'BookingRequest') {
        tag = 'Booking request';
        classNames = 'text-warning';
    }
    
    return new MessageView({
        sourceThread: thread,
        sourceMessage: msg,
        id: thread.threadID(),
        createdDate: thread.createdDate(),
        updatedDate: thread.updatedDate(),
        subject: thread.subject(),
        content: msg && msg.bodyText() || '',
        link: '#!/conversation/' + thread.threadID(),
        tag: tag,
        classNames: classNames
    }, app);
};
