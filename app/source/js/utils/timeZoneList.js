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

/*********************/
/* Getting a US/ tz ID
    for a given
    zone/city ID
*/
/**
 * DO NOT USE. TRIAL: was a trial but ends to only 
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
    // early optimization filtering by America/, buggy since there 
    // are some Pacific times too and future data may change that rule too.
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
/* testing utility used to get Zones data from a tzdata file, used to review some data,
added commented only for documentation purposes:
function getZonesFromTzdbFileContent(a) {
    var r = /^Zone\s\w+(\/[\w\-]+)*$/gm;
    var res = {};
    var adapt = x => x.replace(/\.$/, '').replace(/^Zone\s/, '');
    while ((i = r.exec(a)) !== null) { res[adapt(i[0])] = ''; }
    return res;
}
*/
/*********************/
/* usAliasesInverted */
/* tzdata::backward  Aliases to US/ zones (AK links)
Link	America/Anchorage	US/Alaska
Link	America/Adak		US/Aleutian
Link	America/Phoenix		US/Arizona
Link	America/Chicago		US/Central
Link	America/Indiana/Indianapolis	US/East-Indiana
Link	America/New_York	US/Eastern
Link	Pacific/Honolulu	US/Hawaii
Link	America/Indiana/Knox	US/Indiana-Starke
Link	America/Detroit		US/Michigan
Link	America/Denver		US/Mountain
Link	America/Los_Angeles	US/Pacific
Link	Pacific/Pago_Pago	US/Samoa
Link	America/Los_Angeles	US/Pacific-New	##
*/
/* tzdata::zone1970.tab  Zones related to USA (US,UM) and comments related to 
the US zone they belongs but without clarity (no actual timezone US/* used);
that makes it not perfect clear what exact zone must be related, most seems obvious
but Indiana zones are not clear if belongs to US/East-Indiana, Eastern or Indiana-Starke
(the only clear are /Indianapolis and /Knox because are used at the backward file as aliases/links)
More info: https://en.wikipedia.org/wiki/Time_in_Indiana#tz_database

AS,UM	-1416-17042	Pacific/Pago_Pago	Samoa, Midway

UM	+1917+16637	Pacific/Wake	Wake Island

US	+404251-0740023	America/New_York	Eastern (most areas)
US	+421953-0830245	America/Detroit	Eastern - MI (most areas)
US	+381515-0854534	America/Kentucky/Louisville	Eastern - KY (Louisville area)
US	+364947-0845057	America/Kentucky/Monticello	Eastern - KY (Wayne)
US	+394606-0860929	America/Indiana/Indianapolis	Eastern - IN (most areas)
US	+384038-0873143	America/Indiana/Vincennes	Eastern - IN (Da, Du, K, Mn)
US	+410305-0863611	America/Indiana/Winamac	Eastern - IN (Pulaski)
US	+382232-0862041	America/Indiana/Marengo	Eastern - IN (Crawford)
US	+382931-0871643	America/Indiana/Petersburg	Eastern - IN (Pike)
US	+384452-0850402	America/Indiana/Vevay	Eastern - IN (Switzerland)
US	+415100-0873900	America/Chicago	Central (most areas)
US	+375711-0864541	America/Indiana/Tell_City	Central - IN (Perry)
US	+411745-0863730	America/Indiana/Knox	Central - IN (Starke)
US	+450628-0873651	America/Menominee	Central - MI (Wisconsin border)
US	+470659-1011757	America/North_Dakota/Center	Central - ND (Oliver)
US	+465042-1012439	America/North_Dakota/New_Salem	Central - ND (Morton rural)
US	+471551-1014640	America/North_Dakota/Beulah	Central - ND (Mercer)
US	+394421-1045903	America/Denver	Mountain (most areas)
US	+433649-1161209	America/Boise	Mountain - ID (south); OR (east)
US	+332654-1120424	America/Phoenix	MST - Arizona (except Navajo)
US	+340308-1181434	America/Los_Angeles	Pacific
US	+611305-1495401	America/Anchorage	Alaska (most areas)
US	+581807-1342511	America/Juneau	Alaska - Juneau area
US	+571035-1351807	America/Sitka	Alaska - Sitka area
US	+550737-1313435	America/Metlakatla	Alaska - Annette Island
US	+593249-1394338	America/Yakutat	Alaska - Yakutat
US	+643004-1652423	America/Nome	Alaska (west)
US	+515248-1763929	America/Adak	Aleutian Islands
US,UM	+211825-1575130	Pacific/Honolulu	Hawaii
*/
/* Manually gathered data using previous data sources.
    It relates a specific northamerica time zone that belongs to USA
    (using the preferred zone/city ID) to a backward US/ zone ID.
*/
var usAliasesInverted = {
    'America/New_York': 'US/Eastern',
    'America/Detroit': 'US/Michigan',
    'America/Kentucky/Louisville': 'US/Eastern',
    'America/Kentucky/Monticello': 'US/Eastern',
    // Indiana times are controversial, data is not clear what US/* time relates
    // better. A more convervative approach is to keep then commented to not
    // convert into a US zone and avoid problems.
    'America/Indiana/Indianapolis': 'US/East-Indiana',
    'America/Indiana/Vincennes': 'US/East-Indiana',
    'America/Indiana/Winamac': 'US/East-Indiana',
    'America/Indiana/Marengo': 'US/East-Indiana',
    'America/Indiana/Petersburg': 'US/East-Indiana',
    'America/Indiana/Vevay': 'US/East-Indiana',
    'America/Chicago': 'US/Central',
    'America/Indiana/Tell_City': 'US/Indiana-Starke',
    'America/Indiana/Knox': 'US/Indiana-Starke',
    'America/Menominee': 'US/Central',
    'America/North_Dakota/Center': 'US/Central',
    'America/North_Dakota/New_Salem': 'US/Central',
    'America/North_Dakota/Beulah': 'US/Central',
    'America/Denver': 'US/Mountain',
    'America/Boise': 'US/Mountain',
    'America/Phoenix': 'US/Arizona',
    // There are actually two US/* zones linked to Los_Angeles,
    // the other one is US/Pacific-New, despite the name, is preferred
    // to NOT be used since matches a proposal of law never approved and
    // remains at tzdata as backward with special treatment.
    'America/Los_Angeles': 'US/Pacific',
    'America/Anchorage': 'US/Alaska',
    'America/Juneau': 'US/Alaska',
    'America/Sitka': 'US/Alaska',
    'America/Metlakatla': 'US/Alaska',
    'America/Yakutat': 'US/Alaska',
    'America/Nome': 'US/Alaska',
    'America/Adak': 'US/Aleutian',
    'Pacific/Honolulu': 'US/Hawaii',
    'Pacific/Pago_Pago': 'US/Samoa'
    // Pacific/Wake (UM) seems to not have a backward US/ equivalent
};

/**
 * Try to get the equivalent US/* time zone ID for a given
 * ID in the zone/city format, or fallbacks to the same provided
 * parameter when not found, so ever retrieves a value.
 * @param {string} tzid - Time zone ID in zone/city format for a US zone
 * @returns {string} Time zone ID
 */
exports.getUsAliasWhenPossible = function(tzid) {
    if (usAliasesInverted.hasOwnProperty(tzid)) {
        return usAliasesInverted[tzid];
    }
    return tzid;
};
