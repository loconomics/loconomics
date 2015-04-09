/**
    Inbox activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout'),
    MessageView = require('../models/MessageView'),
    textSearch = require('../utils/textSearch');

var A = Activity.extends(function InboxActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar('Inbox');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    // Messages
    this.app.model.messaging.getList()
    .then(function(threads) {
        this.viewModel.sourceThreads(threads());
    }.bind(this))
    .catch(function(err) {
        this.app.modals.showError({
            title: 'Error loading messages',
            error: err
        });
    }.bind(this));
};

function ViewModel(app) {
    
    this.isLoading = app.model.messaging.state.isLoading;
    this.isSyncing = app.model.messaging.state.isSyncing;

    this.sourceThreads = ko.observableArray([]);
    
    this.searchText = ko.observable('');
    
    // NOTE: since current API-connection implementation only gets
    // the latest message with getList, the search is done in the
    // bodyText of the last message (additionally to the thread subject)
    // even if this implementation try to iterate all messages.
    this.threads = ko.pureComputed(function() {
        var t = this.sourceThreads(),
            s = this.searchText();

        if (!t)
            return [];
        else if (!s)
            return t.map(MessageView.fromThread);
        else        
            return t.filter(function(thread) {
                var found = false;
                
                // Check subject
                found = textSearch(s, thread.subject());
                
                if (!found) {
                    // Try content of messages
                    // It stops on first 'true' result
                    thread.messages().some(function(msg) {
                        found = textSearch(s, msg.bodyText());
                        return found;
                    });
                }
                
                return found;
            }).map(MessageView.fromThread);
    }, this);
}
