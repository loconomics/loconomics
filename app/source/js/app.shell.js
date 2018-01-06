/**
    Setup of the shell object used by the app
**/
'use strict';

var baseUrl = ''; // NEVER: window.location.pathname will broke inside Cordova
var hashBang = true;
if (!window.cordova) {
    var t = /^http.?:\/\/[^\/]+(\/[^#]*)/.exec(window.document.baseURI);
    if (t && t[1]) {
        baseUrl = t[1];
        hashBang = false;
    }
}

//var History = require('./app-shell-history').create(baseUrl);
var History = require('./utils/shell/hashbangHistory');

// Shell dependencies
var shell = require('./utils/shell/index');
var Shell = shell.Shell;
var DomItemsManager = shell.DomItemsManager;

//var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );

// Creating the shell:
module.exports = new Shell({

    // Selector, DOM element or jQuery object pointing
    // the root or container for the shell items
    root: 'App-activities', //'body',

    // If is not in the site root, the base URL is required:
    baseUrl: baseUrl,

    forceHashbang: hashBang,
    // Must be a all-users accesible URL
    indexName: 'home',
    // Must be a all-users accesible URL
    forbiddenAccessName: 'login',

    linkEvent: 'click',

    // History Polyfill:
    history: History,

    // A DomItemsManager or equivalent object instance needs to
    // be provided:
    domItemsManager: new DomItemsManager({
        idAttributeName: 'data-activity',
        root: '.App-activities'
    })
});
