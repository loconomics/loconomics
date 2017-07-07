/**
 * Allows to set-up Google Analytics
 * at start-up and auto-set the user when
 * there is a session start.
 * @module data/googleAnalytics
 */
'use strict';

var session = require('./session');

/**
 * Set-ups Google Analytics library, if loaded,
 * with the credentials so identifies the user.
 * @param {Credentials} credentials
 * @private
 */
var setUser = function(credentials) {
    if (window.ga) {
        if (window.cordova) {
            window.ga.setUserId(credentials.userID);
        }
        else {
            window.ga('set', 'userId', credentials.userID);
        }
    }
};

session.on.opened.subscribe(setUser);
session.on.restored.subscribe(setUser);
