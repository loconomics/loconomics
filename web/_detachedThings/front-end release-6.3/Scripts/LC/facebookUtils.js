/*global window*/
/**
    Simplifing some uses of the Facebook API
    and the loading of its API with a 'ready' function.

    Official API: https://developers.facebook.com/docs/facebook-login/login-flow-for-web/v2.1
**/

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
    
    apiStatus.stack.push(readyCallback);

    if (apiStatus.ready) {
        // Double-check the callback, since 'read'
        // could be loaded just to force the API pre-load
        if (typeof(readyCallback) === 'function')
            readyCallback(window.FB);
    }
    else if (!facebookReady.isLoading) {
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
                    } catch (e) { }
                }
            }
        });
    }
};

/**
    Request a Facebook Login, executing the success
    or error callback depending on the response.
    Success gets the 'authResponse' given by Facebook,
    and error the whole response object, and both
    the FB API as second parameter.
**/
exports.login = function facebookLogin(options, success, error) {
    // When the API is ready
    exports.ready(function (FB) {
        // When Facebook gives a response to the following
        // Login Request
        FB.login(function (response) {
            // status==connected if there is an authResponse
            if (response.authResponse &&
                typeof (success) === 'function') {
                success(response.authResponse, FB);
            }
            else if (typeof (error) === 'function') {
                error(response, FB);
            }
        }, options);
    });
};
