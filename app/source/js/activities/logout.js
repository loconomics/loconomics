/**
    Logout activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').data;

var A = Activity.extend(function LogoutActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.app.model.logout().then(function() {
        // Anonymous user again
        var newAnon = user.constructor.newAnonymous();
        user.model.updateWith(newAnon);

        // Go index
        this.app.shell.go('/');

    }.bind(this));
};
