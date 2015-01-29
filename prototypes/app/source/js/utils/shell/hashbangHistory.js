/**
    INCOMPLETE, UNUSED, code base for
    
    Implementation of the History API for use with Shell.js
    to manage every entry as Hashbang, avoiding the problem in
    environments where the request of the wide number of URLs 
    managed by usual History API is not supported (only one html file as entry
    point).
    
    And too for bad Android <=4.1 compatibility with HistoryAPI.
**/
'use strict';
var $ = require('jquery');

// TODO Init: Load saved copy from localforage
// Or create a new one
var session = [{
    state: null,
    title: null, // Current page title. Browsers didn't implement this so who cares
    // A browses needs full URL (window.location.href),
    // but we only want the hashbang here if any
    url: window.location.hash || ''
}];
// ?_suid=1

var hashbangHistory = {
    pushState: function pushState(state, title, url) {
        // TODO
        // cleanup url
        // save new state for url
        location.hash = '#!' + url;
    },
    replaceState: function replaceState(state, title, url) {
        // TODO
        // cleanup url
        // replace state and current url
        location.hash = '#!' + url;
    },
    get state() {
        // TODO
    },
    get length() {
        return window.history.length;
    },
    go: function go(offset) {
        window.history.go(offset);
    },
    back: function back() {
        window.history.back();
    },
    forward: function forward() {
        window.history.forward();
    }
};

var $w = $(window);
$w.on('hashchange', function(e) {
    e.oldURL;
    e.newURL;
    var state; // get state from history entry
    $w.trigger(new $.Event('popstate', {
        state: state
    }));
});

module.exports = hashbangHistory;
