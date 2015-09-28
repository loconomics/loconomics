/**
    It creates slots between the given times and size for each one.
    Past times are avoided, because are not available
**/
'use strict';

var moment = require('moment');

module.exports = function createTimeSlots(from, to, size, duration) {
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
