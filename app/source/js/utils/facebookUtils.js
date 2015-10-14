/**
    Simplifing some uses of the Facebook API
    and the loading of its API with a 'ready' function.

    Official API: https://developers.facebook.com/docs/facebook-login/login-flow-for-web/v2.1
**/
/*global window*/
'use strict';

var loader = require('./loader'),
    $ = require('jquery');

// Facebook API settings gathered from the current page
// on first use:
var settings = {
    language: 'en-US',
    appId: null
};

// Private API loading/ready status
var apiStatus = {
    ready: false,
    loading: false,
    // Private static collection of callbacks registered
    stack: []
};

/**
    Register a callback to be executed when the
    Facebook API is ready.
    The callback receives as unique parameter
    the Facebook API object ('FB')
**/
exports.ready = function facebookReady(readyCallback) {

    if (apiStatus.ready) {
        // Double-check the callback, because its optional
        // (that's allow to use this function force the API pre-load)
        if (typeof(readyCallback) === 'function')
            readyCallback(window.FB);
        // Quik return
        return;
    }

    apiStatus.stack.push(readyCallback);
    
    if (!facebookReady.isLoading) {
        apiStatus.loading = true;

        // Get settings from page attributes
        settings.language = $('[data-facebook-language]').data('facebook-language');
        settings.appId = $('[data-facebook-appid]').data('facebook-appid');

        loader.load({
            scripts: ['//connect.facebook.net/' + settings.language + '/all.js'],
            completeVerification: function () { return !!window.FB; },
            complete: function () {
                // Initialize (Facebook registers itself as global 'FB')
                window.FB.init({ appId: settings.appId, status: true, cookie: true, xfbml: false });

                // Is ready
                apiStatus.ready = true;
                apiStatus.loading = false;

                // Execute callbacks in the stack:
                for (var i = 0; i < apiStatus.stack.length; i++) {
                    try {
                        apiStatus.stack[i](window.FB);
                    } catch (e) { console && console.error && console.error(e); }
                }
            }
        });
    }
};

/**
    Request a Facebook Login, returns a promise.
    Success gets the 'authResponse' given by Facebook,
    and error the whole response object, and both
    the FB API as second parameter.
**/
exports.login = function facebookLogin(options) {
    return new Promise(function(success, error) {
        // When the API is ready
        exports.ready(function (FB) {
            // When Facebook gives a response to the following
            // Login Request
            FB.login(function (response) {
                // status==connected if there is an authResponse
                if (response.authResponse) {
                    success({ auth: response.authResponse, FB: FB, response: response });
                }
                else {
                    error({ response: response, FB: FB });
                }
            }, options);
        });
    });
};
