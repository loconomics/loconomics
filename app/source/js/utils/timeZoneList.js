/**
 * Utility to retrieve a list of time zones, and
 * related utilities.
 * 
 * Backed by moment-timezone module.
 * */
'use strict';
var moment = require('moment-timezone');

/**
 * DO NOT USE. TRIAL: was a good try but ends to only 
 * find tzs that are linked as aliases, but not others were the 
 * link is done at inverse order (a lot) or not directly linked to
 * a US/* tz.
 * Look for an alias of type US/* for a given America/*
 * tzid, when possible, with fallback to the given
 * tzid. This makes possible the preference to
 * use the US/*well-know-name* IDs instead of the America/*city*
 * ones, more popular naming for users at USA.
 * 
 * IMPORTANT: It uses an internal API of moment-timezone, it can
 * change with newer versions without notice (because is not a public API).
 */
/*function getUsAliasWhenPossible(tzid, originalTzid) {
    if (/^America\//i.test(tzid)) {
        var adapted = tzid.toLowerCase().replace('/', '_');
        var alias = moment.tz._links[adapted];
        // If the alias is not an 'US/' like ID (internal format 'us_')
        // try again. Exclude the bad, problematic US/Pacific-New tz too.
        if (!/^us_/.test(alias) || /^us_pacific-new$/.test(alias))
            return getUsAliasWhenPossible(alias, originalTzid || tzid);

        var tz = moment.tz(new Date(), alias);
        tz = tz ? tz.tz() : null;
        // If found, return the formal name of the timezone
        if (tz) return tz;
    }
    return originalTzid || tzid;
}*/

/**
 * Returns the timezone of the local device.
 * At engines with the Intl API is precise, at others
 * is guessed based on winter/summer offsets and
 * a list of time zones with population, so is approximated
 * (guess by moment-timezone)
 * @returns {string} Time Zone ID
 */
exports.getLocalTimeZone = function() {
    return moment.tz.guess();
};

/**
 * Internal formatter for the timeZoneToDisplayFormat function, with more redundant
 * parameters that allows some reuses for calculated values 
 * at the getUserList function, that calls this for each item (micro-optimization).
 * @returns {string}
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
 * Info about a time zone for public display/usage
 * @typedef {Object} PublicTimeZone
 * @property {string} id - IANA time zone identifier
 * @property {string} label - Display name. Includes the UTC offset, ID and common abbreviation
 * @property {number} offset - Offset of the time zone for a reference instant in time (the beggining
 * of current year)
 */


/**
 * Internal utility that maps a list of tzid strings into a displayed version,
 * and sorted properly.
 * @returns {PublicTimeZone[]}
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
 * @returns {PublicTimeZone[]}
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
 * @returns {PublicTimeZone[]}
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

/**
 * @returns {PublicTimeZone[]}
 */
exports.getUsZones = function getUsZones() {
    var m = moment().startOf('year');
    var ts = m.valueOf();
    var list = moment.tz.names()
    .filter(function(z) {
        return z.indexOf('US/') === 0;
    });
    return createDisplayList(list, m, ts);
};

/**
 * @returns {PublicTimeZone[]}
 */
exports.getTopUsZones = function getTopUsZones() {
    return [{
        id: 'US/Hawaii',
        label: 'UTC-10:00 Hawaii Time (HST)'
    }, {
        id: 'US/Alaska',
        label: 'UTC-09:00 Alaska Time (AKST)'
    }, {
        id: 'US/Pacific',
        label: 'UTC-08:00 Pacific Time (PST)'
    }, {
        id: 'US/Arizona',
        label: 'UTC-07:00 Arizona Time (MST)'
    }, {
        id: 'US/Mountain',
        label: 'UTC-07:00 Mountain Time (MST)'
    }, {
        id: 'US/Central',
        label: 'UTC-06:00 Central Time (CST)'
    }, {
        id: 'US/East-Indiana',
        label: 'UTC-05:00 Indiana (East) Time (EST)'
    }, {
        id: 'US/Eastern',
        label: 'UTC-05:00 Eastern Time (EST)'
    }];
}; 
