/**
 * Localforage data driver.
 * Provides a localforage instance ready
 * to use with the app set-up
 */
'use strict';

var localforage = require('localforage');

// TODO Investigate why automatic selection an IndexedDB are
// failing and we need to use the worse-performance localstorage back-end
localforage.config({
    name: 'LoconomicsApp',
    version: 0.1,
    size : 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName : 'keyvaluepairs',
    description : 'Loconomics App',
    driver: localforage.LOCALSTORAGE
});

module.exports = localforage;
