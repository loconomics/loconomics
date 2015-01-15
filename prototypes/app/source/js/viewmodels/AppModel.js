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
    
    // NOTE: URL to be updated
    this.rest = new Rest('http://dev.loconomics.com/en-US/rest/');
    
    // Local data
    localforage.config({
        name: 'LoconomicsApp',
        version: 0.1,
        size : 4980736, // Size of database, in bytes. WebSQL-only for now.
        storeName : 'keyvaluepairs',
        description : 'Loconomics App'
    });
    
    this.model.defProperties({
        user: User.newAnonymous()
    }, values);

    /**
        Account methods
    **/
    this.login = function login(username, password) {
        
        return this.rest.post('login', {
            username: username,
            password: password
        }).then(function(logged) {
            
            // async local save, don't wait
            localforage.setItem('credentials', {
                userID: logged.userId,
                username: username,
                password: password
            });
            
            return logged;
        });
    };
    
    this.logout = function logout() {
        
        return this.rest.post('logout').then(function() {
            
            localforage.removeItem('credentials');
        });
    };
    
    this.rest.onAuthorizationRequired = function(retry) {
        // Get saved credentials
        return localforage.getItem('credentials')
        .then(function(credentials) {
            // Attempt login with that
            return this.login(credentials.username, credentials.password);
        }.bind(this))
        .then(function() {
            // Logged! Just retry
            retry();
        });
    }.bind(this);
}

module.exports = AppModel;
