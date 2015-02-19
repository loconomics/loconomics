/**
    Inbox activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initInbox($activity, app) {

    if (singleton === null)
        singleton = new InboxActivity($activity, app);
    
    return singleton;
};

function InboxActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    this.navBar = new NavBar({
        title: 'Inbox',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });

    this.$activity = $activity;
    this.app = app;
    this.$inbox = $activity.find('#inboxList');

    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    setSomeTestingData(this.dataView);

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
}

InboxActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
};

var MailFolder = require('../models/MailFolder');

function ViewModel() {

    this.inbox = new MailFolder({
        topNumber: 20
    });
    
    this.searchText = ko.observable('');
}

/** TESTING DATA **/
function setSomeTestingData(dataView) {
    
    dataView.inbox.messages(require('../testdata/messages').messages);
}
