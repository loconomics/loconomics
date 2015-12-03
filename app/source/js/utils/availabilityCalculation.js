/**
    Set of functions to make calculations of availability
    per date given a list of appointments.
    It allows to sort them, create and insert free/unavailable appointments
    following a given daySchedule and summarize the date availability status.
    
    It relies (directly or not) in models like Appointment, 
    WeeklySchedule.WeekDaySchedule.
**/
'use strict';

var Appointment = require('../models/Appointment'),
    moment = require('moment');

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
    given week day schedule.
    The hours in the schedule are assumed in the local time.
    A new array is returned.
    It introduce 'preparation time' slots too before of bookings when needed.
    
    date is a Date object representing the same date as used in
    the appointmentsList; it's used when no appointments exists (so
    date cannot be extracted from first appointent) to return an empty
    date unavaialable/free/unavailable slots; and when filling preparation slots, to
    avoid add a slot with time that starts in a previous date
    
    TODO: Make it compatible with an initial appointment that may start before the 
    date (but ends inside the date) and a final appointment that may end
    on the next date (but starts inside the date).
**/
exports.fillDayAvailability = function fillDayAvailability(date, appointmentsList, weekDaySchedule, schedulingPreferences) {

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
        }, weekDaySchedule);
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
                }, weekDaySchedule));
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
            }, weekDaySchedule));
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
    
    weekDaySchedule is an instance of WeekDaySchedule Model, basically:
    { from:observable(Date), to:observable(Date) }
**/
exports.createScheduleSlots = function createScheduleSlots(range, weekDaySchedule) {
    /*jshint maxcomplexity:10*/
    var list = [],
        start = range.start,
        end = range.end,
        date = moment(start).startOf('day'),
        from = moment(date).add({ minutes: weekDaySchedule.from() }).toDate(),
        to = moment(date).add({ minutes: weekDaySchedule.to() }).toDate();

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
