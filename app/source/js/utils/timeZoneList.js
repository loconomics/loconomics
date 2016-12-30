/**
 * Utility to retrieve a list of time zones, and
 * related utilities.
 * 
 * Backed by moment-timezone module.
 * */
'use strict';
var moment = require('moment-timezone');

/**
 * Returns the timezone of the local device.
 * At engines with the Intl API is precise, at others
 * is guessed based on winter/summer offsets and
 * a list of time zones with population, so is approximated
 * (guess by moment-timezone)
 */
exports.getLocalTimeZone = function() {
    return moment.tz.guess();
};

/**
 * Internal formatter for the timeZoneToDisplayFormat function, with more redundant
 * parameters that allows some reuses for calculated values 
 * at the getUserList function, that calls this for each item (micro-optimization). 
 */
function displayTimeZone(tzid, zone, instantMoment, ts) {
    return 'UTC' + instantMoment.tz(tzid).format('Z') + ' ' + tzid + ' (' + zone.abbr(ts) + ')';
}

/**
 * Returns a string representing the given time zone ID (tzid)
 * with the format used for display. It's a result meaningful for users.
 * @param {string} tzid Time zone ID
 * @param {(Date|moment|Number)} [instant=Beggining of current year] [Optional] Instant to calculate
 * some displayed info, like the offset or the abbreviated name
 * (it changes in history for some places).
 * Take care that providing the 'now' value (new Date(), Date.now, moment())
 * may result in different abbreviated name than expected because of DST.
 * To ensure that the standard (winter) abbr is used, for more recent Date,
 * a trick is to use the beggining of the year, that is the default value
 * (It's like: moment().startOf('year') or new Date(new Date.getFullYear(), 0, 1).
 */
exports.timeZoneToDisplayFormat = function(tzid, instant) {
    instant = instant ? moment(instant).clone() : moment().startOf('year');
    var zone = moment.tz.zone(tzid);
    var ts = instant.valueOf();
    return displayTimeZone(tzid, zone, instant, ts);
};

/**
 * Internal utility that maps a list of tzid strings into a displayed version,
 * and sorted properly.
 */
var createDisplayList = function(tzList, m, ts) {
    return tzList.map(function(tzid) {
        var z = moment.tz.zone(tzid);
        return {
            id: tzid,
            offset: z.offset(ts),
            label: displayTimeZone(tzid, z, m, ts)
        };
    })
    .sort(function(a, b) {
        if (a.offset !== b.offset) {
            return a.offset > b.offset ? -1 : 1;
        }
        else {
            return a.id > b.id ? 1 : -1;
        }
    });
};

/**
 * Returns the complete list of time zones, as a 
 * list of { id, label, offset } objects,
 * sorted and formatted for display by the label value.
 */
exports.getFullList = function() {
    var m = moment().startOf('year');
    var ts = m.valueOf();
    var list = moment.tz.names();
    return createDisplayList(list, m, ts);
};

/**
 * Return a list of time zones for places with population
 * meaningful for users that may pick their time zone,
 * as a list of { id, label, offset } objects,
 * sorted and formatted for display by the label value.
**/
exports.getUserList = function getUserList() {
    var m = moment().startOf('year');
    var ts = m.valueOf();
    var list = moment.tz.names()
    .filter(function(z) {
        return z.indexOf('/') !== -1 && moment.tz.zone(z).population;
    });
    return createDisplayList(list, m, ts);
};
