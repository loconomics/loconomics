/**
    Create an Access Control for an app that checks
    the activity property for allowed user level and
    optional custom accessControl.
    To be provided to Shell.js and used by the app.js,
    very tied to that both classes.

    Activities can define an accessLevel
    property like next examples

    this.accessLevel = app.Usertype.user; // anyone
    this.accessLevel = app.UserType.anonymous; // anonymous users only
    this.accessLevel = app.UserType.loggedUser; // authenticated users only

    And optionally, can define an accessControl instance method, receiving
    the route as unique parameter and returning null if allowed, or a
    descriptive object with error information (it's the same signature as
    the accessControl function generated here).
    This custom method will be called only if accessLevel passed succesfully,
    so that can be used as a first barrier.
**/
'use strict';

// UserType enumeration is bit based, so several
// users can has access in a single property
//var UserType = require('../models/User').UserType;
var user = require('../data/userProfile').data;

module.exports = function createAccessControl(app) {

    return function accessControl(route) {

        var activity = app.getActivityControllerByRoute(route);

        var currentType = user.userType();

        if (activity && activity.accessLevel) {

            var can = activity.accessLevel & currentType;

            if (!can) {
                // Notify error, why cannot access
                return {
                    requiredLevel: activity.accessLevel,
                    currentType: currentType
                };
            }
            // Custom control?
            else if(activity.accessControl) {
                return activity.accessControl(route);
            }
        }

        // Allow
        return null;
    };
};
