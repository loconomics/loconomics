/**
    Keep an in memory cache of data organized by date as key-value.
    
    IMPORTANT: Date without time, in ISO format YYYY-MM-DD, using
    local timezone. A change of timezone displayed to the user must
    invalidate the cache (through .clear()).
**/
'use strict';

var moment = require('moment'),
    CacheControl = require('./CacheControl');

module.exports = function DateCache(settings) {
    
    this.Model = settings && settings.Model || null;
    
    this.byDate = {};
    
    this.clear = function() {
        this.byDate = {};
    };
    
    this.getSingle = function(date) {
        var dateKey = date;
        if (date instanceof Date)
            moment(date).format('YYYY-MM-DD');
        
        if (this.byDate.hasOwnProperty(dateKey) &&
            !this.byDate[dateKey].control.mustRevalidate()) {

            return this.byDate[dateKey].data;
        }

        return null;
    };
    
    this.get = function(start, end) {

        var date = new Date(start);
        var resultsPerDate = {},
            holes = [],
            minRequest = null,
            maxRequest = null;

        while (date <= end) {
            var dateKey = moment(date).format('YYYY-MM-DD');
            
            if (this.byDate.hasOwnProperty(dateKey) &&
                !this.byDate[dateKey].control.mustRevalidate()) {
                resultsPerDate[dateKey] = this.byDate[dateKey].data;
            }
            else {
                maxRequest = new Date(date);
                if (!minRequest) minRequest = maxRequest;
                holes.push(maxRequest);
            }
            // Next date:
            date.setDate(date.getDate() + 1);
        }
        
        return {
            byDate: resultsPerDate,
            holes: holes,
            minHole: minRequest,
            maxHole: maxRequest
        };
    };
    
    this.set = function(date, data) {
        // Date formatting. Provide a formatted date as string is valid too
        var dateKey = date;
        if (date instanceof Date)
            dateKey = moment(date).format('YYYY-MM-DD');
        
        // Update cache
        var c = this.byDate[dateKey];
        if (c && c.data) {
            if (this.Model)
                c.data.model.updateWith(data);
            else
                c.data = data;
        }
        else {
            c = {
                data: this.Model ? new this.Model(data) : data,
                control: new CacheControl({ ttl: { minutes: 1 } })
            };
            this.byDate[dateKey] = c;
        }
        c.control.touch();
        return c;
    };
};
