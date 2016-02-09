/**
    Utility to help track the state of cached data
    managing time, preference and if must be revalidated
    or not.
    
    Its just manages meta data about the caching state and validation,
    but does not manage the data to be cached; said that, has a 'data'
    property that can be used to place the cached data, but it's maintenance
    is under control of the external code.
**/
'use strict';

var moment = require('moment');

function CacheControl(options) {
    
    options = options || {};

    // A number of milliseconds or
    // An object with desired units and amount, all optional,
    // any combination with almost one specified, sample:
    // { years: 0, months: 0, weeks: 0, 
    //   days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }
    this.ttl = moment.duration(options.ttl).asMilliseconds();
    this.latest = options.latest || null;

    this.mustRevalidate = function mustRevalidate() {
        var tdiff = this.latest && new Date() - this.latest || Number.POSITIVE_INFINITY;
        return tdiff > this.ttl;
    };
    
    this.touch = function touch() {
        this.latest = new Date();
    };
    
    this.reset = function reset() {
        this.latest = null;
    };
    
    // Placeholder where external code can place the the cached data
    // so can keep management of caching all inside this object
    this.data = null;
}

module.exports = CacheControl;
