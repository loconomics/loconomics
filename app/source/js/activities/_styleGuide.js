/**
    _styleGuide activity
**/
'use strict';

require('../kocomponents/utilities/icon-dec.js');
var Activity = require('../components/Activity');

var A = Activity.extend(function _styleGuideActivity() {

    Activity.apply(this, arguments);
    this.accessLevel = this.app.UserType.loggedUser;
 });

exports.init = A.init;
