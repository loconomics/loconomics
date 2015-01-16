/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    Model = require('../models/Model'),
    User = require('../models/User'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage');

function AppModel(values) {

    Model(this);
    
    this.model.defProperties({
        user: User.newAnonymous()
    }, values);
}

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {
    
    // NOTE: URL to be updated
    //this.rest = new Rest('http://dev.loconomics.com/en-US/rest/');
    this.rest = new Rest('http://localhost/source/en-US/rest/');
    
    // Setup Rest authentication
    this.rest.onAuthorizationRequired = function(retry) {
        
        this.tryLogin()
        .then(function() {
            // Logged! Just retry
            retry();
        });
    }.bind(this);
    
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

    // First attempt to login from saved credentials
    return new Promise(function(resolve, reject) {
        // We just want to check if can get logged.
        // Any result, just return success:
        this.tryLogin().then(resolve, function(doesnMatter){
            // just resolve without error (passing in the error
            // will make the process to fail)
            resolve();
        });
    }.bind(this));
};

/**
    Account methods
**/
AppModel.prototype.tryLogin = function tryLogin() {
    // Get saved credentials
    return localforage.getItem('credentials')
    .then(function(credentials) {
        // If we have ones, try to log-in
        if (credentials) {
            // Attempt login with that
            return this.login(
                credentials.username,
                credentials.password
            );
        } else {
            throw new Error('No saved credentials');
        }
    }.bind(this));
};

AppModel.prototype.login = function login(username, password) {
        
    return this.rest.post('login', {
        username: username,
        password: password
    }).then(function(logged) {

        // use authorization key for each
        // new Rest request
        this.rest.extraHeaders = {
            alu: logged.userId,
            alk: logged.authKey
        };

        // async local save, don't wait
        localforage.setItem('credentials', {
            userID: logged.userId,
            username: username,
            password: password
        });
        
        // Set user data
        // TODO Get User info
        fakeLogin(this.user());
        this.user().userID(logged.userId);
        this.user().email(username);

        return logged;
    }.bind(this));
};

// TODO: remove after implement real login
function fakeLogin(user) {
    user.model.updateWith(
        new User({
            firstName: 'Username',
            onboardingStep: null,
            isProvider: true
        })
    );
}
    
AppModel.prototype.logout = function logout() {
        
    return this.rest.post('logout').then(function() {

        this.rest.extraHeaders = null;
        localforage.removeItem('credentials');
    }.bind(this));
};

module.exports = AppModel;
