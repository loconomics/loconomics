/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var EventEmitter = require('events').EventEmitter;

function AppModel() {
    EventEmitter.call(this);
    this.setMaxListeners(50);
}

AppModel._inherits(EventEmitter);

module.exports = AppModel;

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {

    // First, get any saved local config presets (used before as appModel.config)
    var config = require('../data/appPresets');
    // compat:
    this.config = config;
    this.rest = require('../data/drivers/restClient');

    // With config loaded and REST ready, load all modules
    this.loadModules();

    // Initialize: check the user has login data and needed
    // cached data, return its promise
    var session = require('../data/session');
    return session.loadLocalCredentials();
};

AppModel.prototype.loadModules = function loadModules() {
    //jshint maxstatements: 80

    this.onboarding = require('./AppModel.onboarding').create(this);

    this.schedulingPreferences = require('./AppModel.schedulingPreferences').create(this);
    this.calendarSyncing = require('./AppModel.calendarSyncing').create(this);
    this.weeklySchedule = require('./AppModel.weeklySchedule').create(this);
    this.marketplaceProfile = require('./AppModel.marketplaceProfile').create(this);
    this.homeAddress = require('./AppModel.homeAddress').create(this);
    this.privacySettings = require('./AppModel.privacySettings').create(this);
    this.bookings = require('./AppModel.bookings').create(this);
    this.calendarEvents = require('./AppModel.calendarEvents').create(this);
    this.jobTitles = require('./AppModel.jobTitles').create(this);
    this.userJobProfile = require('./AppModel.userJobProfile').create(this);
    this.calendar = require('./AppModel.calendar').create(this);
    this.serviceAddresses = require('./AppModel.serviceAddresses').create(this);
    this.serviceProfessionalServices = require('./AppModel.serviceProfessionalServices').create(this);
    this.pricingTypes = require('./AppModel.pricingTypes').create(this);
    this.messaging = require('./AppModel.messaging').create(this);
    this.clients = require('./AppModel.clients').create(this);
    this.postalCodes = require('./AppModel.postalCodes').create(this);
    this.feedback = require('./AppModel.feedback').create(this);
    this.education = require('./AppModel.education').create(this);
    this.users = require('./AppModel.users').create(this);
    this.availability = require('./AppModel.availability').create(this);
    this.serviceAttributes = require('./AppModel.serviceAttributes').create(this);
    this.jobTitleServiceAttributes = require('./AppModel.jobTitleServiceAttributes').create(this);
    this.userVerifications = require('./AppModel.userVerifications').create(this);
    this.workPhotos = require('./AppModel.workPhotos').create(this);
    this.userLicensesCertifications = require('./AppModel.userLicensesCertifications').create(this);
    this.statesProvinces = require('./AppModel.statesProvinces').create(this);
    this.paymentAccount = require('./AppModel.paymentAccount').create(this);
    this.clientAppointments = require('./AppModel.clientAppointments').create(this);
    this.jobTitleLicenses = require('./AppModel.jobTitleLicenses').create(this);
    this.licenseCertification = require('./AppModel.licenseCertification').create(this);
    this.clientAddresses = require('./AppModel.clientAddresses').create(this);
    this.cancellationPolicies = require('./AppModel.cancellationPolicies').create(this);
    this.help = require('./AppModel.help').create(this);
    this.paymentPlans = require('./AppModel.paymentPlans').create(this);
    this.userPaymentPlan = require('./AppModel.userPaymentPlan').create(this);
    this.ownerAcknowledgment = require('./AppModel.ownerAcknowledgment').create(this);
    this.userFeePayments = require('./AppModel.userFeePayments').create(this);

    this.emit('modulesLoaded');
};
