/**
 * Access to appointments list the user has with service professionals
 * (the user is the client in that bookings),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var Booking = require('../models/Booking');
var ko = require('knockout');
var CacheControl = require('./helpers/CacheControl');
var moment = require('moment');
var user = require('./userProfile').data;
var session = require('./session');
var local = require('./drivers/localforage');
var bookings = require('./bookings');

var cache = new CacheControl({
    ttl: { minutes: 10 },
    data: ko.observableArray([])
});
cache.localLoaded = false;
cache.range = {
    startTime: null,
    endTime: null
};

// Internal utils
function loadLocalCopy() {
    return local.getItem('clientAppointments')
    .then(function(data) {
        //jshint maxcomplexity:8
        if (data) {
            if (data.latest)
                cache.latest = new Date(data.latest);
            if (data.data)
                cache.data(data.data.map(function(b) { return new Booking(b); }));
            if (data.range) {
                cache.range.startTime = data.range.startTime ? new Date(data.range.startTime) : null;
                cache.range.endTime = data.range.endTime ? new Date(data.range.endTime) : null;
            }
        }
    });
}
function saveLocalCopy() {
    return local.setItem('clientAppointments', {
        latest: cache.latest,
        data: cache.data().map(function(b) { return b.model.toPlainObject(true); })
    });
}

function isClientBooking(booking) {
    return user.userID() === booking.clientUserID();
}
function sortBookingByDateComparator(a, b) {
    var c = a.serviceDate().startTime() > b.serviceDate().startTime();
    return c ? 1 : -1;
}

var remoteRequest = null;
function getFromRemote() {
    if (remoteRequest) return remoteRequest;
    var start = new Date();
    // Up to 3 months in advance for clients. They have not too many apts usually.
    var end = moment().add(3, 'month').toDate();
    remoteRequest = bookings.getBookingsByDates(start, end)
    .then(function(remoteData) {
        remoteRequest = null;
        var d = remoteData().filter(isClientBooking).sort(sortBookingByDateComparator);
        if (d && d.length) {
            cache.range.startTime = d[0].serviceDate().startTime();
            cache.range.endTime = d[d.length - 1].serviceDate().endTime();
            cache.touch();
            cache.data(d);
            saveLocalCopy();
        }
        else {
            cache.data([]);
        }
    })
    .catch(function(er) {
        remoteRequest = null;
        // rethrow
        throw er;
    });
    return remoteRequest;
}

function syncData() {
    var p = Promise.resolve();
    // Get local in first chance
    if (!cache.localLoaded) {
        p = loadLocalCopy();
    }
    // Request a remote update if cache is old
    if (cache.mustRevalidate()) {
        p = p.then(getFromRemote);
    }
    return p;
}

// Public API
exports.sync = syncData;

exports.list = cache.data;

exports.clearCache = function() {
    cache.data([]);
    cache.reset();
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
