﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CalendarDll;
using DDay.iCal;
using DDay.Collections;
using CalendarDll.Data;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcCalendar
/// </summary>
public static class LcCalendar
{
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
        var lcCalendar = new CalendarDll.CalendarUtils();
        return
            lcCalendar.GetFreeEvents(
                new CalendarDll.CalendarUser(userID),
                dateStart,
                dateEnd,
                DateTime.Now);

        // Previous CASS code:
        /*using (var db = Database.Open("sqlloco")) {
            return db.Query("exec dbo.GetProviderAvailabilityFullSet @0, @1", userID, date));
        }*/
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
            if (e.CalendarAvailabilityTypeID != (int)CalendarDll.AvailabilityTypes.FREE &&
                edt >= dateStart &&
                edt < dateEnd)
                return false;
        }
        return true;

        // Previous CASS code:
        /*
         using (var db = Database.Open("sqlloco")) {
            return !(bool)db.QueryValue("exec dbo.CheckProviderAvailability @0,@1,@2", userID, dateStart, dateEnd)
         }
         */
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
                        yield return new WorkHoursDay {
                            DayOfWeek = (DayOfWeek)evrf.DayOfWeek.Value,
                            StartTime = ev.StartTime.TimeOfDay,
                            EndTime = ev.EndTime.TimeOfDay
                        };
                }
            }
        }

        // Previous CASS code:
        /*
        using (var db = Database.Open("sqlloco")) {
            return db.Query("EXEC GetUserFreeTimeSettings @0", userID);
        }
         */
    }
    /// <summary>
    /// Set a day work hours saving it as an Event on database
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="?"></param>
    public static void SetProviderWorkHours(int userID, WorkHoursDay workHoursDay) {
        var ent = new loconomicsEntities();
        var events = ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();

        var newev = new CalendarEvents();
        /// TODO: 
        /// Delete all events of type 2 for the userID
        /// Create new recurrent events per day basing in workHoursDay details
        // INCOMPLETE:
        foreach (var ev in events)
        {
            foreach (var evr in ev.CalendarReccurrence)
            {
                if (evr.CalendarReccurrenceFrequency.Where(c => c.DayOfWeek == (int)workHoursDay.DayOfWeek).Count() > 0)
                {
                    ev.StartTime = new DateTime(
                        ev.StartTime.Year,
                        ev.StartTime.Month,
                        ev.StartTime.Day,
                        workHoursDay.StartTime.Hours,
                        workHoursDay.StartTime.Minutes,
                        workHoursDay.StartTime.Seconds
                    );
                    // TODO More, waiting for CASS work in the CRUD API of the calendar
                }
            }
        }

        // Send to database
        ent.SaveChanges();
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
                if (!LcValidators.IsUrl(String.IsNullOrWhiteSpace(p.CalendarURL)))
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
    #endregion
}