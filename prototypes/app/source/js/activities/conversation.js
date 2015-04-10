/**
    Conversation activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ConversationActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Inbox', {
        backLink: 'inbox'
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Reset
    this.viewModel.threadID(0);
    this.viewModel.thread(null);

    // Params
    var params = state && state.route && state.route.segments || [],
        threadID = params[0] |0;

    this.viewModel.threadID(threadID);
    
    // Load the data
    if (threadID) {
        this.viewModel.thread.sync(threadID)
        .catch(function(err) {
            this.app.modals.showError({
                title: 'Error loading conversation',
                error: err
            }).then(function() {
                this.app.shell.goBack();
            }.bind(this));
        }.bind(this));
    }
    else {
        this.app.modals.showError({
            title: 'Conversation Not Found'
        }).then(function() {
            this.app.shell.goBack();
        }.bind(this));
    }
};

var ko = require('knockout');

function ViewModel(app) {

    this.isLoading = app.model.messaging.state.isLoading;
    this.isSyncing = app.model.messaging.state.isSyncing;
    this.isSaving = app.model.messaging.state.isSaving;

    this.threadID = ko.observable(null);
    this.thread = app.model.messaging.createWildcardItem();

    this.subject = ko.pureComputed(function() {
        var m = this.thread();
        return (
            this.isLoading() ?
                'Loading...' :
                m && (m.subject() || '').replace(/^\s+|\s+$/g, '') || 'Conversation without subject'
        );
    }, this);
}
