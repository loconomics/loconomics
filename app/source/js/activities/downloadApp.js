/**
    DownloadApp activity
**/
'use strict';
var Activity = require('../components/Activity');

var A = Activity.extend(function DownloadAppActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.navBar = Activity.createSectionNavBar('Download the App');
    this.navBar.rightAction(null);
    this.title('Download our app');
});

exports.init = A.init;
