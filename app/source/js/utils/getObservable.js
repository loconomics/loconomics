/**
    Get a given value wrapped in an observable or returns
    it if its already an observable or just a function.
**/
'use strict';
var ko = require('knockout');

module.exports = function getObservable(obsOrValue) {
    if (typeof(obsOrValue) === 'function')
        return obsOrValue;
    else
        return ko.observable(obsOrValue);
};
