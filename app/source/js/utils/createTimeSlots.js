/**
    It creates slots between the given times and size for each one.
    Past times are avoided, because are not available
**/
'use strict';

var moment = require('moment');

/**
    Returns a list of beggining time slots between the range of given times (from-to)
    with a size and that fit in a given duration.
**/
exports.forRange = function forRange(from, to, size, duration) {
    var i = moment(from),
        d,
        slots = [],
        now = new Date(),
        enought;

    // Shortcut if bad 'to' (avoid infinite loop)
    if (to <= from)
        return slots;

    while(i.toDate() < to) {
        d = i.clone().toDate();
        enought = i.clone().add(duration, 'minutes').toDate();
        // Check that:
        // - is not a past date
        // - it has enought time in advance to fill the expected duration
        if (d >= now &&
            enought <= to)
            slots.push(d);
        // Next slot
        i.add(size, 'minutes');
    }
    
    return slots;
};

/**
    Returns a list of beggining time slots with a size and that fits in a given
    duration for all the AvailabilitSlots in the list with availability 'free'
**/
exports.forList = function forList(list, size, duration) {
    var slots = [];
    // Iterate every free time range/AvailabilitySlot
    list.forEach(function (item) {
        if (item.availability === 'free') {
            slots.push.apply(slots, exports.forRange(item.startTime, item.endTime, size, duration));
        }
    });
    return slots;
};

exports.filterListBy = function filterListBy(list, start, end) {
    var nstart = start.toISOString(),
        nend = end.toISOString();
    var result = [];

    list.some(function(timeRange) {
        // It's after the wanted range, stop iterating
        if (timeRange.startTime >= nend)
            return true;
        // It's inside the wanted range and not before it starts
        if (timeRange.endTime > nstart) {
            if (timeRange.startTime < nstart) {
                // Beggining needs to be cut
                result.push({
                    startTime: nstart,
                    // Be carefull with looong timeRanges, that can go from before starting to after ending:
                    endTime: timeRange.endTime > nend ? nend : timeRange.endTime,
                    availability: timeRange.availability
                });
            }
            else if (timeRange.endTime > nend) {
                // Ending needs to be cut
                result.push({
                    startTime: timeRange.startTime,
                    endTime: nend,
                    availability: timeRange.availability
                });
            }
            else {
                result.push(timeRange);
            }
        }
        // else continue iterating until reach something in the wanted range
    });
    
    return result;
};
