/**
    Upgrade activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function UpgradeActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;

    this.navBar = new Activity.NavBar({
        title: null,
        leftAction: Activity.NavAction.menuIn
        // NOTE: Removed as of #726 until a new menu for it is implemented as of #191 child issues.
        //rightAction: Activity.NavAction.menuNewItem
    });
    this.title('Become a member of Loconomics');
});

exports.init = A.init;
