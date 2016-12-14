'use strict';
var moment = require('moment-timezone');

var timeZoneList = require('../source/js/utils/timeZoneList');

//: COPIED FROM timeZoneList internal function:
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
function getUsAliasWhenPossible(tzid, originalTzid) {
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
}

// Try to enumerate all
var d = timeZoneList.getFullList().map(function(zone) {
    return [zone.id, getUsAliasWhenPossible(zone.id)];
})
.filter(function(d) {
    return d[0] !== d[1];
});

console.dir(d);
