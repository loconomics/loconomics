/**
    Setup of the shell object used by the app
**/
'use strict';
//global window

// History API polyfill
require('../vendor/history/jquery.history');
var History = window.History;
// used only in 'hash mode'
History.options.html4Mode = true;

// Shell dependencies
var shell = require('./utils/shell'),
    Shell = shell.Shell,
    DomItemsManager = shell.DomItemsManager;

// Creating the shell:
var shell = new Shell({

    // Selector, DOM element or jQuery object pointing
    // the root or container for the shell items
    root: 'body',

    // If is not in the site root, the base URL is required:
    baseUrl: '/prototypes/app/build/appDebug.html#',

    indexName: 'index',

    // for faster mobile experience (jquery-mobile event):
    linkEvent: 'tap',

    // No need for loader, everything comes bundled
    loader: null,

    // Browser history API, or the loaded polyfill
    history: window.history,

    // A DomItemsManager or equivalent object instance needs to
    // be provided:
    domItemsManager: new DomItemsManager({
        idAttributeName: 'data-activity'
    })
});

// Catch errors on item/page loading, showing..
shell.on('error', function(err) {
    var str = typeof(err) === 'string' ? err : JSON.stringify(err);
    // TODO change with a dialog or something
    window.alert(str);
});

module.exports = shell;
