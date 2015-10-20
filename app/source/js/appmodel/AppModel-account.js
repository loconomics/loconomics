/** 
    AppModel extension,
    focused on the Account related APIs:
    - login
    - logout
    - signup
**/
'use strict';

var localforage = require('localforage');

exports.plugIn = function (AppModel) {
    /**
        Try to perform an automatic login if there is a local
        copy of credentials to use on that,
        calling the login method that save the updated
        data and profile.
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
            return performLocalLogin(this, logged.email, null);
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
        this.rest.extraHeadres = null;
        
        data.returnProfile = true;

        // The result is the same as in a login, and
        // we do the same as there to get the user logged
        // on the app on sign-up success.
        return this.rest.post('signup?utm_source=app', data)
        .then(performLocalLogin(this, data.email, data.password));
    };
};

function performLocalLogin(thisAppModel, username, password) {

    return function(logged) {
        
        // Remove any previous local data if any:
        return thisAppModel.clearLocalData()
        .then(function() {

            // use authorization key for each
            // new Rest request
            thisAppModel.rest.extraHeaders = {
                alu: logged.userID,
                alk: logged.authKey
            };

            // async local save, don't wait
            localforage.setItem('credentials', {
                userID: logged.userID,
                username: username,
                password: password,
                authKey: logged.authKey
            });
            // IMPORTANT: Local name kept in sync with set-up at AppModel.userProfile
            localforage.setItem('profile', logged.profile);

            // Set user data
            thisAppModel.user().model.updateWith(logged.profile);

            return logged;
        });
    };
}
