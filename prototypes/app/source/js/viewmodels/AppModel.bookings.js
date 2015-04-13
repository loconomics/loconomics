/** Bookings
**/
'use strict';

var Booking = require('../models/Booking'),
//  apiHelper = require('../utils/apiHelper'),
    moment = require('moment'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
        remote: {
            rest: appModel.rest,
            getBookings: function(filters) {
                return appModel.rest.get('bookings', filters)
                .then(function(rawItems) {
                    return rawItems && rawItems.map(function(rawItem) {
                        return new Booking(rawItem);
                    });
                });
            }
        }
    };
/*
    apiHelper.defineCrudApiForRest({
        extendedObject: api.remote,
        Model: Booking,
        modelName: 'Booking',
        modelListName: 'Bookings',
        modelUrl: 'bookings',
        idPropertyName: 'bookingID'
    });*/

    var cacheByDate = {};
    
    api.clearCache = function clearCache() {
        cacheByDate = {};
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    api.getBookingsByDate = function getBookingsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cacheByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cacheByDate[dateKey]);

            // TODO lazy load, on background, for synchronization
        }
        else {
            // TODO check localforage copy first

            // Remote loading data
            return api.remote.getBookings({
                start: date,
                end: moment(date).add(1, 'days').toDate()
            }).then(function(bookings) {
                // TODO localforage copy of [dateKey]=bookings

                // Put in cache (they are already model instances)
                var arr = ko.observableArray(bookings);
                cacheByDate[dateKey] = arr;
                // Return the observable array
                return arr;
            });
        }
    };
    
    /**
        Get upcoming bookings meta-information for dashboard page
        TODO: implement cache??
    **/
    api.getUpcomingBookings = function getUpcomingBookings() {
        return appModel.rest.get('upcoming-bookings');
    };

    /**
        Get a specific booking by ID
        TODO: Implement cache? reusing cacheByDate?
    **/
    api.getBooking = function getBooking(id) {
        if (!id) return Promise.reject('The bookingID is required to get a booking');
        return appModel.rest.get('bookings/' + id)
        .then(function(booking) {
            return new Booking(booking);
        });
    };
    
    return api;
};
