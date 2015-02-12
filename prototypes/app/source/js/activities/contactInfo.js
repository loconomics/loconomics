/**
    ContactInfo activity
**/
'use strict';

var singleton = null,
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

exports.init = function initContactInfo($activity, app) {

    if (singleton === null)
        singleton = new ContactInfoActivity($activity, app);
    
    return singleton;
};

function ContactInfoActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;
    
    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack.model.clone({
            text: 'Account'
        }),
        rightAction: NavAction.goHelpIndex
    });
}

ContactInfoActivity.prototype.show = function show(options) {

};
