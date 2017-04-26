/**
 * @module viewmodels/Field
 */
'use strict';

var ko = require('knockout');

/**
 * Creates an observable with an error observable string.
 * The error string is reset whenever the value of the field changes.
 * 
 * @class
 **/
var Field = function() {
    var obs = ko.observable('');

    obs.error = ko.observable('');

    // Reset error after a change:
    obs.subscribe(function() {
        obs.error('');
    });

    return obs;
};

module.exports = Field;
