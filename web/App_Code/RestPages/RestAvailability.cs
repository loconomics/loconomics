using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.WebData;
using System.Web.WebPages;
using ASP;
using WebMatrix.Data;

/// <summary>
/// Query the user availability.
///
/// Options: (notes, Q is QueryString parameter, B is Body/Post parameter, a dash is additional info)
/// GET
///     /weekly-schedule
///         Q user:int
///     /monthly
///         Q user:int
///         Q date:datetime Optional, will return the full weeks that enclouse dates in the month of that @date,
///        will be Today as default
///         q start:datetime Optional, start date to return for the start-end range
///         Q end:datetime Optional, end date to return for the start-end range. If not provided, @start will be used as @date
///     /monthly-schedule
///         (same params as /monthly)
///     /weekly
///         Q user:int
///         Q start:datetime Optional, defaults to Today. The first week date for this date will be used as the beginning of
///             the returned data range
///         Q end:datetime Optional, defaults to Today. The last week date for this date will be used as the ending of 
///             the returned data range
///             
/// PUT
///     /weekly-schedule
///         B json-data:string Optional. It contains the stringified version of the JSON data from a GET request, updated
///             with the changes to save.
///         B all-time:bool Optional. It sets all the week as available to work.
///         - Both parameters are optional and exclusive (all-time takes precedence), but one must be specified.
///         - Returns and updated copy of the data.
///     
///     /monthly-schedule
///         B json-data:string Optional. It contains the stringified version of the JSON data from a GET request, updated
///             with the changes to save, with some notes: not all the dates need to be specified; the 'events' and 'eventsIds' properties 
///             that comes with the GET are not needed at all; the 'source' property of each date slot must have the value 'user'.
///             Must contain information in order to be a valid request.
///         - Returns an updated copy of the data for the dates range of the input data.
/// </summary>
[Obsolete]
public class RestAvailability : RestWebPage
{
    private bool UseUtc = false;

    public RestAvailability(bool useUtc)
    {
        UseUtc = useUtc;
    }

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
            
        switch (type != null ? type.ToUpper() : null)
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

                return LcCalendar.GetAvailability.Weekly(userId, startDate, endDate, UseUtc);

            default:
                throw new HttpException(400, "Bad Request");
        }
    }

    public override dynamic Put()
    {
        var type = (UrlData[0] ?? "").ToUpper();
        var userId = WebSecurity.CurrentUserId;
        var data = Newtonsoft.Json.JsonConvert.DeserializeObject(Request["json-data"] ?? "");

 	    switch (type) {
            case "WEEKLY-SCHEDULE":

                var alltime = Request["all-time"].AsBool(false);

                if (alltime)
                {
                    LcCalendar.SetAllTimeAvailability(userId);
                }
                else if (!LcCalendar.SaveWorkHoursJsonData(userId, data))
                {
                    throw new HttpException(400, "Your weekly schedule is required. If you are available at all times or prefer to approve appointment times, check \"all days/times\".");
                }

                // Everything goes fine, latest details:
                // Testing the alert
                using (var db = Database.Open("sqlloco")) {
                    db.Execute("EXEC TestAlertAvailability @0", userId);
                }
                // Updated data copy:
                return LcCalendar.GetAvailability.WorkHours(userId);

            case "MONTHLY-SCHEDULE":
                var dates = LcCalendar.SaveMonthlyCalendarJsonData(userId, data);
                if (dates == null)
                {
                    throw new HttpException(400, "No data was sent.");
                }
                else
                {
                    // Updated data copy:
                    return LcCalendar.GetAvailability.MonthlySchedule(userId, dates.Start, dates.End);
                }

            default:
                throw new HttpException(400, "Bad Request");
        }
    }
}
