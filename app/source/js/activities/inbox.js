/**
    Inbox activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout'),
    MessageView = require('../models/MessageView'),
    textSearch = require('../utils/textSearch');

var messaging = require('../data/messaging');
var showError = require('../modals/error').show;

var A = Activity.extend(function InboxActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Your Inbox');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Messages
    messaging.getList()
    .then(function(threads) {
        this.viewModel.sourceThreads(threads());
    }.bind(this))
    .catch(function(err) {
        showError({
            title: 'Error loading messages',
            error: err
        });
    });
};

function ViewModel(app) {

    this.isLoading = messaging.state.isLoading;
    this.isSyncing = messaging.state.isSyncing;

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
            return t.map(MessageView.fromThread.bind(null, app));
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
            }).map(MessageView.fromThread.bind(null, app));
    }, this);
}
