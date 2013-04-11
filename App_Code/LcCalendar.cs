using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CalendarDll;
using DDay.iCal;
using DDay.Collections;
using CalendarDll.Data;
using WebMatrix.Data;

/// <summary>
/// Calendaring Tasks, wrapper for some CalendarDll features.
/// </summary>
public static class LcCalendar
{
    public const bool EnableNewCalendar = false;

    #region Availability
    /// <summary>
    /// Get availability table for the user between given date and times
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="dateStart"></param>
    /// <param name="dateEnd"></param>
    /// <returns></returns>
    public static List<CalendarDll.ProviderAvailabilityResult> GetUserAvailability(int userID, DateTime dateStart, DateTime dateEnd)
    {
        if (EnableNewCalendar)
        {
            var lcCalendar = new CalendarDll.CalendarUtils();
            return
                lcCalendar.GetFreeEvents(
                    new CalendarDll.CalendarUser(userID),
                    dateStart,
                    dateEnd,
                    DateTime.Now);
        }
        else
        {
            // Previous CASS code:
            using (var db = Database.Open("sqlloco")) {
                var rtn = new List<CalendarDll.ProviderAvailabilityResult>();
                foreach (var item in db.Query("exec dbo.GetProviderAvailabilityFullSet @0, @1, @2", userID, dateStart, dateEnd))
                    rtn.Add(new ProviderAvailabilityResult{
                        CalendarAvailabilityTypeID = item.CalendarAvailabilityTypeID,
                        DateSet = item.DateSet,
                        DT = item.DT,
                        DayOfWeek = item.DayOfWeek,
                        EventSummary = "",
                        TimeBlock = item.TimeBlock
                    });
                return rtn;
            }
        }
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
        if (EnableNewCalendar)
        {
            foreach (var e in GetUserAvailability(userID, dateStart, dateEnd))
            {
                var edt = e.DateSet + e.TimeBlock;
                if (e.CalendarAvailabilityTypeID != (int)CalendarDll.AvailabilityTypes.FREE &&
                    edt >= dateStart &&
                    edt < dateEnd)
                    return false;
            }
            return true;
        }
        else
        {
            // Previous CASS code:
             using (var db = Database.Open("sqlloco")) {
                return !(bool)db.QueryValue("exec dbo.CheckProviderAvailability @0,@1,@2", userID, dateStart, dateEnd);
             }
        }
    }
    #endregion

    #region Provider Work Hours
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
    /// <summary>
    /// Retrieve a list of Events of type Work Hours of the provider
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static IEnumerable<WorkHoursDay> GetProviderWorkHours(int userID)
    {
        if (EnableNewCalendar)
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
                            yield return new WorkHoursDay
                            {
                                DayOfWeek = (DayOfWeek)evrf.DayOfWeek.Value,
                                StartTime = ev.StartTime.TimeOfDay,
                                EndTime = ev.EndTime.TimeOfDay
                            };
                    }
                }
            }
        }
        else
        {
            // Previous CASS code:
            using (var db = Database.Open("sqlloco")) {
                foreach (var item in db.Query("EXEC GetUserFreeTimeSettings @0", userID))
                    yield return new WorkHoursDay
                    {
                        // 'old way' db uses Base1 for dayOfWeek (Sunday:1, Monday:2 and go on)
                        DayOfWeek = (DayOfWeek)(item.DayofWeek - 1),
                        StartTime = item.StartTime,
                        EndTime = item.EndTime
                    };
            }
        }
    }
    /// <summary>
    /// Set a day work hours saving it as an Event on database
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="?"></param>
    public static void SetProviderWorkHours(int userID, WorkHoursDay workHoursDay) {
        if (EnableNewCalendar)
        {
            var ent = new loconomicsEntities();
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
                        ev.StartTime = new DateTime(
                            ev.StartTime.Year,
                            ev.StartTime.Month,
                            ev.StartTime.Day,
                            workHoursDay.StartTime.Hours,
                            workHoursDay.StartTime.Minutes,
                            workHoursDay.StartTime.Seconds
                        );
                        ev.EndTime = new DateTime(
                            ev.EndTime.Year,
                            ev.EndTime.Month,
                            ev.EndTime.Day,
                            workHoursDay.EndTime.Hours,
                            workHoursDay.EndTime.Minutes,
                            workHoursDay.EndTime.Seconds
                        );
                        // TODO: WHAT DATE MUST HOLD RecurrenceId???
                        //ev.RecurrenceId = new DateTime();
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
                newevent.StartTime = new DateTime(
                    DateTime.MinValue.Year,
                    DateTime.MinValue.Month,
                    DateTime.MinValue.Day,
                    workHoursDay.StartTime.Hours,
                    workHoursDay.StartTime.Minutes,
                    workHoursDay.StartTime.Seconds
                );
                newevent.EndTime = new DateTime(
                    DateTime.MaxValue.Year,
                    DateTime.MaxValue.Month,
                    DateTime.MaxValue.Day,
                    workHoursDay.EndTime.Hours,
                    workHoursDay.EndTime.Minutes,
                    workHoursDay.EndTime.Seconds
                );
                // TODO: WHAT DATE MUST HOLD RecurrenceId???
                //newevent.RecurrenceId = new DateTime();
                newevent.IsAllDay = false;
                newevent.UpdatedDate = DateTime.Now;
                newevent.CreatedDate = DateTime.Now;
                newevent.ModifyBy = "UserID:" + userID;

                // Recurrence rule:
                newevent.CalendarReccurrence.Add(new CalendarReccurrence
                {
                    Frequency = 5, // TODO: IS CORRECT FOR A WEEKLY EVENT???
                    Interval = 1, // TODO: IS CORRECT FOR A WEEKLY EVENT???

                    CalendarReccurrenceFrequency = new List<CalendarReccurrenceFrequency>
                {
                    new CalendarReccurrenceFrequency
                    {
                        ByDay = true,
                        DayOfWeek = (int)workHoursDay.DayOfWeek,
                        // TODO: FrequencyDay IS NEED? WHAT VALUE???
                        FrequencyDay = 9999
                    }
                }
                });

                // Add it to database
                ent.CalendarEvents.Add(newevent);
            }

            // Send to database
            ent.SaveChanges();
        }
        else
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Not available, execute with last parameter as 'true' to remove free events
                db.Execute("EXEC InsertProviderAvailabilityFreeTime @0,@1,@2,@3,@4", 
                    userID,
                    // 'old way' db uses Base1 for dayOfWeek (Sunday:1, Monday:2 and go on)
                    ((int)workHoursDay.DayOfWeek + 1),
                    workHoursDay.StartTime,
                    workHoursDay.EndTime,
                    // false for Not remove events, else insert or update
                    false);
            }
        }
    }
    public static void DelProviderWorkHours(int userID, DayOfWeek dayOfWeek)
    {
        if (EnableNewCalendar)
        {
            throw new NotImplementedException("Need CASS calendar implementation to remove work-hours events");
        }
        else
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Not available, execute with last parameter as 'true' to remove free events
                db.Execute("EXEC InsertProviderAvailabilityFreeTime @0,@1,@2,@3,@4", 
                    userID,
                    // 'old way' db uses Base1 for dayOfWeek (Sunday:1, Monday:2 and go on)
                    ((int)dayOfWeek + 1),
                    TimeSpan.Zero,
                    TimeSpan.Zero,
                    // Remove events:
                    true);
            }
        }
    }
    #endregion

    #region Appointments (custom user events)
    public static List<CalendarEvents> GetUserAppointments(int userID)
    {
        using (var ent = new loconomicsEntities())
        {
            return ent.CalendarEvents
                .Include("CalendarAvailabilityType")
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
        string Description)
    {
        using (var ent = new loconomicsEntities())
        {
            var dbevent = ent.CalendarEvents.Find(EventID);
            if (dbevent == null)
            {
                dbevent = ent.CalendarEvents.Create();
                ent.CalendarEvents.Add(dbevent);
                dbevent.UserId = userID;
            } else if (dbevent.UserId != userID)
                return;

            dbevent.EventType = EventTypeID;
            dbevent.CalendarAvailabilityTypeID = AvailabilityTypeID;
            dbevent.Summary = Summary;
            dbevent.StartTime = StartTime;
            dbevent.EndTime = EndTime;
            dbevent.IsAllDay = IsAllDay;
            dbevent.Location = Location;
            dbevent.Description = Description;
            if (IsRecurrent)
            {
                CalendarReccurrence rRule = null;
                if (dbevent.CalendarReccurrence.Count > 0)
                    rRule = dbevent.CalendarReccurrence.First();
                else
                {
                    rRule = ent.CalendarReccurrence.Create();
                    rRule.CalendarEvents = dbevent;
                    ent.CalendarReccurrence.Add(rRule);
                }
                rRule.Frequency = RecurrenceFrequencyID;
                rRule.Interval = RecurrenceInterval;
                rRule.Until = RecurrenceEndDate;
                rRule.Count = RecurrenceOccurrencesNumber < 1 ? null : RecurrenceOccurrencesNumber;
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
    /// <summary>
    /// Import a calendar in iCalendar format at the given CalendarURL for the UserID
    /// </summary>
    /// <param name="UserID">ID of the user in that calendar will be imported</param>
    /// <param name="CalendarURL">URL to retrieve the calendar data as iCalendar format</param>
    public static void Import(int UserID, string CalendarURL)
    {
        var iCaltoImport = iCalendar.LoadFromUri(new Uri(CalendarURL));

        CalendarUtils libCalendarUtil = new CalendarUtils();
        libCalendarUtil.ImportCalendar(iCaltoImport, new CalendarUser(UserID));
    }
    /// <summary>
    /// Perform calendar import on every user with importation enabled in its
    /// calendar settings.
    /// </summary>
    /// <returns>Per each provider with importation enabled, returns an Exception object
    /// as null if all works fine and imporation was successful for that and the
    /// generated exception if something is wrong and importation fails.</returns>
    public static IEnumerable<Exception> BulkImport()
    {
        using (var db = Database.Open("sqlloco"))
        {
            foreach (var p in db.Query("SELECT UserID, CalendarType, CalendarURL FROM CalendarProviderAttributes WHERE UseCalendarProgram = 1"))
            {
                if (p.CalendarType != "gmail")
                {
                    yield return new Exception(String.Format("Calendar Import error on UserID:{0} : unrecognized calendar type '{1}'", p.UserID, p.CalendarType));
                    continue;
                }
                if (!LcValidators.IsUrl(p.CalendarURL))
                {
                    yield return new Exception(String.Format("Calendar Import error on UserID:{0} : URL is not valid '{1}'", p.UserID, p.CalendarURL));
                    continue;
                }
                Exception resultEx = null;
                try
                {
                    Import(p.UserID, p.CalendarURL);
                }
                catch (Exception ex)
                {
                    resultEx = new Exception(String.Format("Calendar Import error on UserID:{0} : Internal error processing iCalendar", p.UserID), ex);
                }
                yield return resultEx;
            }
        }
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
        return libCalendarUtils.PrepareExportDataForUser(new CalendarUser(UserID));
    }
    #endregion
}