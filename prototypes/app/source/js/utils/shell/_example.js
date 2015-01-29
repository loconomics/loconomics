/**
    Sample of use of the Shell with default modules
    and example set-up.
**/
'use strict';

var shell = require('./index'),
    Shell = shell.Shell,
    DomItemsManager = shell.DomItemsManager;

// On ready
Shell.deps.$(function() {

    // Its called 'shell items' the DOM elements under the root or container
    // that behave like page/component/activity/controller/view/whatever

    // Creating the shell:
    var shell = new Shell({
        
        // Selector, DOM element or jQuery object pointing
        // the root or container for the shell items
        root: 'body',
        
        // If is not in the site root, the base URL is required:
        baseUrl: '/testing-the-shell/',
        
        // Name of the item that acts like the index
        // when requesting the root URL
        indexName: 'index', // index is the default value if not specified
        
        // for better mobile experience, if the event is installed:
        linkEvent: 'tap',

        // Set a different loader than the default one, an object like
        //   loader: { load: function(name) { return Promise(..); } }
        // Loading can be disabled by setting a null loader, on that
        // cases a non preloaded item returns a 'page not found' error
        // instantly.
        //loader: null,

        // Providing a different history management? By default, the
        // browser history is used without to type this :-)
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
        window.alert(str);
    });

    // Executing the shell, event handlers starts,
    // the index page or the current URL ones is showed.
    shell.run();
});
