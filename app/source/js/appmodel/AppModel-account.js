/** 
    AppModel extension,
    focused on the Account related APIs:
    - login
    - logout
    - signup
**/
'use strict';

var localforage = require('localforage');
var getUrlQuery = require('../utils/getUrlQuery');
var $ = require('jquery');

exports.plugIn = function (AppModel) {
    /**
        Performs a login attempt with the API by using
        the provided credentials.
    **/
    AppModel.prototype.login = function login(username, password) {

        // Reset the extra headers to attempt the login
        this.rest.extraHeaders = null;

        return this.rest.post('login', {
            username: username,
            password: password,
            returnProfile: true
        }).then(performLocalLogin(this, username, password));
    };

    /**
        Performs a login attempt with the API by using
        a Facebook accessToken.
    **/
    AppModel.prototype.facebookLogin = function facebookLogin(accessToken) {

        // Reset the extra headers to attempt the login
        this.rest.extraHeaders = null;

        return this.rest.post('login/facebook', {
            accessToken: accessToken,
            returnProfile: true
        }).then(function(logged) {
            return performLocalLogin(this, logged.profile.email, null)(logged);
        }.bind(this));
    };

    /**
        Performs a logout, removing cached credentials
        and profile so the app can be filled up with
        new user information.
        It calls to the API logout call too, to remove
        any server-side session and notification
        (removes the cookie too, for browser environment
        that may use it).
    **/
    // FUTURE: TOREVIEW if the /logout call can be removed.
    AppModel.prototype.logout = function logout() {

        // Local app close session
        this.rest.extraHeaders = null;
        localforage.removeItem('credentials');
        localforage.removeItem('profile');
        
        // Local data clean-up!
        this.clearLocalData();

        // Don't need to wait the result of the REST operation
        this.rest.post('logout');

        return Promise.resolve();
    };

    /**
        Attempts to create a user account, getting logged
        if successfully like when doing a login call.
    **/
    AppModel.prototype.signup = function signup(data) {

        // Reset the extra headers to attempt the signup
        this.rest.extraHeaders = null;
        
        data.returnProfile = true;
        
        // Prepare 'utm' information passed into the query
        var query = getUrlQuery();
        var utm = {
            // Default source
            utm_source: window.cordova ? 'app' : 'web'
        };
        // Get only 'utm_' prefixed names, prepare object
        query.forEach(function(name) {
            if (/^utm_/.test(name)) {
                utm[name] = query[name];
            }
        });

        // The result is the same as in a login, and
        // we do the same as there to get the user logged
        // on the app on sign-up success.
        return this.rest.post('signup?' + $.param(utm), data)
        .then(performLocalLogin(this, data.email, data.password));
    };
    
    /**
        Request an email with token to reset the password for a given user
        @param data:Object {
            username:string
            email:string Alias to username value
        }
        @result Promise<Object {
            message:string Server-side message about the result
        }>
        The e-mail will contain the URL 'login/reset-password/?token='
        and the token value in the parameter.
    **/
    AppModel.prototype.resetPassword = function resetPassword(data) {
        var username = data.username || data.email;
        return this.rest.post('auth/reset-password', { username: username });
    };

    /**
        Confirm to reset a password providing a new password and valid token
        @param data:Object {
            token:string Value provided in an URL from the resetting e-mail
            password:string New password
            confirm:string Repeated password for confirmation
        }
        @result Promise<Object {
            message:string Server-side message about the result
        }>
    **/
    AppModel.prototype.confirmResetPassword = function confirmResetPassword(data) {
        return this.rest.post('auth/reset-password/confirm', data);
    };
};

function performLocalLogin(thisAppModel, username/*, password*/) {

    return function(logged) {
        
        // Remove any previous local data if any:
        return thisAppModel.clearLocalData()
        .then(function() {

            // use authorization key for each
            // new Rest request
            thisAppModel.rest.extraHeaders = {
                Authorization: 'LC alu=' + logged.userID + ',alk=' + logged.authKey
            };

            // async local save, don't wait
            localforage.setItem('credentials', {
                userID: logged.userID,
                username: username,
                authKey: logged.authKey
            });
            // IMPORTANT: Local name kept in sync with set-up at AppModel.userProfile
            localforage.setItem('profile', logged.profile);

            // Set user data
            thisAppModel.user().model.updateWith(logged.profile);
            
            // Google Analytics
            if (window.ga) {
                window.ga.setUserId(logged.userID);
            }

            return logged;
        });
    };
}
