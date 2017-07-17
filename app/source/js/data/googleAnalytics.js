/**
 * Allows to set-up Google Analytics
 * at start-up and auto-set the user when
 * there is a session start.
 * @module data/googleAnalytics
 */
//global window
'use strict';

var GA_TRACKER_ID = 'UA-72265353-4';
var session = require('./session');
var $ = require('jquery');

/**
 * Set-ups Google Analytics library, if loaded,
 * with the credentials so identifies the user.
 * @param {UserAuthKey} userAuthKey
 * @private
 */
var setUser = function(userAuthKey) {
    if (window.ga) {
        if (window.cordova) {
            window.ga.setUserId(userAuthKey.userID);
        }
        else {
            window.ga('set', 'userId', userAuthKey.userID);
        }
    }
};

session.on.opened.subscribe(setUser);
session.on.restored.subscribe(setUser);

/**
 * Initializes Google Analytics with the app identity
 * and reactions to shell changes.
 * NOTE: Must be called after Cordova 'device-ready'
 * @param {Shell} shell
 *
 * TODO shell-refactor: stop receiving the shell instance, even the
 * explicit call to setup may be not needed, just listen to events
 * TODO app info can go to appPresets, maybe?
 */
exports.setup = function(shell) {
    if (window.ga) {
        var appId = $('html').data('app-id');
        var appName = $('html').data('app-name');
        var appVersion = $('html').data('app-version');
        // We want to track exactly the different platforms where
        // we run: web, android, ios (from cordova device property)
        // and we use the version field for that
        appVersion = (window.device && window.device.platform || 'web') + '-' + appVersion;

        if (window.cordova) {
            window.ga.startTrackerWithId(GA_TRACKER_ID);
            window.ga.setAppVersion(appVersion);
            // app Id and Names seems to be automatic at native
            window.ga.trackView('index');
        }
        else {
            window.ga('create', GA_TRACKER_ID, 'auto');
            window.ga('set', 'appVersion', appVersion);
            window.ga('set', 'appName', appName);
            window.ga('set', 'appId', appId);
            window.ga('send', 'screenview', { screenName: 'index' });
        }

        shell.on(shell.events.itemReady, function($act, state) {
            var view = state.route.name;
            //var url = state && state.route && state.route.url || window.location.pathname + window.location.search + window.location.hash;
            //url = url.replace(/^#!/, '');
            if (window.cordova) {
                window.ga.trackView(view);
            }
            else {
                window.ga('send', 'screenview', { screenName: view });
            }
        });
    }
};
