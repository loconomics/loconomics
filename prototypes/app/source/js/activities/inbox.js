/**
    Inbox activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var MessageView = require('../models/MessageView');

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
    
    this.threads = ko.pureComputed(function() {
        var t = this.sourceThreads(),
            s = this.searchText();

        if (!t)
            return [];
        else if (!s)
            return t.map(MessageView.fromThread);
        else        
            return t.filter(function(/*thread*/) {
                // TODO search filtering
                return true;
            }).map(MessageView.fromThread);
    }, this);
}
