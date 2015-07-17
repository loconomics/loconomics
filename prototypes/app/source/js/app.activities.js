/**
    List of activities loaded in the App,
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

var Activity = require('./components/Activity');
var EmptyActivity = Activity.extends(function EmptyActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSectionNavBar();
});

module.exports = {
    '_test': EmptyActivity,
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker'),
    'clients': require('./activities/clients'),
    'freelancerPricing': require('./activities/freelancerPricing'),
    'serviceAddresses': require('./activities/serviceAddresses'),
    'textEditor': require('./activities/textEditor'),
    'home': require('./activities/home'),
    'appointment': require('./activities/appointment'),
    'index': require('./activities/index'),
    'login': require('./activities/login'),
    'logout': require('./activities/logout'),
    'learnMore': require('./activities/learnMore'),
    'signup': require('./activities/signup'),
    'contactInfo': require('./activities/contactInfo'),
    'welcome': require('./activities/welcome'),
    'addressEditor': require('./activities/addressEditor'),
    'account': require('./activities/account'),
    'inbox': require('./activities/inbox'),
    'conversation': require('./activities/conversation'),
    'scheduling': require('./activities/scheduling'),
    'jobtitles': require('./activities/jobtitles'),
    'feedback': require('./activities/feedback'),
    'faqs': require('./activities/faqs'),
    'feedbackForm': require('./activities/feedbackForm'),
    'contactForm': require('./activities/contactForm'),
    'cms': require('./activities/cms'),
    'clientEditor': require('./activities/clientEditor'),
    'schedulingPreferences': require('./activities/schedulingPreferences'),
    'calendarSyncing': require('./activities/calendarSyncing'),
    'weeklySchedule': require('./activities/weeklySchedule'),
    'bookMeButton': require('./activities/bookMeButton'),
    'ownerInfo': require('./activities/ownerInfo'),
    'privacySettings': require('./activities/privacySettings'),
    'addJobTitles': require('./activities/addJobTitles'),
    'freelancerPricingEditor': require('./activities/freelancerPricingEditor'),
    'marketplaceProfile': require('./activities/marketplaceProfile'),
    'marketplaceJobtitles': require('./activities/marketplaceJobtitles'),
    'profilePictureBio': require('./activities/profilePictureBio'),
    'servicesOverview': require('./activities/servicesOverview'),
    'verifications': require('./activities/verifications'),
    'education': require('./activities/education'),
    'freelancerWebsite': require('./activities/freelancerWebsite'),
    'backgroundCheck': require('./activities/backgroundCheck'),
    'educationForm': require('./activities/educationForm'),
    'cancellationPolicy': require('./activities/cancellationPolicy'),
    'licensesCertifications': require('./activities/licensesCertifications'),
    'licensesCertificationsForm': require('./activities/licensesCertificationsForm')
};
