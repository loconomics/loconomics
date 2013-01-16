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
    /// <summary>
    /// Retrieve a list of Events of type Work Hours of the provider
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static List<CalendarEvents> GetProviderWorkHours(int userID)
    {
        var ent = new loconomicsEntities();
        return ent.CalendarEvents
            .Where(c => c.UserId == userID && c.EventType == 2).ToList();

        // Previous CASS code:
        /*
        using (var db = Database.Open("sqlloco")) {
            return db.Query("EXEC GetUserFreeTimeSettings @0", userID);
        }
         */
    }
}