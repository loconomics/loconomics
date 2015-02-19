/**
    Scheduling activity
**/
'use strict';

var singleton = null,
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');

exports.init = function initScheduling($activity, app) {

    if (singleton === null)
        singleton = new SchedulingActivity($activity, app);
    
    return singleton;
};

function SchedulingActivity($activity, app) {
    
    this.accessLevel = app.UserType.LoggedUser;

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: 'Scheduling',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
}

SchedulingActivity.prototype.show = function show(options) {

};

function ViewModel() {

}
