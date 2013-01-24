using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CalendarDll;
using DDay.iCal;
using DDay.Collections;
using CalendarDll.Data;

/// <summary>
/// Descripción breve de LcCalendar
/// </summary>
public static class LcCalendar
{
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
}