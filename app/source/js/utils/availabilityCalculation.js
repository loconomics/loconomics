/**
    Set of functions to make calculations of availability
    per date given a list of appointments.
    It allows to sort them, create and insert free/unavailable appointments
    following a given daySchedule and summarize the date availability status.
    
    It relies (directly or not) in models like Appointment, 
    WeeklySchedule.WeekDaySchedule.
**/
'use strict';

var Appointment = require('../models/Appointment');
var moment = require('moment-timezone');

exports.sortAppointments = function(a, b) {
    var as = a.startTime(),
        ae = a.endTime(),
        bs = b.startTime(),
        be = b.endTime();

    if (as === null)
        return -1;
    else if (bs === null)
        return 1;

    var eq = as.toISOString() === bs.toISOString();
    if (eq) {
        if (ae === null)
            return -1;
        else if (be === null)
            return 1;
        
        return ae - be;
    }
    else {
        return as - bs;
    }
};

/**
    It adds before every booking apt/slot a 'preparation time' slot for the 'preparationHours' (AKA 'betweenTime').
    The given slots array MUST BE SORTED.
    It takes care to:
    - do not add slots out of the given date
    - do not add slots that overlay other bookings (if two bookings too close; because of manual timing or preference
      change of the preparationHours)
**/
exports.fillPreparationTimeSlots = function fillPreparationTimeSlots(date, slots, preparationHours) {
    
    // Avoid any task if no preparation times exists
    if (preparationHours === 0)
        return;
    
    // Initial check of previous slot start and ends is the given date (at midnight)
    // so we avoid to insert slots out of the date.
    var prevEnd = date;

    slots.forEach(function(slot, index) {
        // for each booking
        if (slot.id() > 0 &&
            slot.sourceBooking()) {
            
            var end = slot.startTime(),
                start = moment(end).subtract(preparationHours, 'hours').toDate();
    
            // avoiding the preparation slot if it ends before or just on
            // the previous slot end (or before the date) to avoid unneeded slots
            // NOTE: do NOT a (end <= prevEnd return;) because will introduce a bug
            // since the prevEnd will not be collected, failing when there are 
            // more than 2 consecutive bookings
            if (end > prevEnd) {
                // ..or cuts the beggining of the slot ('start') by
                // the end of the previous slot (so fits perfectly, without overlay)
                start = start < prevEnd ? prevEnd : start;

                // its added before the current slot:
                slots.splice(index, 0, Appointment.newPreparationTimeSlot({
                    start: start,
                    end: end
                }));
            }
        }
        prevEnd = slot.endTime();
    });
};

/**
    Introduce free or unavailable slots wherever needed in the given
    array of Appointments, to fill any gap in a natural day
    (from Midnight to Midnight next date) and based on the
    given busy appointmentsList and the freeScheduleSlots (this last generated
    previously based on the user WeekDaySchedule and timezone for the date and
    in local time, see createFreeScheduleSlots).
    A new array is returned.
    It introduce 'preparation time' slots too before of bookings when needed.
    
    date is a Date object representing the same date as used in
    the appointmentsList; it's used when no appointments exists (so
    date cannot be extracted from first appointment) to return an empty
    date unavaialable/free/unavailable slots; and when filling preparation slots, to
    avoid add a slot with time that starts in a previous date
    
    TODO: Make it compatible with an initial appointment that may start before the 
    date (but ends inside the date) and a final appointment that may end
    on the next date (but starts inside the date).
**/
exports.fillDayAvailability = function fillDayAvailability(date, appointmentsList, freeScheduleSlots, schedulingPreferences) {

    // Shadow clone
    var slots = appointmentsList.slice(0);
    // sort the list
    slots.sort(exports.sortAppointments);
    // add preparation time for each booking
    exports.fillPreparationTimeSlots(date, slots, schedulingPreferences.betweenTime());

    var filledSlots = [],
        zeroTime = '00:00:00',
        last = zeroTime,
        lastDateTime = null,
        timeFormat = 'HH:mm:ss';

    if (slots.length === 0) {
        // No slots, empty date so create the required
        // unavailable/free/unavailable slots for the 'date'
        var fullStart = moment(date).startOf('day'),
            fullEnd = fullStart.clone().add(1, 'days');

        filledSlots = exports.createScheduleSlots({
            start: fullStart.toDate(),
            end: fullEnd.toDate()
        }, freeScheduleSlots);
    }
    else {
        // Look for time gaps in the list
        slots.forEach(function(slot) {
            var start = slot.startTime(),
                s = moment(start),
                end = slot.endTime(),
                e = moment(end);

            if (s.format(timeFormat) > last) {

                if (lastDateTime === null) {
                    // First slot of the date, 12AM=00:00
                    lastDateTime = new Date(
                        start.getFullYear(), start.getMonth(), start.getDate(),
                        0, 0, 0
                    );
                }

                // There is a gap, fill it
                filledSlots.push.apply(filledSlots, exports.createScheduleSlots({
                    start: lastDateTime,
                    end: start
                }, freeScheduleSlots));
            }

            filledSlots.push(slot);
            lastDateTime = end;
            last = e.format(timeFormat);
        });

        // Check latest to see a gap at the end:
        var lastEnd = lastDateTime && moment(lastDateTime).format(timeFormat);
        if (lastEnd !== zeroTime) {
            // There is a gap, filled it
            var nextMidnight = new Date(
                lastDateTime.getFullYear(),
                lastDateTime.getMonth(),
                // Next date!
                lastDateTime.getDate() + 1,
                // At zero hours!
                0, 0, 0
            );

            filledSlots.push.apply(filledSlots, exports.createScheduleSlots({
                start: lastDateTime,
                end: nextMidnight
            }, freeScheduleSlots));
        }
    }

    return filledSlots;
};

/**
    Given a time range without appointments, and the day schedule,
    it returns an array of appointments objects to fullfill
    that empty range with unavailable/free appointments.
    
    The range must be two times inside the same date (local time), format
    range { start:Date, end:Date }
    
    freeScheduleSlots is an array datetime ranges, same properties as the range parameter:
    format: [{ start:Date, end:Date }]
    
    IMPORTANT: Currently, days with multi time-ranges will generated additional, overlapping, 'unavailable' slots
    because how is calculated in a per time-range basis (createScheduleSlotsForRanges).
    Because it calculate free times correctly and in the UI we do NOT show the unavailable ones, it works good enough,
    but any attempt to show unavailable slots generated or use that slots for other computation will fail.
    As an example, for a Monday with weekDaySchedule: [
        { start: '09:00', end: '17:00' },
        { start: '18:00', end: '19:00' }
    ]
    This function will generate next slots list (special short notation, 'Un' Unavailable, 'Fr' Free and times):
        Un: 00:00-09:00
        Fr: 09:00-17:00
        Un: 17:00-24:00
        Un: 00:00-18:00
        Fr: 18:00-19:00
        Un: 19:00-24:00
    Clearly, the Unavailable created for the first range (3th line), overlap the following Free an Unavailble slots,
    because every creating does not take care of other time-ranges.
    MAYBE: Just adding a second pass over that list generated, cutting or even remoging Unavailable slots when needed,
    can fix the results.
**/
exports.createScheduleSlots = function createScheduleSlots(range, freeScheduleSlots) {
    if (freeScheduleSlots.length) {
        var lists = freeScheduleSlots.map(function(freeRange) {
            return exports.createScheduleSlotsForRanges(range.start, range.end, freeRange.start, freeRange.end);
        });
        var l = lists.reduce(function(l, nl) { return l.concat.apply(l, nl); }, []);
        return l;
    }
    else {
        // when no availability on the day (just empty available slot, give the same date)
        return exports.createScheduleSlotsForRanges(range.start, range.end, range.start, range.start);
    }
};

exports.createScheduleSlotsForRanges = function createScheduleSlotsForRanges(start, end, from, to) {
    /*jshint maxcomplexity:10*/
    var list = [];

    // It happens before the week day schedule starts
    var beforeSchedule = 
        start < from &&
        end <= from;
    // It happens after the week day schedule ends
    var afterSchedule = 
        end > to &&
        start >= to;
    // It happens inside the week day schedule
    var insideSchedule =
        start >= from &&
        end <= to;

    if (beforeSchedule || afterSchedule) {
        list.push(
            Appointment.newUnavailableSlot({
                start: start,
                end: end
            })
        );
    }
    else if (insideSchedule) {
        list.push(
            Appointment.newFreeSlot({
                start: start,
                end: end
            })
        );
    }
    else {
        // Is in a intermediate position, needs two
        // or three slots
        var crossStart =
            start < from &&
            end > from;
        var crossEnd = 
            start < to &&
            end > to;

        if (crossStart) {
            // Unavailable slot until the 'from'
            list.push(
                Appointment.newUnavailableSlot({
                    start: start,
                    end: from
                })
            );
        }
        if (crossEnd) {
            // Unavailable after 'to'
            list.push(
                Appointment.newUnavailableSlot({
                    start: to,
                    end: end
                })
            );
        }

        if (crossStart && crossEnd) {
            // Full day free
            list.push(
                Appointment.newFreeSlot({
                    start: from,
                    end: to
                })
            );
        }
        else if (crossStart) {
            // Free slot until mid point
            list.push(
                Appointment.newFreeSlot({
                    start: from,
                    end: end
                })
            );
        }
        else if (crossEnd) {
            // Free slot from mid point
            list.push(
                Appointment.newFreeSlot({
                    start: start,
                    end: to
                })
            );
        }
    }
    
    // In the complex cases, is easy that the 
    // order gets inversed because of the if-else natural order
    // so ensure goes correct
    return list.sort(exports.sortAppointments);
};

/**
 * It generates an array of plain range objects ({ start:Date, end:Date })
 * in the local time for the given date, based on the user weekDaySchedule
 * and knowing the time zone for the time ranges defined in the schedule (that
 * must be converted to local time for the specific date).
 * Result returns slots that fills from midnight to midnight of date.
**/
exports.createFreeScheduleSlots = function (date, weeklySchedule) {
    var scheduleTimeZone = weeklySchedule.timeZone();
    var localStart = moment(date).startOf('day');
    // end of day will give a instant before midnight (like 23:59:59, 11:59pm)
    // if for some reason is preferred to visualize as midnight of next date 
    // just with replace .endOf('day') by .add(1, 'day') is enough.
    var localEnd = moment(date).endOf('day');
    var tzStart = localStart.clone().tz(scheduleTimeZone);
    var tzEnd = localEnd.clone().tz(scheduleTimeZone);

    var computeScheduleHoursAsLocal = function (weekDaySchedule, tzDateMoment) {
        return weekDaySchedule.map(function (range) {
            // Gets the date converted to the timezone and sets the time of the day
            // to the defined on the range (just go to the beggining of the date and append 
            // the time as a duration)
            // Convert that to a local Date object.
            return {
                start: tzDateMoment.clone().startOf('day').add(moment.duration(range.start())).toDate(),
                end: tzDateMoment.clone().startOf('day').add(moment.duration(range.end())).toDate()
            };
        });
    };

    var weekDayStart = tzStart.day();
    var schedule = weeklySchedule.weekDays[weekDayStart]();
    var locals = computeScheduleHoursAsLocal(schedule, tzStart);

    // When local and timeZone are at different offsets, will happen that they partially
    // match different week days at some points, because of that we compute not times
    // at the beggining date but the date at the end too. But only if different of course.
    var weekDayEnd = tzEnd.day();
    if (weekDayStart !== weekDayEnd) {
        schedule = weeklySchedule.weekDays[weekDayEnd]();
        locals = locals.concat(computeScheduleHoursAsLocal(schedule, tzEnd));
    }

    // Because for each 'tz date' we compute the full date schedule hours and may 
    // be different offset than the local natural date requested, we need to
    // filter values to only include ones from the date range
    var f = [];
    locals.forEach(function (range) {
        if (range.end <= localStart) return;
        if (range.start >= localEnd) return;
        f.push({
            start: new Date(Math.max(localStart, range.start)),
            end: new Date(Math.min(localEnd, range.end))
        });
    });
    return f;
};
