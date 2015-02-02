/**
    History API implementation for the app.shell.
    
    Uses the History.js pseudo polyfill with some
    tricky code to make it works for the Shell
    and forcing hashtags to avoid rewrite URL
    to non-existant files.
**/
//global window

exports.create = function(baseUrl) {

    // History API polyfill
    // used only in 'hash mode'
    var History = window.History = window.History || {};
    History.options = {
        html4Mode: true
    };
    // Now, it starts
    require('history');

    // This polyfill uses the function getState rather than
    // the standard 'state' property, but can be created
    // as a getter if the polyfill is in use
    var propsTools = require('./utils/jsPropertiesTools');
    if (!('state' in History) && History.getState) {
        propsTools.defineGetter(History, 'state', function() {
            return History.getState().data;
        });
    }
    // The same for the 'length' property
    if (!('length' in History)) {
        propsTools.defineGetter(History, 'length', function() {
            return window.history.length;
        });
    }
    // Uses the special statechange rather than standard popstate
    // to manage hash urls properly
    History.popstateEvent = 'statechange';

    // Get base URL from current 'actual file' URL
    // Overwrite the baseURL of the History polyfill
    History.getBaseUrl = function() {
        return baseUrl;
    };
    
    return History;
};
