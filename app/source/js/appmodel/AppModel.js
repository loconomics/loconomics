/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout');
var localforage = require('../data/drivers/localforage');
var EventEmitter = require('events').EventEmitter;

function AppModel() {
    EventEmitter.call(this);
    this.setMaxListeners(50);
}

AppModel._inherits(EventEmitter);

module.exports = AppModel;

require('./AppModel-account').plugIn(AppModel);

/**
    Load credentials from the local storage, without error if there is nothing
    saved. It loads profile data too.
**/
AppModel.prototype.loadLocalCredentials = function loadLocalCredentials() {
    return new Promise(function(resolve) { // Never rejects: , reject) {

        // Callback to just resolve without error (passing in the error
        // to the 'resolve' will make the process to fail),
        // since we don't need to create an error for the
        // app init, if there is not enough saved information
        // the app has code to request a login.
        var resolveAnyway = function(doesnMatter){
            console.warning('App Model Init err', doesnMatter);
            resolve();
        };

        // If there are credentials saved
        localforage.getItem('credentials').then(function(credentials) {

            if (credentials &&
                credentials.userID &&
                credentials.username &&
                credentials.authKey) {

                // use authorization key for each
                // new Rest request
                this.rest.setAuthorization('LC alu=' + credentials.userID + ',alk=' + credentials.authKey);
                // Load User Profile, from local with server fallback and server synchronization, silently
                this.userProfile.load().then(resolve, resolveAnyway);

                // Google Analytics
                if (window.ga) {
                    if (window.cordova) {
                        window.ga.setUserId(credentials.userID);
                    }
                    else {
                        window.ga('set', 'userId', credentials.userID);
                    }
                }
            }
            else {
                // End successfully. Not loggin is not an error,
                // is just the first app start-up
                resolve();
            }
        }.bind(this), resolveAnyway);
    }.bind(this));
};

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
    return this.loadLocalCredentials();
};

AppModel.prototype.loadModules = function loadModules() {
    //jshint maxstatements: 80

    this.userProfile = require('./AppModel.userProfile').create(this);
    // NOTE: Alias for the user data
    // TODO:TOREVIEW if continue to makes sense to keep this 'user()' alias, document
    // where is used and why is preferred to the canonical way.
    this.user = ko.computed(function() {
        return this.userProfile.data;
    }, this);

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

/**
    Clear the local stored data, but with careful for the special
    config data that is kept.
**/
AppModel.prototype.clearLocalData = function clearLocalData() {
    // Get config
    return localforage.getItem('config')
    .then(function(config) {
        // Clear all
        localforage.clear();

        if (config) {
            // Set config again
            localforage.setItem('config', config);
        }

        // Trigger notification, so other components
        // can make further clean-up or try synchronizations,
        // for example to clean-up in-memory cache.
        this.emit('clearLocalData');
    }.bind(this));
};
