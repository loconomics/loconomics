/**
    Default build of the Shell component.
    It returns the Shell class as a module property,
    setting up the built-in modules as its dependencies,
    and the external 'jquery' and 'events' (for the EventEmitter).
    It returns too the built-it DomItemsManager class as a property for convenience.
**/
'use strict';

var Shell = require('./Shell'),
    DomItemsManager = require('./DomItemsManager'),
    parseUrl = require('./parseUrl'),
    absolutizeUrl = require('./absolutizeUrl'),
    itemsSwitcher = require('./itemsSwitcher'),
    $ = require('jquery'),
    loader = require('./loader');

$.merge(Shell.deps, {
    parseUrl: parseUrl,
    absolutizeUrl: absolutizeUrl,
    itemsSwitcher: itemsSwitcher,
    jquery: $,
    loader: loader
});

exports.Shell = Shell;
exports.DomItemsManager = DomItemsManager;
