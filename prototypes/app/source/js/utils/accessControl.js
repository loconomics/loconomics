/**
    Create an Access Control for an app that just checks
    the activity property for allowed user level.
    To be provided to Shell.js and used by the app.js,
    very tied to that both classes.
    
    Activities can define on its object an accessLevel
    property like next examples
    
    this.accessLevel = app.Usertype.User; // anyone
    this.accessLevel = app.UserType.Anonymous; // anonymous users only
    this.accessLevel = app.UserType.LoggedUser; // authenticated users only
**/
'use strict';

// UserType enumeration is bit based, so several
// users can has access in a single property
var UserType = require('../models/User').UserType;

module.exports = function createAccessControl(app) {
    
    return function accessControl(activity) {

        var user = app.model.user();
        var currentType = user && user.userType();

        if (activity && typeof(activity.accessLevel) !== 'undefined') {

            return !!(activity.accessLevel & currentType);
        }
        else {
            // On nothing, just allow
            return true;
        }
    };
};
