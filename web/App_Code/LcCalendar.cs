using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CalendarDll;
using DDay.iCal;
using DDay.Collections;
using CalendarDll.Data;
using WebMatrix.Data;
using System.IO;

/// <summary>
/// Calendaring Tasks, wrapper for some CalendarDll features.
/// </summary>
public static partial class LcCalendar
{
    #region Booking
    public const string sqlInsBookingEvent = @"
        INSERT INTO [CalendarEvents]
                    ([UserId]
                    ,[CalendarAvailabilityTypeID]
                    ,[EventType]
                    ,[Summary]
                    ,[Description]
                    ,[StartTime]
                    ,[EndTime]
                    ,[TimeZone]
                    ,[CreatedDate]
                    ,[UpdatedDate]
                    ,[ModifyBy])
                VALUES (@0
                    ,@1
                    ,1 -- Booking
                    ,@2
                    ,@3
                    ,@4
                    ,@5
                    ,@6
                    ,getdate()
                    ,getdate()
                    ,'sys')
        SELECT Cast(@@Identity As int) As CalendarEventID
    ";
    public const string sqlUpdBookingEvent = @"
        UPDATE [CalendarEvents] SET
            [Summary] = coalesce(@4, Summary)
            ,[Description] = coalesce(@5, Description)
            ,[StartTime] = @1
            ,[EndTime] = @2
            ,[TimeZone] = coalesce(@3, TimeZone)
            ,[UpdatedDate] = getdate()
            ,[ModifyBy] = 'sys'
        WHERE Id = @0
    ";
    #endregion

    #region Availability

    /// <summary>
    /// Fixed values for each type syncrhonized with the database values
    /// for the table CalendarAvailabilityType
    /// </summary>
    public enum AvailabilityType : short
    {
        //"unavailable", "free", "busy", "tentative", "offline"
        Unavailable = 0,
        Free = 1,
        Busy = 2,
        Tentative = 3,
        Offline = 4
    }

    /// <summary>
    /// Get availability table for the user between given date and times
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="dateStart"></param>
    /// <param name="dateEnd"></param>
    /// <returns></returns>
    public static List<CalendarDll.ProviderAvailabilityResult> GetUserAvailability(int userID, DateTime dateStart, DateTime dateEnd)
    {
        var lcCalendar = new CalendarDll.CalendarUtils();
        return
            lcCalendar.GetFreeEvents(
                new CalendarDll.CalendarUser(userID),
                dateStart,
                dateEnd,
                DateTime.Now);
    }
    /// <summary>
    /// Check if the user is available for all the time between dateStart and dateEnd
    /// </summary>
    /// <param name="userID">UserID as in database</param>
    /// <param name="dateStart">Start date and time for the time range (greater or equals than dateStart)</param>
    /// <param name="dateEnd">End date and time for the time range (less than dateEnd)</param>
    /// <returns>True when is available, False when not</returns>
    public static bool CheckUserAvailability(int userID, DateTime dateStart, DateTime dateEnd)
    {
        foreach (var e in GetUserAvailability(userID, dateStart, dateEnd))
        {
            var edt = e.DateSet + e.TimeBlock;
            if ((e.CalendarAvailabilityTypeID == (int)CalendarDll.AvailabilityTypes.BUSY ||
                e.CalendarAvailabilityTypeID == (int)CalendarDll.AvailabilityTypes.UNAVAILABLE ||
                e.CalendarAvailabilityTypeID == (int)CalendarDll.AvailabilityTypes.TENTATIVE) &&
                edt >= dateStart &&
                edt < dateEnd)
                return false;
        }
        return true;
    }

    /// <summary>
    /// Check if the user has some block available for between dateStart and dateEnd.
    /// With almost one block available (free), will return true, and false for when there is
    /// no available block at all, just the opposite to GetUserAvailability.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="dateStart"></param>
    /// <param name="dateEnd"></param>
    /// <returns></returns>
    public static bool HasUserSomeAvailability(int userID, DateTime dateStart, DateTime dateEnd)
    {
        foreach (var e in GetUserAvailability(userID, dateStart, dateEnd))
        {
            var edt = e.DateSet + e.TimeBlock;
            if ((e.CalendarAvailabilityTypeID == (int)CalendarDll.AvailabilityTypes.FREE ||
                e.CalendarAvailabilityTypeID == (int)CalendarDll.AvailabilityTypes.TRANSPARENT) &&
                edt >= dateStart &&
                edt < dateEnd)
                return true;
        }
        return false;
    }
    #endregion

    #region Provider Work Hours (AKA Weekly Schedule)
    /// <summary>
    /// One day information about work hours,
    /// for generic week days.
    /// </summary>
    public class WorkHoursDay
    {
        public DayOfWeek DayOfWeek;
        public TimeSpan StartTime;
        public TimeSpan EndTime;
    }

    private static TimeSpan LastMinute = new TimeSpan(23, 59, 59);

    /// <summary>
    /// Retrieve a list of Events of type Work Hours of the provider
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static IEnumerable<WorkHoursDay> GetProviderWorkHours(int userID)
    {
        var ent = new loconomicsEntities();
        var events = ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();

        foreach (var ev in events)
        {
            foreach (var evr in ev.CalendarReccurrence)
            {
                foreach (var evrf in evr.CalendarReccurrenceFrequency)
                {
                    if (evrf.DayOfWeek.HasValue &&
                        evrf.DayOfWeek.Value > -1 &&
                        evrf.DayOfWeek.Value < 7)
                    {
                        // Getting startTime and endTime, being aware
                        // to return correctly fixed times.
                        var startTime = ev.StartTime.TimeOfDay;
                        var endTime = ev.EndTime.TimeOfDay;

                        // It must detects the all-day flag on the event
                        // returning the proper time:
                        if (ev.IsAllDay) {
                            startTime = TimeSpan.Zero;
                            endTime = LastMinute;
                        }

                        // If the end time is on the next day, is because
                        // is was set next day at 00:00 as the finish,
                        // support this by returning the correct last-day-time.
                        if (ev.EndTime.Date > ev.StartTime.Date)
                            endTime = LastMinute;

                        yield return new WorkHoursDay
                        {
                            DayOfWeek = (DayOfWeek)evrf.DayOfWeek.Value,
                            StartTime = startTime,
                            EndTime = endTime
                        };
                    }
                }
            }
        }
    }

    /// <summary>
    /// Deletes current user work hours and set the new provided as a list
    /// of day-slots work hours.
    /// This allows multiple slots (or hours ranges) in the same day, being more
    /// complete, detailed and versatile.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="workHoursList">In order to be more efficient on database, its expected
    /// that the workHours list to be as reduced as possible, what implies concatenate every
    /// 15 minutes time slot into hour-ranges of consecutive slots.</param>
    public static void SetAllProviderWorkHours(int userID, List<WorkHoursDay> workHoursList) {
        var ent = new loconomicsEntities();

        // Deleting previous records of work-day events:
        ent.Database.ExecuteSqlCommand("DELETE FROM CalendarEvents WHERE UserID = {0} AND EventType = 2", userID);

        /* ITS BY FAR FASTER -and more simple- doing the previous one-line manual SQL to delete the records
         * than the next -now commented- code that fetch, mark and remove the records in the EntityFramework way:
 
        // Find user events of type 'work-hours'
        var events = ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();
        // Remove that events: all will be replaced by the new ones
        // We are marking for deletion (that happens on 'SaveChanges'), but
        // still the extra 'ToList' is required to avoid an exception of kind 'collection modified in iterator'
        foreach (var ev in events.ToList())
        {
            ent.CalendarEvents.Remove(ev);
        }*/

        // Create all the new ones events, it allows multiple hour-ranges
        // in the same day.
        foreach(var workHoursDay in workHoursList) {
            var ev = CreateWorkHourEvent(userID, workHoursDay);
            // Add it for database
            ent.CalendarEvents.Add(ev);
        }

        // Send to database
        ent.SaveChanges();
    }

    public static CalendarEvents CreateWorkHourEvent(int userID, WorkHoursDay workHoursDay)
    {
        var allDay = workHoursDay.EndTime == TimeSpan.Zero && workHoursDay.StartTime == TimeSpan.Zero;

        // Start and End Dates are not used 'as is', they are
        // treated in a special way when recurrence rules are present,
        // for that we can use invented and convenient
        // dates as 2006-01-01 (the year 2006 matchs the first day in the first week day--1:Sunday);
        // the End Date will be greater thanks
        // to the hour information gathered from the user generic work hours
        var startDateTime = new DateTime(
            2006,
            1,
            1 + (int)workHoursDay.DayOfWeek,
            workHoursDay.StartTime.Hours,
            workHoursDay.StartTime.Minutes,
            workHoursDay.StartTime.Seconds
        );
        var endDateTime = new DateTime(
            2006,
            1,
            /* Must be the next day if end time is '00:00:00'; else the same day */
            (workHoursDay.EndTime == TimeSpan.Zero ? 2 : 1) + (int)workHoursDay.DayOfWeek,
            workHoursDay.EndTime.Hours,
            workHoursDay.EndTime.Minutes,
            workHoursDay.EndTime.Seconds
        );

        var newevent = new CalendarDll.Data.CalendarEvents();
        newevent.UserId = userID;
        // Type work-hours: 2
        newevent.EventType = 2;
        // Automatic text, irrelevant
        newevent.Summary = "Work hours";
        //newevent.Description = "";
        // free hours: 1
        newevent.CalendarAvailabilityTypeID = 1;
        newevent.Transparency = true;
        newevent.StartTime = startDateTime;
        newevent.EndTime = endDateTime;
        newevent.IsAllDay = allDay;
        newevent.UpdatedDate = DateTime.Now;
        newevent.CreatedDate = DateTime.Now;
        newevent.ModifyBy = "UserID:" + userID;

        // Recurrence rule:
        newevent.CalendarReccurrence.Add(new CalendarReccurrence
        {
            // Frequency Type Weekly:5
            Frequency = (int)DDay.iCal.FrequencyType.Weekly,
            // Every 1 week (week determined by previous Frequency)
            Interval = 1,
            // We need save as reference, the first day of week for this rrule:
            FirstDayOfWeek = (int)System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.FirstDayOfWeek,

            CalendarReccurrenceFrequency = new List<CalendarReccurrenceFrequency>
            {
                new CalendarReccurrenceFrequency
                {
                    ByDay = true,
                    DayOfWeek = (int)workHoursDay.DayOfWeek,
                    // FrequencyDay null, is for special values (first day on week, last,... not needed here)
                    FrequencyDay = null
                }
            }
        });

        return newevent;
    }

    /// <summary>
    /// It expectes the Json structure parsed created by calendar/get-availability?type=workHours
    /// and updated by the javascript availabilityCalendar.WorkHours component, its
    /// analized and saved into database reusing the other specific methods for save work hour events.
    /// 
    /// It does not save if there is no data (then, it doesn't allow to remove all workHours).
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="workhours"></param>
    /// <returns>It returns true if there was data and was saved, false otherwise</returns>
    public static bool SaveWorkHoursJsonData(int userId, dynamic workhours)
    {
        if (workhours == null || workhours.slots == null)
            return false;

        var thereIsData = false;

        var slotsGap = TimeSpan.FromMinutes(15);
        var slotsRanges = new List<LcCalendar.WorkHoursDay>();

        foreach (DayOfWeek wk in Enum.GetValues(typeof(DayOfWeek))) {
            var wday = wk.ToString().ToLower();

            if (workhours.slots[wday] != null) {

                var slots = new List<string>();
                slots.AddRange(workhours.slots[wday].Values<string>());
                slots.Sort();
                    
                var firstSlot = TimeSpan.MinValue;
                var lastSlot = TimeSpan.MinValue;
                foreach(var slot in slots) {
                    var slotTime = TimeSpan.Parse(slot);
                        
                    // first time
                    if (firstSlot == TimeSpan.MinValue) {
                        firstSlot = slotTime;
                        lastSlot = firstSlot;
                    }
                    else {
                        var expectedSlot = lastSlot.Add(slotsGap);

                        // If the expected end slot is not current
                        // then the range ended
                        if (slotTime > expectedSlot) {
                            // Add range to the list
                            // Note: we have slots by its start-time, by the
                            // range to save must include the end-time for the last slot
                            slotsRanges.Add(new LcCalendar.WorkHoursDay {
                                DayOfWeek = wk,
                                StartTime = firstSlot,
                                EndTime = lastSlot.Add(slotsGap)
                            });

                            // New range starts
                            firstSlot = slotTime;
                            lastSlot = slotTime;
                        } else {
                            // update last slot with the expected, contiguos slot
                            // to continue building the range
                            lastSlot = expectedSlot;
                        }
                    }
                }
                // Last range in the list (if there was something)
                // Note: we have slots by its start-time, but the
                // range to save must include the end-time for the last slot
                if (firstSlot != TimeSpan.MinValue) {
                    thereIsData = true;

                    // Calculations can have precision errors, be aware to don't pass a time
                    // after 24:00:00
                    var finalEndTime = lastSlot.Add(slotsGap);
                    if (finalEndTime.TotalHours >= 24.0)
                        finalEndTime = TimeSpan.Zero;

                    slotsRanges.Add(new LcCalendar.WorkHoursDay {
                        DayOfWeek = wk,
                        StartTime = firstSlot,
                        EndTime = finalEndTime
                    });
                }
            }
        }

        if (thereIsData)
        {
            // Saving in database
            SetAllProviderWorkHours(userId, slotsRanges);
        }

        return thereIsData;
    }

    /// <summary>
    /// It sets all time, all week days as available for the userId
    /// </summary>
    /// <param name="userId"></param>
    public static void SetAllTimeAvailability(int userId)
    {
        // Adds slots ranges for all day time each week day
        var workHoursList = new List<WorkHoursDay>();

        foreach(DayOfWeek wk in Enum.GetValues(typeof(DayOfWeek))) {
            workHoursList.Add(new WorkHoursDay {
                DayOfWeek = wk,
                StartTime = TimeSpan.Zero,
                EndTime = TimeSpan.Zero
            });
        }
        
        SetAllProviderWorkHours(userId, workHoursList);
    }

    /// <summary>
    /// Set a day work hours saving it as an Event on database
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="workHoursDay"></param>
    [Obsolete]
    public static void SetProviderWorkHours(int userID, WorkHoursDay workHoursDay) {
        var ent = new loconomicsEntities();

        // Start and End Dates are not used 'as is', they are
        // treated in a special way when recurrence rules are present,
        // for that we can use invented and convenient
        // dates as 2006-01-01 (the year 2006 matchs the first day in the first week day--1:Sunday);
        // the End Date will be greater thanks
        // to the hour information gathered from the user generic work hours
        var startDateTime = new DateTime(
            2006,
            1,
            1,
            workHoursDay.StartTime.Hours,
            workHoursDay.StartTime.Minutes,
            workHoursDay.StartTime.Seconds
        );
        var endDateTime = new DateTime(
            2006,
            1,
            /* Must be the next day if end time is '00:00:00'; else the same day */
            (workHoursDay.EndTime == TimeSpan.Zero ? 2 : 1),
            workHoursDay.EndTime.Hours,
            workHoursDay.EndTime.Minutes,
            workHoursDay.EndTime.Seconds
        );

        // Find user events of type 'work-hours'
        var events = ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();

        // Find the event with recurrence rule for the requested DayOfWeek
        var eventExists = false;
        foreach (var ev in events)
        {
            foreach (var evr in ev.CalendarReccurrence)
            {
                if (evr.CalendarReccurrenceFrequency.Where(c => c.DayOfWeek == (int)workHoursDay.DayOfWeek).Count() > 0)
                {
                    // There is an event with recurrence rule for this work-week-day
                    eventExists = true;
                    // update it with the new data:
                    ev.StartTime = startDateTime;
                    ev.EndTime = endDateTime;
                    ev.UpdatedDate = DateTime.Now;
                    ev.ModifyBy = "UserID:" + userID;
                }
            }
        }
        // If there is not still an event for the work day, create it:
        if (!eventExists)
        {
            var newevent = new CalendarDll.Data.CalendarEvents();
            newevent.UserId = userID;
            // Type work-hours: 2
            newevent.EventType = 2;
            // Automatic text, irrelevant
            newevent.Summary = "Work hours";
            //newevent.Description = "";
            // free hours: 1
            newevent.CalendarAvailabilityTypeID = 1;
            newevent.Transparency = true;
            newevent.StartTime = startDateTime;
            newevent.EndTime = endDateTime;
            newevent.IsAllDay = false;
            newevent.UpdatedDate = DateTime.Now;
            newevent.CreatedDate = DateTime.Now;
            newevent.ModifyBy = "UserID:" + userID;

            // Recurrence rule:
            newevent.CalendarReccurrence.Add(new CalendarReccurrence
            {
                // Frequency Type Weekly:5
                Frequency = (int)DDay.iCal.FrequencyType.Weekly,
                // Every 1 week (week determined by previous Frequency)
                Interval = 1,
                // We need save as reference, the first day of week for this rrule:
                FirstDayOfWeek = (int)System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.FirstDayOfWeek,

                CalendarReccurrenceFrequency = new List<CalendarReccurrenceFrequency>
                {
                    new CalendarReccurrenceFrequency
                    {
                        ByDay = true,
                        DayOfWeek = (int)workHoursDay.DayOfWeek,
                        // FrequencyDay null, is for special values (first day on week, last,... not needed here)
                        FrequencyDay = null
                    }
                }
            });

            // Add it to database
            ent.CalendarEvents.Add(newevent);
        }

        // Send to database
        ent.SaveChanges();
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="dayOfWeek"></param>
    [Obsolete]
    public static void DelProviderWorkHours(int userID, DayOfWeek dayOfWeek)
    {
        var ent = new loconomicsEntities();
        // Find user events of type 'work-hours'
        var events = ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();
        // On that events, found what match the recurrence-frequency of the given day,
        // and mark is for deletion:
        // The extra 'ToList' are required to avoid an exception of kind 'collection modified in iterator'
        foreach (var ev in events.ToList())
        {
            foreach (var evr in ev.CalendarReccurrence.ToList())
            {
                if (evr.CalendarReccurrenceFrequency.Where(c => c.DayOfWeek == (int)dayOfWeek).Count() > 0)
                {
                    ent.CalendarEvents.Remove(ev);
                }
            }
        }
        // Save to database: delete found event:
        ent.SaveChanges();
    }
    #endregion

    #region Full Dates availability appointments (AKA Monthly Schedule)
    public static int EventTypeMonthlySchedule = 6;

    /// <summary>
    /// It creates a full date event with type monthly-schedule
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="date"></param>
    /// <param name="AvailabilityTypeID">Most times is 'unavailable'</param>
    /// <returns></returns>
    public static CalendarEvents CreateMonthlyScheduleEvent(int userID, DateTime date, AvailabilityTypes AvailabilityTypeID = AvailabilityTypes.UNAVAILABLE)
    {
        var newevent = new CalendarDll.Data.CalendarEvents();
        newevent.UserId = userID;
        // Monthly schedule: 6
        newevent.EventType = EventTypeMonthlySchedule;
        // Automatic text, irrelevant
        newevent.Summary = "Appointment generated by the Monthly Schedule calendar";
        newevent.Description = "";
        newevent.CalendarAvailabilityTypeID = (int)AvailabilityTypeID;
        newevent.StartTime = date.Date;
        // EndTime must be Midnight of the next day, because being the same date (doesn't matters the IsAllDay flag)
        // the duration will take 0 and there will not be event, needs to be beggining of the next-day.
        newevent.EndTime = date.Date.AddDays(1);
        newevent.IsAllDay = true;
        newevent.UpdatedDate = DateTime.Now;
        newevent.CreatedDate = DateTime.Now;
        newevent.ModifyBy = "UserID:" + userID;

        return newevent;
    }

    /// <summary>
    /// Get the existent event of type monthly-schedule for the given date and do some 'sanitizing'.
    /// It there are several events (a previous error or bad manual input), others are removed and
    /// only one is left and returned.
    /// Some data on the event is normalized (ensuring is full date).
    /// The entity will need to be saved to ensure the changes are preserved.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="date"></param>
    /// <param name="ent"></param>
    /// <returns></returns>
    public static CalendarEvents GetMonthlyScheduleEvent(int userID, DateTime date, loconomicsEntities ent)
    {
        // Events for the date:
        var evs = ent.CalendarEvents.Where(e => e.UserId == userID && e.EventType == EventTypeMonthlySchedule && e.StartTime == date.Date);

        CalendarEvents ev = null;
        if (evs != null)
        {
            // Any excedent is removed
            var count = 0;
            foreach (var iev in evs.ToList())
            {
                count++;
                if (count == 1)
                {
                    ev = iev;
                    // Normalizing:
                    iev.StartTime = date.Date;
                    // EndTime must be Midnight of the next day, because being the same date (doesn't matters the IsAllDay flag)
                    // the duration will take 0 and there will not be event, needs to be beggining of the next-day.
                    iev.EndTime = date.Date.AddDays(1);
                    iev.IsAllDay = true;
                    iev.UpdatedDate = DateTime.Now;
                    iev.ModifyBy = "UserID:" + userID;
                }
                else
                {
                    ent.CalendarEvents.Remove(iev);
                }
            }
        }

        return ev;
    }

    /// <summary>
    /// Get Events of type monthly-schedule for the given dates range, including both dates of the range
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="dates"></param>
    /// <returns></returns>
    public static List<CalendarEvents> GetMonthlyScheduleEvents(int userID, DatesRange dates)
    {
        using (var ent = new loconomicsEntities())
        {
            return ent.CalendarEvents.Where(e => e.UserId == userID && e.EventType == EventTypeMonthlySchedule &&
                e.StartTime >= dates.Start.Date && e.StartTime <= dates.End.Date)
                .ToList();
        }
    }

    public static DatesRange SaveMonthlyCalendarJsonData(int userID, dynamic data)
    {
        var ent = new loconomicsEntities();
        // Max for Start and Min for End for easy comparision when filling
        // actual values later
        var range = new DatesRange(DateTime.MaxValue, DateTime.MinValue);

        if (data.slots != null)
        {
            foreach (var slot in data.slots)
            {
                var date = DateTime.Parse(slot.Name);
                // Updating dates range
                if (date < range.Start)
                    range.Start = date;
                if (date > range.End)
                    range.End = date;

                var avail = slot.Value;
                // We save only slots/appointments modified by the user
                if (avail.source == "user") {
                    // We need to find the event, if exists, from database
                    // on both cases:
                    // 1: if user did a double change (unmark & mark again) we can
                    // end up with duplicated events for the same date if we don't
                    // check it previously.
                    // 2: user unchecked a previous unavailable that is now available
                    // and then we need to remove it
                    var ev = GetMonthlyScheduleEvent(userID, date, ent);
                    if (avail.status == "available")
                    {
                        // Remove previous if exists
                        if (ev != null)
                        {
                            ent.CalendarEvents.Remove(ev);
                        }
                        // Do nothing if null, we don't need 'available' monthly-schedule events
                    }
                    else if (avail.status == "unavailable")
                    {
                        // Create if not exists
                        if (ev == null)
                        {
                            ev = CreateMonthlyScheduleEvent(userID, date, AvailabilityTypes.UNAVAILABLE);
                            // Add it for database
                            ent.CalendarEvents.Add(ev);
                        }
                        // Do nothing if not null, it was updated properly by GetMOnthlyScheduleEvent.
                    }
                }
            }
        }

        ent.SaveChanges();

        if (range.Start == DateTime.MaxValue)
            return null;
        else
            return range;
    }
    #endregion

    #region Booking events
    public static dynamic GetBookingEvents(int userID, DatesRange dates)
    {
        /*using (var ent = new loconomicsEntities())
        {
            return ent.CalendarEvents
                //.Include("CalendarAvailabilityType")
                //.Include("CalendarEventType")
                //.Include("CalendarReccurrence")
                //.Include("CalendarReccurrence.CalendarReccurrenceFrequency")
                .Where(c => c.UserId == userID && c.EventType == 1 &&
                c.StartTime >= dates.Start && c.StartTime <= dates.End)
                .ToList();
        }*/
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT
                    E.Id,
                    E.Summary,
                    E.StartTime,
                    E.EndTime,
                    B.BookingID
                FROM
                    CalendarEvents As E
                     INNER JOIN
                    Booking As B
                      ON E.Id = B.ConfirmedDateID
                WHERE
                    E.UserId = @0
                     AND
                    E.StartTime <= @2
                     AND
                    E.EndTime >= @1
                     AND
                    -- Only confirmed bookings still not performed/complete and not cancelled
                    B.BookingStatusID = 1
            ", userID, dates.Start, dates.End);
        }
    }
    #endregion

    #region Events in general
    /// <summary>
    /// Get Events for the user and given dates and types.
    /// Some fields and tables names are fixed to follow a common name-scheming.
    /// 
    /// TODO: Review the date range must be for the events Start and EndTime only
    /// or must consider multiple occurrences of recurrent events
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="types"></param>
    /// <param name="start"></param>
    /// <param name="end"></param>
    /// <returns></returns>
    public static dynamic GetUserEvents(int userID, int[] types = null, DateTime? start = null, DateTime? end = null, string[] includes = null, int eventID = 0)
    {
        types = types == null ? new int[]{} : types;
        includes = includes == null ? new string[]{} : includes;

        // Names fixes (urgg...) and
        // simplified subclasses
        includes = includes.ToList()
            .Replace("CalendarRecurrenceFrequency", "CalendarReccurrence.CalendarReccurrenceFrequency")
            .Replace("CalendarEventRecurrencesPeriodsList", "CalendarEventRecurrencesPeriodList")
            .Replace("CalendarEventRecurrencesPeriod", "CalendarEventRecurrencesPeriodList.CalendarEventRecurrencesPeriod")
            .Replace("CalendarEventExceptionsPeriod", "CalendarEventExceptionsPeriodsList.CalendarEventExceptionsPeriod")
            .Replace("CalendarRecurrence", "CalendarReccurrence")
            .ToArray();

        using (var ent = new loconomicsEntities())
        {
            var data = (System.Data.Entity.Infrastructure.DbQuery<CalendarEvents>)ent.CalendarEvents;
            foreach(var include in includes)
            {
                data = data.Include(include);
            }

            IQueryable<CalendarEvents> query;
            if (eventID > 0)
            {
                query = data
                .Where(c => c.UserId == userID && c.Id == eventID);
            }
            else
            {
                query = data
                .Where(c => c.UserId == userID && types.Contains(c.EventType) &&
                    (start.HasValue ? c.EndTime > start : true) &&
                    (end.HasValue ? c.StartTime < end : true));
            }

            return query
                .ToList()
                .Select(ev => new {
                    CalendarEventID = ev.Id,
                    UserID = ev.UserId,
                    CalendarEventTypeID = ev.EventType,
                    Summary = ev.Summary,
                    UID = ev.UID,
                    CalendarAvailabilityTypeID = ev.CalendarAvailabilityTypeID,
                    Transparency = ev.Transparency,
                    StartTime = ev.StartTime,
                    EndTime = ev.EndTime,
                    IsAllDay = ev.IsAllDay,
                    StampTime = ev.StampTime,
                    TimeZone = ev.TimeZone,
                    Priority = ev.Priority,
                    Location = ev.Location,
                    UpdatedDate = ev.UpdatedDate,
                    CreatedDate = ev.CreatedDate,
                    ModifyBy = ev.ModifyBy,
                    Class = ev.Class,
                    Organizer = ev.Organizer,
                    Sequence = ev.Sequence,
                    Geo = ev.Geo,
                    CalendarRecurrenceID = ev.RecurrenceId,
                    Description = ev.Description,
                    // NO published TimeBlock and DayOfWeek
                    // since are old and confusing fields,
                    // all that information comes with 
                    // the event recurrence details
                    //TimeBlock = ev.TimeBlock,
                    //DayOfWeek = ev.DayofWeek,

                    CalendarAvailabilityType = includes.Contains("CalendarAvailabilityType") ? new {
                        CalendarAvailabilityTypeID = ev.CalendarAvailabilityType.CalendarAvailabilityTypeID,
                        Name = ev.CalendarAvailabilityType.CalendarAvailabilityTypeName,
                        Description = ev.CalendarAvailabilityType.CalendarAvailabilityTypeDescription,
                        SelectableAs = ev.CalendarAvailabilityType.SelectableAs
                    } : null,

                    CalendarEventType = includes.Contains("CalendarEventType") ? new {
                        CalendarEventTypeID = ev.CalendarEventType.EventTypeId,
                        Name = ev.CalendarEventType.EventType,
                        DisplayName = ev.CalendarEventType.DisplayName,
                        Description = ev.CalendarEventType.Description
                    } : null,

                    CalendarRecurrence = includes.Contains("CalendarRecurrence") ? ev.CalendarReccurrence.Select(r => new {
                        CalendarRecurrenceID = r.ID,
                        Count = r.Count,
                        EvaluationMode = r.EvaluationMode,
                        CalendarRecurrenceFrequencyTypeID = r.Frequency,
                        Interval = r.Interval,
                        RestrictionType = r.RestristionType,
                        Until = r.Until,
                        FirstDayOfWeek = r.FirstDayOfWeek,

                        CalendarReccurrenceFrequency = includes.Contains("CalendarRecurrenceFrequency") ? r.CalendarReccurrenceFrequency.Select(f => new {
                            CalendarReccurrenceFrequencyID = f.ID,
                            ByDay = f.ByDay,
                            ByHour = f.ByHour,
                            ByMinute = f.ByMinute,
                            ByMonth = f.ByMonth,
                            ByMonthDay = f.ByMonthDay,
                            BySecond = f.BySecond,
                            BySetPosition = f.BySetPosition,
                            ByWeekNo = f.ByWeekNo,
                            ByYearDay = f.ByYearDay,
                            DayOfWeek = f.DayOfWeek,
                            ExtraValue = f.ExtraValue,
                            FrequencyDay = f.FrequencyDay
                        }) : null
                    }) : null,
                
                    CalendarEventComments = includes.Contains("CalendarEventComments") ? ev.CalendarEventComments.Select(r => new {
                        Comment = r.Comment,
                        CalendarEventCommentID = r.Id
                    }) : null,
                
                    CalendarEventExceptionsPeriodsList = includes.Contains("CalendarEventExceptionsPeriodsList") ? ev.CalendarEventExceptionsPeriodsList.Select(r => new {
                        CalendarEventExceptionsPeriodsListID = r.Id,
                    
                        CalendarEventExceptionsPeriod = includes.Contains("CalendarEventExceptionsPeriod") ? r.CalendarEventExceptionsPeriod.Select(p => new {
                            DateStart = p.DateStart,
                            DateEnd = p.DateEnd
                        }) : null
                    }) : null,
                
                    CalendarEventRecurrencesPeriodsList = includes.Contains("CalendarEventRecurrencesPeriodsList") ? ev.CalendarEventRecurrencesPeriodList.Select(r => new {
                        CalendarEventRecurrencesPeriodsListID = r.Id,
                    
                        CalendarEventRecurrencesPeriod = includes.Contains("CalendarEventRecurrencesPeriod") ? r.CalendarEventRecurrencesPeriod.Select(p => new {
                            DateStart = p.DateStart,
                            DateEnd = p.DateEnd
                        }) : null
                    }) : null,
                
                    CalendarEventsAttendees = includes.Contains("CalendarEventsAttendees" ) ? ev.CalendarEventsAttendees.Select(r => new {
                        CalendarEventsAttendeeID = r.Id,
                        Attendee = r.Attendee,
                        Role = r.Role,
                        Uri = r.Uri
                    }) : null,
                
                    CalendarEventsContacts = includes.Contains("CalendarEventsContacts") ? ev.CalendarEventsContacts.Select(r => new {
                        CalendarEventsContactID = r.Id,
                        Contact = r.Contact
                    }) : null
                });
        }
    }

    public static dynamic GetAvailabiliyTypes()
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT  CalendarAvailabilityTypeID As AvailabilityTypeID, SelectableAs As DisplayName
                FROM    CalendarAvailabilityType
                WHERE   LanguageID = @0 AND CountryID = @1
                        AND SelectableAs is not null
            ", LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
        }
    }

    public static dynamic GetEventTypes(bool onlySelectable)
    {
        using (var db = Database.Open("sqlloco"))
        {
            var sql = @"SELECT EventTypeID, EventType As InternalName, DisplayName FROM CalendarEventType";
            if (onlySelectable)
                sql += " WHERE DisplayName is not null";
            return db.Query(sql);
        }
    }

    #region Simplified Events API
    /// <summary>
    /// TODO Return Events records by dates-range or event ocurrences (so including recurrence ocurrences)
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="types"></param>
    /// <param name="start"></param>
    /// <param name="end"></param>
    /// <param name="eventID"></param>
    /// <returns></returns>
    public static IEnumerable<dynamic> GetSimplifiedEvents(int userID, int[] types = null, DateTime? start = null, DateTime? end = null, int eventID = 0)
    {
        types = types == null ? new int[] { } : types;
        var thereAreDates = start.HasValue || end.HasValue;

        if (!start.HasValue)
            start = DateTime.Today;
        if (!end.HasValue)
            end = start.Value.AddDays(7);

        // Avoid excessive date range, limiting to 90 days
        if (end.Value - start.Value > TimeSpan.FromDays(90))
        {
            end = start.Value.AddDays(90);
        }

        using (var ent = new loconomicsEntities())
        {
            var data = (System.Data.Entity.Infrastructure.DbQuery<CalendarEvents>)ent.CalendarEvents
                .Include("CalendarReccurrence")
                .Include("CalendarReccurrence.CalendarReccurrenceFrequency");

            IQueryable<CalendarEvents> query;
            if (eventID > 0)
            {
                query = data
                .Where(c => c.UserId == userID && c.Id == eventID);
            }
            else
            {
                query = data
                .Where(c => c.UserId == userID && types.Contains(c.EventType) &&
                    ((
                        // Dates Range
                        (c.EndTime > start) &&
                        (c.StartTime < end)
                     ) ||
                        // OR, if they are Recurrence, any Date Range
                        // (because its occurrences may happen inside the range)
                        c.CalendarReccurrence.Any()
                    )
                );
            }
            
            // iCalendar is needed to calculate each event occurrences
            var calUtils = new CalendarUtils();

            // TODO Support for real, user attached or event attached, Time Zones (the fields
            // exists, but has not valid values: user.TimeZone and event.TimeZone)
            //var tzid = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time").Id;
            var tzid = "Pacific Standard Time";

            foreach(var ev in query.ToList())
            {
                IEnumerable<dynamic> occurrences = null;

                // Occurrences are not calculated if a specific eventID was requested
                // without filtering dates (the possibility to set dates allow for query
                // occurrences of a specific event)
                if (eventID == 0 || thereAreDates)
                {
                    // Getting an iEvent only for recurrent events, for occurrences calculations
                    iEvent iev = ev.CalendarReccurrence.Count > 0 ? calUtils.CreateEvent(ev, tzid) : null;
                    if (iev != null)
                    {
                        // An iEvent needs to be attached to an iCalendar in order
                        // to work when getting the occurrences.
                        var iCal = calUtils.GetICalendarLibraryInstance();
                        iCal.Events.Add(iev);

                        // Getting occurrences datetime ranges
                        occurrences = iev.GetOccurrences(start.Value, end.Value).Select(oc => new
                        {
                            // Ugly conversion because of a bad internal conversion of iCalendar, treating the
                            // original value as UTC when is local time-zone based:
                            StartTime = new DateTime(oc.Period.StartTime.Ticks, DateTimeKind.Unspecified).ToUniversalTime(),
                            EndTime = new DateTime(oc.Period.EndTime.Ticks, DateTimeKind.Unspecified).ToUniversalTime()
                        });

                        // If there are no occurrences for the expected date time range, no need 
                        // to include the event (an occurrence is returned too for the first
                        // time the event happen, not only for repetitions, so is OK do it this way),
                        // so we continue with the next discarding the current.
                        if (occurrences.Count() == 0)
                        {
                            continue;
                        }
                    }
                }

                yield return new {
                    CalendarEventID = ev.Id,
                    UserID = ev.UserId,
                    EventTypeID = ev.EventType,
                    Summary = ev.Summary,
                    //UID = ev.UID,
                    AvailabilityTypeID = ev.CalendarAvailabilityTypeID,
                    //Transparency = ev.Transparency,
                    // Providing UTC ever as result (for JSON output)
                    StartTime = ev.StartTime.ToUniversalTime(),
                    EndTime = ev.EndTime.ToUniversalTime(),
                    Kind = ev.StartTime.Kind,
                    IsAllDay = ev.IsAllDay,
                    //StampTime = ev.StampTime,
                    // The source timezone, if any, the dates will be on UTC.
                    TimeZone = ev.TimeZone,
                    //Priority = ev.Priority,
                    Location = ev.Location,
                    UpdatedDate = ev.UpdatedDate,
                    CreatedDate = ev.CreatedDate,
                    //ModifyBy = ev.ModifyBy,
                    //Class = ev.Class,
                    //Organizer = ev.Organizer,
                    //Sequence = ev.Sequence,
                    //Geo = ev.Geo,
                    //CalendarRecurrenceID = ev.RecurrenceId,
                    Description = ev.Description,
                    RecurrenceRule = GetSimplifiedRecurrenceRule(ev.CalendarReccurrence),
                    RecurrenceOccurrences = occurrences,
                    ReadOnly = ReadOnlyEventTypes.Contains(ev.EventType)
                };
            }
        }
    }

    /// <summary>
    /// Events of type 'booking', 'imported' and 'monthly schedule'
    /// cannot be directly edited.
    /// A booking event gets edited from editing its booking.
    /// Other types can be edited/created/deleted from a specific
    /// API (monthly and weekly schedule, booking events).
    /// </summary>
    public static readonly int[] ReadOnlyEventTypes = new int[] { 1, 2, 4, 6 };

    public static int SetSimplifiedEvent(int UserID, int CalendarEventID,
        int EventTypeID,
        int AvailabilityTypeID,
        string Summary,
        DateTime StartTime,
        DateTime EndTime,
        bool IsAllDay,
        string Location,
        string Description,
        string TimeZone,
        SimplifiedRecurrenceRule RRule)
    {
        if (CalendarEventID > 0)
        {
            var previousItem = GetSimplifiedEvents(UserID, null, null, null, CalendarEventID).FirstOrDefault();

            // Avoid standard edition of read-only types,
            // and conversion of an editable into a non editable event:
            if (previousItem == null ||
                ReadOnlyEventTypes.Contains((int)previousItem.EventTypeID) ||
                ReadOnlyEventTypes.Contains(EventTypeID))
                throw new ConstraintException("Cannot be inserted/updated");
        }

        int? repeatFrequency = null;
        List<int> selectedWeekDays = null;

        if (RRule != null)
        {
            repeatFrequency = RRule.FrequencyTypeID;
            selectedWeekDays = RRule.SelectedWeekDays;

            // Special frequencies with an ID of 2-hundred have forced
            // an interval/repeatEvery value of 2
            if ((int)repeatFrequency / 100 == 2)
            {
                RRule.Interval = 2;
                // And the code of frequency MUST be changed to its 'real' equivalent:
                repeatFrequency -= 200;
            }
            // Weekly frequency presets: 5 hundred values
            if ((int)repeatFrequency / 100 == 5)
            {
                // Interval to 1
                RRule.Interval = 1;
                // Set week-days
                selectedWeekDays.Clear();
                if (repeatFrequency == 501 || repeatFrequency == 502)
                {
                    selectedWeekDays.Add((int)DayOfWeek.Monday);
                    selectedWeekDays.Add((int)DayOfWeek.Wednesday);
                    selectedWeekDays.Add((int)DayOfWeek.Friday);
                }
                if (repeatFrequency == 501 || repeatFrequency == 503)
                {
                    selectedWeekDays.Add((int)DayOfWeek.Tuesday);
                    selectedWeekDays.Add((int)DayOfWeek.Thursday);
                }
                // Finally, set frequency to 'weekly':
                repeatFrequency = 5;
            }
        }

        return SetUserAppointment(UserID,
            CalendarEventID,
            EventTypeID,
            AvailabilityTypeID,
            Summary,
            StartTime,
            EndTime,
            IsAllDay,
            RRule != null,
            repeatFrequency ?? 1,
            RRule != null ? RRule.Interval : 0,
            RRule != null ? RRule.Until : null,
            RRule != null ? RRule.Count : null,
            Location,
            Description,
            selectedWeekDays,
            RRule != null ? RRule.MonthlyWeekDay ? "week-day" : "month-day" : null,
            TimeZone
        );
    }

    /// <summary>
    /// Deletes and returns the deleted event, or null if doesn't exists.
    /// Blocks deletion of ReadOnly Types.
    /// </summary>
    /// <param name="UserID"></param>
    /// <param name="CalendarEventID"></param>
    /// <returns></returns>
    public static dynamic DelSimplifiedEvent(int UserID, int CalendarEventID)
    {
        var item = GetSimplifiedEvents(UserID, null, null, null, CalendarEventID).First();

        if (item)
        {
            // Avoid standard edition of read-only types
            if (ReadOnlyEventTypes.Contains((int)item.EventTypeID))
                throw new ConstraintException("Cannot be deleted");

            DelUserAppointment(UserID, CalendarEventID);
        }

        return item;
    }

    public class SimplifiedRecurrenceRule
    {
        /// <summary>
        /// Type frequency choosen, for example 'monthly, daily, yearly'.
        /// </summary>
        public int FrequencyTypeID;
        /// <summary>
        /// Frequency amount of the repetition,
        /// 'repeat every Interval days/months/years/etc.'.
        /// Its 1 by default.
        /// </summary>
        public int Interval;
        /// <summary>
        /// Date when repetition ends, if Ending is 'date'
        /// </summary>
        public DateTime? Until;
        /// <summary>
        /// Number of ocurrences for the repetition,
        /// if Ending is 'ocurrences'
        /// </summary>
        public int? Count;
        /// <summary>
        /// String enumeration describing the kind of ending
        /// of the recurrence, could be:
        /// - never: never ends (default)
        /// - date: ends on the Until date
        /// - ocurrences: ends after Count ocurrences
        /// </summary>
        public string Ending;
        /// <summary>
        /// List of week days when repetition must happens,
        /// for weekly frequencies.
        /// Sunday is 0 up to Saturday 6.
        /// </summary>
        public List<int>SelectedWeekDays;
        /// <summary>
        /// It specifies if the recurrence for a Montly Frequency (6)
        /// happens the day of the month (false)
        /// or the day of the week (true).
        /// Its false by default.
        /// </summary>
        public bool MonthlyWeekDay;
        /// <summary>
        /// It specifies if the parsed recurrence rule has set
        /// options incompatible with the simplified recurrence
        /// rule description that this object can hold.
        /// </summary>
        public bool Incompatible;
        /// <summary>
        /// It specifies if the parsed recurrences object has
        /// more than one rule specified, too many to be managed
        /// by the this simplification scheme, so only the 
        /// first rule is included.
        /// </summary>
        public bool TooMany;
        public SimplifiedRecurrenceRule() { }
    }

    public static SimplifiedRecurrenceRule GetSimplifiedRecurrenceRule(IEnumerable<CalendarReccurrence> calRecurrences)
    {
        if (calRecurrences == null)
            return null;
        else
        {
            SimplifiedRecurrenceRule rrule = null;
            foreach (var rec in calRecurrences)
            {
                if (rrule == null)
                {
                    rrule = GetSimplifiedRecurrenceRule(rec);
                }
                else
                {
                    rrule.TooMany = true;
                    break;
                }
            }
            return rrule;
        }
    }

    /// <summary>
    /// Get an object with the Recurrence Rule options of a database record
    /// for a recurrence.
    /// Its a simplification of the common used options.
    /// </summary>
    /// <param name="calRecurrence"></param>
    /// <returns></returns>
    public static SimplifiedRecurrenceRule GetSimplifiedRecurrenceRule(CalendarReccurrence calRecurrence)
    {
        if (calRecurrence == null || !calRecurrence.Frequency.HasValue)
            return null;

        List<int> selectedWeekDays = new List<int>();
        var monthlyWeekDay = false;
        int repeatFrequency = calRecurrence.Frequency.Value;
        var recEnds = "never";
        bool incompatible = false;

        if (calRecurrence.Until != null) {
            recEnds = "date";
        } else if (calRecurrence.Count != null && calRecurrence.Count > 0) {
            recEnds = "ocurrences";
        }

        if (calRecurrence.CalendarReccurrenceFrequency != null && calRecurrence.CalendarReccurrenceFrequency.Count > 0)
        {
            foreach (var rf in calRecurrence.CalendarReccurrenceFrequency)
            {
                if (rf.DayOfWeek.HasValue &&
                    !selectedWeekDays.Contains(rf.DayOfWeek.Value))
                {
                    selectedWeekDays.Add(rf.DayOfWeek.Value);
                }
                // If monthly, we check that there are almost one frequency record
                // that has a ByDay:true, FrequencyDay, and DayOfWeek
                // to detect that was set the 'week-day' option.
                if (repeatFrequency == 6 &&
                    rf.ByDay.HasValue && rf.ByDay.Value &&
                    rf.DayOfWeek.HasValue &&
                    rf.FrequencyDay.HasValue)
                {
                    monthlyWeekDay = true;
                }

                // Check incompatible options for the simplified scheme
                if ((rf.ByHour.HasValue && rf.ByHour.Value) ||
                    (rf.ByMinute.HasValue && rf.ByMinute.Value) ||
                    (rf.ByMonth.HasValue && rf.ByMonth.Value) ||
                    //(rf.ByMonthDay.HasValue && rf.ByMonthDay.Value) || // TODO Only if different from the Startdate->MonthDay
                    (rf.BySecond.HasValue && rf.BySecond.Value) ||
                    (rf.BySetPosition.HasValue && rf.BySetPosition.Value) ||
                    (rf.ByWeekNo.HasValue && rf.ByWeekNo.Value)
                    //(rf.ByYearDay.HasValue && rf.ByYearDay.Value) // TODO Only if different from the Startdate->YearDay
                    )
                    incompatible = true;
            }
            // Only if there are week-days
            if (selectedWeekDays.Count > 0)
            {
                // Detect Weekly frequency Presets:
                if (repeatFrequency == 5)
                {
                    if (selectedWeekDays.Count == 3 &&
                        selectedWeekDays.Contains((int)DayOfWeek.Monday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Wednesday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Friday))
                    {
                        repeatFrequency = 502;
                    }
                    if (selectedWeekDays.Count == 2 &&
                        selectedWeekDays.Contains((int)DayOfWeek.Tuesday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Thursday))
                    {
                        repeatFrequency = 503;
                    }
                    if (selectedWeekDays.Count == 5 &&
                        selectedWeekDays.Contains((int)DayOfWeek.Monday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Tuesday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Wednesday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Friday) &&
                        selectedWeekDays.Contains((int)DayOfWeek.Thursday))
                    {
                        repeatFrequency = 501;
                    }
                }
            }
        }

        return new SimplifiedRecurrenceRule {
            FrequencyTypeID = repeatFrequency,
            Interval = calRecurrence.Interval.HasValue ? calRecurrence.Interval.Value : 1,
            Until = calRecurrence.Until,
            Count = calRecurrence.Count,
            Ending = recEnds,
            SelectedWeekDays = selectedWeekDays,
            MonthlyWeekDay = monthlyWeekDay,
            Incompatible = incompatible
        };
    }
    #endregion
    #endregion

    #region Appointments (custom user events)
    public static List<CalendarEvents> GetUserAppointments(int userID)
    {
        using (var ent = new loconomicsEntities())
        {
            return ent.CalendarEvents
                .Include("CalendarAvailabilityType")
                .Include("CalendarEventType")
                .Include("CalendarReccurrence")
                .Include("CalendarReccurrence.CalendarReccurrenceFrequency")
                .Where(c => c.UserId == userID && (c.EventType == 3 || c.EventType == 5))
                .ToList();
        }
    }
    public static CalendarEvents GetUserAppointment(int userID, int eventID)
    {
        using (var ent = new loconomicsEntities())
        {
            return ent.CalendarEvents
                .Include("CalendarReccurrence")
                .Include("CalendarReccurrence.CalendarReccurrenceFrequency")
                .Where(c => c.UserId == userID && c.Id == eventID).FirstOrDefault();
         }
    }
    public static int SetUserAppointment(int userID, int CalendarEventID,
        int EventTypeID,
        int AvailabilityTypeID,
        string Summary,
        DateTime StartTime,
        DateTime EndTime,
        bool IsAllDay,
        bool IsRecurrent,
        int RecurrenceFrequencyID,
        int RecurrenceInterval,
        DateTime? RecurrenceEndDate,
        int? RecurrenceOccurrencesNumber,
        string Location,
        string Description,
        List<int> WeekDays = null,
        string monthlyOption = "month-day",
        string TimeZone = null)
    {
        using (var ent = new loconomicsEntities())
        {
            var dbevent = ent.CalendarEvents.Find(CalendarEventID);
            if (dbevent == null)
            {
                // Deleted or bad ID
                if (CalendarEventID > 0)
                    return -1;

                // New one to be created:
                dbevent = ent.CalendarEvents.Create();
                ent.CalendarEvents.Add(dbevent);
                dbevent.UserId = userID;
                dbevent.CreatedDate = DateTime.Now;
            } else if (dbevent.UserId != userID)
                return -2;

            // Dates swap
            if (EndTime < StartTime){
                var dt = EndTime;
                EndTime = StartTime;
                StartTime = dt;
            }

            // Auto TimeZone to server local
            if (String.IsNullOrEmpty(TimeZone))
            {
                TimeZone = System.TimeZone.CurrentTimeZone.GetUtcOffset(DateTime.Now).ToString("t");
            }

            dbevent.EventType = EventTypeID;
            dbevent.CalendarAvailabilityTypeID = AvailabilityTypeID;
            dbevent.Summary = Summary;
            dbevent.StartTime = StartTime;
            // Carefull with EndTime: if the event is fullday (or finish at 12:00AM/00:00, thats the same)
            // and StartTime and EndTime are the same date
            // the event will take 0 as duration, we must select the next day in EndTime to get successfully
            // the full StartTime day.
            if (EndTime.Date == StartTime.Date && (EndTime.TimeOfDay == TimeSpan.Zero || IsAllDay))
                EndTime = EndTime.AddDays(1);
            dbevent.EndTime = EndTime;
            dbevent.IsAllDay = IsAllDay;
            dbevent.TimeZone = TimeZone;
            dbevent.Location = Location;
            dbevent.Description = Description;

            dbevent.UpdatedDate = DateTime.Now;
            dbevent.ModifyBy = "sys";

            // Reset (remove) curren recurrent rules
            foreach (var rRule in dbevent.CalendarReccurrence.ToList())
            {
                foreach (var rFreq in rRule.CalendarReccurrenceFrequency.ToList())
                {
                    ent.CalendarReccurrenceFrequency.Remove(rFreq);
                }
                ent.CalendarReccurrence.Remove(rRule);
            }

            if (IsRecurrent)
            {
                CalendarReccurrence rRule = ent.CalendarReccurrence.Create();
                rRule.CalendarEvents = dbevent;
                ent.CalendarReccurrence.Add(rRule);

                rRule.Frequency = RecurrenceFrequencyID;
                rRule.Interval = RecurrenceInterval;
                rRule.Until = RecurrenceEndDate;
                rRule.Count = RecurrenceOccurrencesNumber < 1 ? null : RecurrenceOccurrencesNumber;
                // We need save as reference, the first day of week for this rrule:
                rRule.FirstDayOfWeek = (int)System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.FirstDayOfWeek;

                // If weekly, save WeekDays
                if (WeekDays != null && RecurrenceFrequencyID == (int)FrequencyType.Weekly)
                {
                    foreach (var weekday in WeekDays)
                    {
                        rRule.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency{
                            ByDay = true,
                            DayOfWeek = weekday,
                            // FrequencyDay null, is for special values (first day on week, last,... not needed here)
                            FrequencyDay = null
                        });
                    }
                }
                // If monthly, and valid monthlyOption, save month frequency
                if (RecurrenceFrequencyID == (int)FrequencyType.Monthly &&
                    new string[]{"month-day", "week-day"}.Contains(monthlyOption))
                {
                    switch (monthlyOption)
                    {
                        case "month-day":
                            // Its the default option, but let us be explicit:
                            rRule.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency{
                                ByMonthDay = true,
                                ExtraValue = StartTime.Day
                            });
                            break;
                        case "week-day":
                            rRule.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency{
                                ByDay = true,
                                DayOfWeek = (int)StartTime.DayOfWeek,
                                FrequencyDay = ASP.LcHelpers.NthWeekDayInMonth(StartTime)
                            });
                            break;
                    }
                }
            }
            ent.SaveChanges();

            return dbevent.Id;
        }
    }
    public static void DelUserAppointment(int userID, int CalendarEventID)
    {
        using (var ent = new loconomicsEntities())
        {
            var dbevent = ent.CalendarEvents.Find(CalendarEventID);
            if (dbevent != null && dbevent.UserId == userID)
                ent.CalendarEvents.Remove(dbevent);
            ent.SaveChanges();
        }
    }
    #endregion

    #region iCal sync: import/export
    private static uint FutureMonthsLimitForImportingFreeBusy = 2;
    /// <summary>
    /// Import a calendar in iCalendar format at the given CalendarURL for the UserID
    /// </summary>
    /// <param name="UserID">ID of the user in that calendar will be imported</param>
    /// <param name="CalendarURL">URL to retrieve the calendar data as iCalendar format</param>
    public static void Import(int UserID, string CalendarURL)
    {
#if DEBUG
        // PERF::
        if (LastBulkImport != null)
            LastBulkImport.SetTime("BulkImport:: Import " + UserID.ToString() + ":: Downloading+parsing ical");
#endif

        var iCaltoImport = iCalendar.LoadFromUri(new Uri(CalendarURL));
        if (iCaltoImport == null)
            throw new Exception("The URL doesn't contains icalendar information, is the correct URL? " + CalendarURL);

#if DEBUG
        // PERF::
        if (LastBulkImport != null)
            LastBulkImport.StopTime("BulkImport:: Import " + UserID.ToString() + ":: Downloading+parsing ical");

        // PERF::
        if (LastBulkImport != null)
            LastBulkImport.SetTime("BulkImport:: Import " + UserID.ToString() + ":: Importing ical");
#endif

        CalendarUtils libCalendarUtil = new CalendarUtils();
        libCalendarUtil.FutureMonthsLimitForImportingFreeBusy = FutureMonthsLimitForImportingFreeBusy;

#if DEBUG
        // PERF::
        libCalendarUtil.LastImportTimeline = LastBulkImport;
#endif
        var calUser = new CalendarUser(UserID);
        if (calUser.Id == 0)
        {
            throw new Exception("The UserID " + UserID + " doesn't exist on database, only its calendar URL " + CalendarURL);
        }
        libCalendarUtil.ImportCalendar(iCaltoImport, calUser);

#if DEBUG
        // PERF::
        if (LastBulkImport != null)
            LastBulkImport.StopTime("BulkImport:: Import " + UserID.ToString() + ":: Importing ical");
#endif
    }
    public static void Import(int UserID, Stream CalendarStream)
    {
        var iCaltoImport = iCalendar.LoadFromStream(CalendarStream);

        CalendarUtils libCalendarUtil = new CalendarUtils();
        libCalendarUtil.FutureMonthsLimitForImportingFreeBusy = FutureMonthsLimitForImportingFreeBusy;
        libCalendarUtil.ImportCalendar(iCaltoImport, new CalendarUser(UserID));
    }
    /// <summary>
    /// Tracks the timeline of the last bulk import execution if the app is in DEBUG mode.
    /// </summary>
    public static Srl.Timeline LastBulkImport;
    /// <summary>
    /// Perform calendar import on every user with importation enabled in its
    /// calendar settings.
    /// </summary>
    /// <returns>Per each provider with importation enabled, returns an Exception object
    /// as null if all works fine and imporation was successful for that and the
    /// generated exception if something is wrong and importation fails.</returns>
    public static IEnumerable<Exception> BulkImport()
    {
#if DEBUG
        LastBulkImport = new Srl.Timeline();

        // PERF::
        LastBulkImport.SetTime("BulkImport");
#endif

        using (var db = Database.Open("sqlloco"))
        {
            // NOTE: The initial of don't get from database the null or empty/white CalendarURL is not good
            // since we need to iterate that too in order to remove any previous data on profiles that had
            // an URL but gets removed lately.
            foreach (var p in db.Query("SELECT UserID, CalendarURL FROM CalendarProviderAttributes")) // WHERE dbo.fx_IfNW(CalendarURL, null) is not null"))
            {
                if (!LcValidators.IsUrl(p.CalendarURL))
                {
                    // Remove old events, to avoid persist bad data
                    RemoveImportedEventsForUser(p.UserID);

                    // Return error for not null or empty, only malformed
                    if (!String.IsNullOrWhiteSpace(p.CalendarURL))
                    {
                        yield return new Exception(String.Format("Calendar Import error on UserID:{0} : URL is not valid '{1}'", p.UserID, p.CalendarURL));
                    }
                    continue;
                }
                Exception resultEx = null;
                try
                {
#if DEBUG
                    // PERF::
                    LastBulkImport.SetTime("BulkImport:: Import " + p.UserID.ToString());
#endif

                    Import(p.UserID, p.CalendarURL);

#if DEBUG
                    // PERF::
                    LastBulkImport.StopTime("BulkImport:: Import " + p.UserID.ToString());
#endif
                }
                catch (Exception ex)
                {
                    resultEx = new Exception(String.Format("Calendar Import error on UserID:{0} : Internal error processing iCalendar", p.UserID), ex);
                }
                yield return resultEx;
            }
        }

#if DEBUG
        // PERF::
        LastBulkImport.StopTime("BulkImport");
#endif
    }
    /// <summary>
    /// Generate an iCalendar file to export booking events of the given UserID.
    /// </summary>
    /// <param name="UserID">Identifier of user wich calendar will be generated</param>
    /// <returns>
    /// Serialized iCalendar file as a Tuple with:
    /// Item1 = binary file content, Item2 = filepath
    /// </returns>
    public static Tuple<byte[], string> Export(int UserID)
    {
        CalendarUtils libCalendarUtils = new CalendarUtils();
        var calUser = new CalendarUser(UserID);
        // Get User Time Zone
        var userinfo = LcData.UserInfo.GetUserRowWithContactData(UserID);
        if (userinfo != null)
        {
            //var tznumber = userinfo.TimeZone;
            // TODO: for now, the value from database is discarted, an offset is not valid, we need a name, I set the only
            // one used today (on iCalendar, the CreateEvent discards the event.TimeZone too):
            TimeZoneInfo tz = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
            calUser.DefaultTimeZone = tz;
        }
        return libCalendarUtils.PrepareExportDataForUser(calUser);
    }

    /// <summary>
    /// Remove all imported events of the userID
    /// </summary>
    /// <param name="userID"></param>
    public static void RemoveImportedEventsForUser(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute("DELETE FROM CalendarEvents WHERE UserID=@0 AND EventType=@1", userID, 4);
        }
    }
    #endregion

    #region Frequency Types
    public class FrequencyTypeDescriptor
    {
        public int ID;
        public string Name;
        public string UnitPlural;
        public string UnitSingular;
    }
    public static Dictionary<int, FrequencyTypeDescriptor> RecurrenceFrequencyTypesIndexed = new Dictionary<int,FrequencyTypeDescriptor>{
        { 
            (int)FrequencyType.Daily,
            new FrequencyTypeDescriptor {
                ID = (int)FrequencyType.Daily,
                Name = "Daily",
                UnitPlural = "Days",
                UnitSingular = "Day"
            }
        },
        { 
            501,
            new FrequencyTypeDescriptor {
                ID = 501,
                Name = "Every weekday (Monday to Friday)"
            }
        },
        { 
            502,
            new FrequencyTypeDescriptor {
                ID = 502,
                Name = "Every Monday, Wednesday, and Friday"
            }
        },
        { 
            503,
            new FrequencyTypeDescriptor {
                ID = 503,
                Name = "Every Tuesday, and Thursday"
            }
        },
        {
            (int)FrequencyType.Weekly,
            new FrequencyTypeDescriptor {
                ID = (int)FrequencyType.Weekly,
                Name = "Weekly",
                UnitPlural = "Weeks",
                UnitSingular = "Week"
            }
        },
        {
            (int)FrequencyType.Monthly,
            new FrequencyTypeDescriptor {
                ID = (int)FrequencyType.Monthly,
                Name = "Monthly",
                UnitPlural = "Months",
                UnitSingular = "Month"
            }
        },
        {
            (int)FrequencyType.Yearly,
            new FrequencyTypeDescriptor {
                ID = (int)FrequencyType.Yearly,
                Name = "Yearly",
                UnitPlural = "Years",
                UnitSingular = "Year"
            }
        }
    };
    /// <summary>
    /// Returns a list of frequency types to be displayed for user selection.
    /// It includes real frequencies and special ones that are modifications or presets
    /// for real frequency, interval, extra-value.
    /// Special frequencies has ID >= 100
    /// ID > 200  sets for normal types that has implicit interval of 2
    /// ID > 500  sets for presets using Weekly frequency
    /// </summary>
    /// <returns></returns>
    public static IEnumerable<FrequencyTypeDescriptor> GetRecurrenceFrequencyTypes()
    {
        yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Daily,
            Name = "Daily",
            UnitPlural = "Days"
        };
        yield return new FrequencyTypeDescriptor {
            ID = 501,
            Name = "Every weekday (Monday to Friday)"
        };
        yield return new FrequencyTypeDescriptor {
            ID = 502,
            Name = "Every Monday, Wednesday, and Friday"
        };
        yield return new FrequencyTypeDescriptor {
            ID = 503,
            Name = "Every Tuesday, and Thursday"
        };
        yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Weekly,
            Name = "Weekly",
            UnitPlural = "Weeks"
        };
        /*yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Weekly + 200,
            Name = "Bi-Weekly"
        };*/
        yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Monthly,
            Name = "Monthly",
            UnitPlural = "Months"
        };
        /*yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Monthly + 200,
            Name = "Bi-Monthly"
        };*/
        yield return new FrequencyTypeDescriptor {
            ID = (int)FrequencyType.Yearly,
            Name = "Yearly",
            UnitPlural = "Years"
        };

        /* DB version:: */
        /*
        using (var db = Database.Open("sqlloco")) {
            foreach (var f in db.Query(@"
                SELECT  ID, FrequencyType, UnitPlural
                FROM    CalendarRecurrenceFrequencyTypes
                WHERE   ID > 0
            ")) {
                return new FrequencyTypeDescriptor {
                    ID = f.ID,
                    Name = f.FrequencyType,
                    UnitPlural = f.UnitPlural
                };
            }
        }
        */
    }
    #endregion

    #region Provider Attributes (shared calendar syncing and scheduling preferences)
    public static dynamic GetCalendarAttributes(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QuerySingle("EXEC GetUserCalendarProviderAttributes @0", userID);
        }
    }
    #endregion

    #region Calendar Syncing
    public static string ResetIcalendarExportUrl(int userID){
        using (var db = Database.Open("sqlloco")) {
            var newtoken = LcEncryptor.GenerateRandomToken(userID.ToString());
            
            db.Execute("SetCalendarProviderAttributes @0, null, null, null, @1",
                userID, 
                newtoken
            );
            
            db.Execute("EXEC TestAlertAvailability @0", userID);

            return newtoken;
        }
    }

    public static void SetIcalendarImportUrl(int userID, string icalImportURL)
    {
        using (var db = Database.Open("sqlloco")) {
            db.Execute("SetCalendarProviderAttributes @0, null, null, @1, null", userID, icalImportURL);
                
            db.Execute("EXEC TestAlertAvailability @0", userID);
        }
    }

    public static string BuildIcalendarExportUrl(int userID, string privateUrlToken) {
        return (LcUrl.AppUrl + "Calendar/" + userID + "/" + privateUrlToken + "/ical/");
    }

    public class RestSyncingOptions
    {
        public string icalExportUrl;
        public string icalImportUrl;
    }

    /// <summary>
    /// Get the Syncing Options in a suitable way for the REST API.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static dynamic GetRestCalendarSyncingOptions(int userID)
    {
        var atts = GetCalendarAttributes(userID);

        // Ever must exist the record, if not, its forced to be
        // created, and the just created data is fetched
        if (atts == null)
        {
            SetIcalendarImportUrl(userID, "");
            atts = GetCalendarAttributes(userID);
        }

        var privateCalendarToken = atts.PrivateCalendarToken;

        if (String.IsNullOrEmpty(privateCalendarToken)) {
            privateCalendarToken = LcCalendar.ResetIcalendarExportUrl(userID);
        }

        return new RestSyncingOptions {
            icalImportUrl = atts.CalendarURL,
            icalExportUrl = BuildIcalendarExportUrl(userID, privateCalendarToken)
        };
    }
    #endregion

    #region Scheduling Preferences
    public class RestSchedulingPreferences
    {
        public decimal advanceTime;
        public decimal betweenTime;
        public int incrementsSizeInMinutes;
    }

    public static void SetSchedulingPreferences(int userID, RestSchedulingPreferences preferences)
    {
        using (var db = Database.Open("sqlloco")) {
            db.Execute("SetCalendarProviderAttributes @0, @1, @2, null, null, @3",
                userID,
                preferences.advanceTime,
                preferences.betweenTime,
                preferences.incrementsSizeInMinutes
            );

            db.Execute("EXEC TestAlertAvailability @0", userID);
        }
    }

    public static RestSchedulingPreferences GetSchedulingPreferences(int userID)
    {
        var atts = GetCalendarAttributes(userID);
        RestSchedulingPreferences prefs = null;

        // Ever must exist the record, if not, its forced to be
        // created with some defaults and that are returned
        if (atts == null)
        {
            prefs = new RestSchedulingPreferences
            {
                advanceTime = 24M,
                betweenTime = 0,
                incrementsSizeInMinutes = 15
            };

            SetSchedulingPreferences(userID, prefs);
        }
        else
        {
            prefs = new RestSchedulingPreferences {
                advanceTime = atts.AdvanceTime,
                betweenTime = atts.BetweenTime,
                incrementsSizeInMinutes = atts.IncrementsSizeInMinutes
            };
        }

        return prefs;
    }
    #endregion
}