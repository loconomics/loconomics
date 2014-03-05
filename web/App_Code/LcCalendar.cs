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
public static class LcCalendar
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
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="workhours"></param>
    public static void SaveWorkHoursJsonData(int userId, dynamic workhours)
    {
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
                // Note: we have slots by its start-time, by the
                // range to save must include the end-time for the last slot
                if (firstSlot != TimeSpan.MinValue) {
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
            
        // Saving in database
        SetAllProviderWorkHours(userId, slotsRanges);
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

    public static void SaveMonthlyCalendarJsonData(int userID, dynamic data)
    {
        var ent = new loconomicsEntities();

        if (data.slots != null)
        {
            foreach (var slot in data.slots)
            {
                var date = DateTime.Parse(slot.Name);
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
    }
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
    public static void SetUserAppointment(int userID, int EventID,
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
        string monthlyOption = "month-day")
    {
        using (var ent = new loconomicsEntities())
        {
            var dbevent = ent.CalendarEvents.Find(EventID);
            if (dbevent == null)
            {
                dbevent = ent.CalendarEvents.Create();
                ent.CalendarEvents.Add(dbevent);
                dbevent.UserId = userID;
                dbevent.CreatedDate = DateTime.Now;
            } else if (dbevent.UserId != userID)
                return;

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
        }
    }
    public static void DelUserAppointment(int userID, int EventID)
    {
        using (var ent = new loconomicsEntities())
        {
            var dbevent = ent.CalendarEvents.Find(EventID);
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
            foreach (var p in db.Query("SELECT UserID, CalendarURL FROM CalendarProviderAttributes")) // WHERE dbo.fx_IfNW(CalendarURL, null) is not null"))
            {
                if (!LcValidators.IsUrl(p.CalendarURL))
                {
                    // Remove old events, to avoid persist bad data
                    RemoveImportedEventsForUser(p.UserID);

                    // Return error
                    yield return new Exception(String.Format("Calendar Import error on UserID:{0} : URL is not valid '{1}'", p.UserID, p.CalendarURL));
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
            var tznumber = userinfo.TimeZone;
            // TODO: for now, the value from database is discarted, an offset is not valid, we need a name, I set the only
            // one used today:
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
}