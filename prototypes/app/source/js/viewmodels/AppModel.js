/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    $ = require('jquery'),
    Model = require('../models/Model'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage');

function AppModel() {

    Model(this);
    
    this.userProfile = require('./AppModel.userProfile').create(this);
    // NOTE: Alias for the user data
    // TODO:TOREVIEW if continue to makes sense to keep this 'user()' alias, document
    // where is used and why is preferred to the canonical way.
    this.user = ko.computed(function() {
        return this.userProfile.data;
    }, this);

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
    this.appointments = require('./AppModel.appointments').create(this);
    this.serviceAddresses = require('./AppModel.serviceAddresses').create(this);
}

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
                // attempt, and lazily request updated data from remote
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
                }.bind(this), resolveAnyway);
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
        
        this.rest = new Rest(config.siteUrl + '/api/v1/en-US/');
        
        // Setup Rest authentication
        this.rest.onAuthorizationRequired = function(retry) {

            this.tryLogin()
            .then(function() {
                // Logged! Just retry
                retry();
            });
        }.bind(this);
        
        // Initialize: check the user has login data and needed
        // cached data, return its promise
        return this.loadLocalCredentials();
    }.bind(this));
};

module.exports = AppModel;

// Class splited in different files to mitigate size and organization
// but keeping access to the common set of methods and objects easy with
// the same class.
// Loading extensions:
require('./AppModel-events').plugIn(AppModel);

