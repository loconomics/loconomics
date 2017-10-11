/**
    Professionals Payment Preference activity

    IMPORTANT: At template we are using activity.isShown to enable components at the template,
    their set-up is simplified by being re-created every time the
    activity is displayed and disposed when hidden (this prevents from
    needing reset/discard/show-hide-detection logics at component level;
    they does init at constructor and implement 'dispose' method).
**/
'use strict';

var Activity = require('../components/Activity');
require('../kocomponents/payout/preference-view');

var A = Activity.extend(function PaymentPreferenceActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account',
        helpLink: this.helpLink
    });
    this.title = 'Payout preferences';
    this.onSaved = function() {
        this.app.successSave();
    }.bind(this);
});

exports.init = A.init;
