/**
    Setup of the shell object used by the app
**/
'use strict';

var baseUrl = window.location.pathname;

var History = require('./app-shell-history').create(baseUrl);

// Shell dependencies
var shell = require('./utils/shell/index'),
    Shell = shell.Shell,
    DomItemsManager = shell.DomItemsManager;

// Creating the shell:
var shell = new Shell({

    // Selector, DOM element or jQuery object pointing
    // the root or container for the shell items
    root: 'body',

    // If is not in the site root, the base URL is required:
    baseUrl: baseUrl,
    
    forceHashbang: false,

    indexName: 'index',

    // for faster mobile experience (jquery-mobile event):
    linkEvent: 'tap',

    // No need for loader, everything comes bundled
    loader: null,

    // History Polyfill:
    history: History,

    // A DomItemsManager or equivalent object instance needs to
    // be provided:
    domItemsManager: new DomItemsManager({
        idAttributeName: 'data-activity'
    })
});

// Catch errors on item/page loading, showing..
shell.on('error', function(err) {
    var str = err ?
        typeof(err) === 'string' ? err : JSON.stringify(err) :
        'Unknow error'
    ;
    // TODO change with a dialog or something
    window.alert(str);
});

module.exports = shell;
