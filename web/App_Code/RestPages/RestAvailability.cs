using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.WebData;
using System.Web.WebPages;
using ASP;

/// <summary>
/// Query the user availability.
///
/// Options:
/// /workhours alias /weekly-schedule
///    ? user:int
/// /monthly
///    ? user:int
///    ? date:datetime Optional, will return the full weeks that enclouse dates in the month of that @date,
///        will be Today as default
///    ? start:datetime Optional, start date to return for the start-end range
///    ? end:datetime Optional, end date to return for the start-end range. If not provided, @start will be used as @date
/// /monthly-schedule
///    (same params as /monthly)
/// /weekly
///    ? user:int
///    ? start:datetime Optional, defaults to Today. The first week date for this date will be used as the beginning of
///        the returned data range
///    ? end:datetime Optional, defaults to Today. The last week date for this date will be used as the ending of 
///        the returned data range
/// </summary>
public class RestAvailability : RestWebPage
{
    public override dynamic Get()
    {
        return GetFor(Request, UrlData[0].ToUpper());
    }

    /// <summary>
    /// Parametrized implementation of the Get method,
    /// allowing its reuse from other places, like 
    /// to maintain compatibility with the old JSON API
    /// for get-availability
    /// </summary>
    /// <param name="Request"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public dynamic GetFor(HttpRequestBase Request, string type)
    {           
        var userId = WebSecurity.IsAuthenticated ? WebSecurity.CurrentUserId : 0;
        userId = Request["user"].AsInt(userId);
            
        var startDate = Request["start"].AsDateTime(Request["date"].AsDateTime(DateTime.Today));
        var endDate = Request["end"].AsDateTime(DateTime.MinValue);
            
        switch (type != null ? type.ToUpper(): null)
        {
            case "WORKHOURS":
            case "WEEKLY-SCHEDULE":
                return LcCalendar.GetAvailability.WorkHours(userId);

            case "MONTHLY":
                return LcCalendar.GetAvailability.Monthly(userId, Request["editable"].AsBool(), startDate, endDate);

            case "MONTHLY-SCHEDULE":
                return LcCalendar.GetAvailability.MonthlySchedule(userId, startDate, endDate);

            case "WEEKLY":
                var defStart = LcHelpers.GetFirstWeekDay(DateTime.Today);
                var defEnd = LcHelpers.GetLastWeekDay(DateTime.Today);
                startDate = Request["start"].AsDateTime(defStart);
                endDate = Request["end"].AsDateTime(defEnd);

                return LcCalendar.GetAvailability.Weekly(userId, startDate, endDate);

            default:
                throw new HttpException(400, "Bad Request");
        }
    }
}