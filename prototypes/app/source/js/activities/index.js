/**
    Index activity
**/
'use strict';

var singleton = null,
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

exports.init = function initIndex($activity, app) {

    if (singleton === null)
        singleton = new IndexActivity($activity, app);
    
    return singleton;
};

function IndexActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: NavAction.goLogin,
        rightAction: NavAction.menuOut
    });
    
    // Any user can access this
    this.accessLevel = null;
}

IndexActivity.prototype.show = function show(options) {
    // It checks if the user is logged so then 
    // their 'logged index' is the dashboard not this
    // page that is focused on anonymous users
    if (!this.app.model.user().isAnonymous()) {
        this.app.goDashboard();
    }
};
