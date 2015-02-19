/**
    Jobtitles activity
**/
'use strict';

var singleton = null,
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');

exports.init = function initJobtitles($activity, app) {

    if (singleton === null)
        singleton = new JobtitlesActivity($activity, app);
    
    return singleton;
};

function JobtitlesActivity($activity, app) {
    
    this.accessLevel = app.UserType.LoggedUser;

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack.model.clone({
            text: 'Scheduling'
        }),
        rightAction: NavAction.goHelpIndex
    });
}

JobtitlesActivity.prototype.show = function show(options) {

};

function ViewModel() {
}
