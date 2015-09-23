/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    $ = require('jquery'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage'),
    EventEmitter = require('events').EventEmitter;

function AppModel() {
    EventEmitter.call(this);
    this.setMaxListeners(30);
}

AppModel._inherits(EventEmitter);

module.exports = AppModel;

require('./AppModel-account').plugIn(AppModel);

/**
    Load credentials from the local storage, without error if there is nothing
    saved. If load profile data too, performing an tryLogin if no local data.
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
                this.rest.extraHeaders = {
                    alu: credentials.userID,
                    alk: credentials.authKey
                };
                
                // It has credentials! Has basic profile data?
                // NOTE: the userProfile will load from local storage on this first
                // attempt, and lazily request updated data from remote so we need
                // to catch remote errors with events
                this.userProfile.once('error', function(err) {
                    this.emit('error', {
                        message: 'Impossible to load your data. Please check your Internet connection',
                        error: err
                    });
                }.bind(this));
                
                this.userProfile.load().then(function(profile) {
                    if (profile) {
                        // There is a profile cached                    
                        // End succesfully
                        resolve();
                    }
                    else {
                        // No profile, we need to request it to be able
                        // to work correctly, so we
                        // attempt a login (the tryLogin process performs
                        // a login with the saved credentials and fetch
                        // the profile to save it in the local copy)
                        this.tryLogin().then(resolve, resolveAnyway);
                    }
                }.bind(this), resolveAnyway)
                // The error event catch any error if happens, so avoid uncaught exceptions
                // in the console by catching the promise error
                .catch(function() { });
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
    
    // Local data
    // TODO Investigate why automatic selection an IndexedDB are
    // failing and we need to use the worse-performance localstorage back-end
    localforage.config({
        name: 'LoconomicsApp',
        version: 0.1,
        size : 4980736, // Size of database, in bytes. WebSQL-only for now.
        storeName : 'keyvaluepairs',
        description : 'Loconomics App',
        driver: localforage.LOCALSTORAGE
    });
    
    // First, get any saved local config
    // NOTE: for now, this is optional, to get a saved siteUrl rather than the
    // default one, if any.
    return localforage.getItem('config')
    .then(function(config) {
        // Optional config
        config = config || {};
        
        if (config.siteUrl) {
            // Update the html URL
            $('html').attr('data-site-url', config.siteUrl);
        }
        else {
            config.siteUrl = $('html').attr('data-site-url');
        }
        
        this.config = config;
        this.rest = new Rest(config.siteUrl + '/api/v1/en-US/');
        
        // Setup Rest authentication
        this.rest.onAuthorizationRequired = function(retry) {

            this.tryLogin()
            .then(function() {
                // Logged! Just retry
                retry();
            });
        }.bind(this);
        
        // With config loaded and REST ready, load all modules
        this.loadModules();
        
        // Initialize: check the user has login data and needed
        // cached data, return its promise
        return this.loadLocalCredentials();
    }.bind(this));
};

AppModel.prototype.loadModules = function loadModules() {

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
    this.simplifiedWeeklySchedule = require('./AppModel.simplifiedWeeklySchedule').create(this);
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
    this.licensesCertifications = require('./AppModel.licensesCertifications').create(this);
    this.users = require('./AppModel.users').create(this);
    //UNSTABLE:this.availability = require('./AppModel.availability').create(this);
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
