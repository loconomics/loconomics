using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ASP;
using System.Web.WebPages;
using WebMatrix.WebData;
using System.Globalization;

/// <summary>
/// Descripción breve de LcCalendar
/// </summary>
public static partial class LcCalendar
{
    public static partial class GetAvailability
    {
        #region Consts
        // To represent date and times in the returned JSON we 
        // use the ISO-8601 long formats (long format has separators versus
        // short version without separators),
        // and precision to seconds.
        const string dateFormat = "yyyy'-'MM'-'dd";
        const string timeFormat = @"hh\:mm\:ss";
        static readonly CultureInfo systemCulture = System.Globalization.CultureInfo.InvariantCulture;
        #endregion

        #region Public API
        static public Dictionary<string, object> WorkHours(int userId)
        {
            var result = new Dictionary<string, object>();
            var data = LcCalendar.GetProviderWorkHours(userId);
            
            // Create result
            var slots = new Dictionary<string, List<string>>();
            
            // We set 'unavailable' (any database status except free -includes: unavailable, busy, tentative, offline)
            // as the default state, then we only return 'available' (free on database) slots
            result["defaultStatus"] = "unavailable";
            result["status"] = "available";
            
            foreach(var r in data) {
                var wk = String.Format(systemCulture, "{0}", r.DayOfWeek).ToLower();
                if (!slots.ContainsKey(wk)) {
                    slots.Add(wk, new List<string>());
                }

                var forslot = r.StartTime;
                // Its less than EndTime, because EndTime is an inclusive time-range and we
                // return only the start of each time-slot.
                while (forslot < r.EndTime) {
                    slots[wk].Add(forslot.ToString(timeFormat));
                    // Next slot
                    forslot = forslot.Add(TimeSpan.FromMinutes(15));
                }
            }
            
            result["slots"] = slots;
            return result;
        }

        static public Dictionary<string, object> Monthly(int userId, bool editable, DateTime startDate, DateTime endDate)
        {
            var result = new Dictionary<string, object>();
            var dates = getMonthlyDatesRequested(startDate, endDate);
            
            var data = LcCalendar.GetUserAvailability(userId, dates.Start, dates.End);

            // Create result
            result["defaultStatus"] = "unavailable";
            if (editable) {
                result["slots"] = getEditableMonthlySlots(dates.Start, dates.End, dateFormat, data);
            } else {
                result["slots"] = getReadOnlyMonthlySlots(dates.Start, dates.End, dateFormat, data);
            }

            return result;
        }

        static public Dictionary<string, object> MonthlySchedule(int userId, DateTime startDate, DateTime endDate)
        {
            var result = new Dictionary<string, object>();
            var dates = getMonthlyDatesRequested(startDate, endDate);
            
            var data = LcCalendar.GetMonthlyScheduleEvents(userId, dates);

            // Create result
            result["defaultStatus"] = "available";
            result["slots"] = getMonthlyScheduleSlots(dates, dateFormat, data);
            
            // TODO: Recurrent events (since recurrent bookings are not used still and its more complex
            // do that computation -and time consuming- currently either GetBookingEvents nor fillBookingEvents
            // are being aware of the possibility to have recurrent rules with occurrences happening on our
            // dates-range)
            fillBookingEvents(LcCalendar.GetBookingEvents(userId, dates), result, dateFormat, timeFormat);

            return result;
        }

        static public Dictionary<string, object> Weekly(int userId, DateTime startDate, DateTime endDate)
        {
            var result = new Dictionary<string, object>();

            // Fix on the endDate to avoid one calendar back-end error for the dates range.
            // Too, endDate is given as inclusive but is exclusive when querying the data.
            endDate = endDate.AddDays(1).AddSeconds(-1);
            
            var data = LcCalendar.GetUserAvailability(userId, startDate, endDate);

            // Create result
            var slots = new Dictionary<string, List<string>>();
            // We prepare the slots with every date in the range, no matter
            // if some dates ends up without data (empty value list) we need to be
            // explicit about the returned dates.
            var fordate = startDate;
            while (fordate <= endDate) {
                slots.Add(fordate.ToString(dateFormat), new List<string>());
                // Next date
                fordate = fordate.AddDays(1);
            }
        
            // We set 'unavailable' (any database status except free -includes: unavailable, busy, tentative, offline)
            // as the default state, then we only return 'available' (free on database) slots
            result["defaultStatus"] = "unavailable";
            result["status"] = "available";
            foreach(var ev in data) {
            
                if (ev.CalendarAvailabilityTypeID == (int)LcCalendar.AvailabilityType.Free) {
                    // Result set is organized per dates,
                    var date = ev.DateSet.ToString(dateFormat);
                    // and inside, per time slot.
                    var slot = ev.TimeBlock.ToString(timeFormat);
                    // Added to the list
                    slots[date].Add(slot);
                }
            }

            result["slots"] = slots;
            return result;
        }
        #endregion

        #region Private Utils

        static DatesRange getMonthlyDatesRequested(DateTime startDate, DateTime endDate)
        {
            if (endDate == DateTime.MinValue)
            {
                var refDate = startDate;
                // This gets the firts week-date for the first month-date for the refDate:
                startDate = LcHelpers.GetFirstWeekDay(refDate.AddDays(0 - refDate.Day + 1));
                // Last week-date for the last month-date for the refDate
                endDate = LcHelpers.GetLastWeekDay(refDate.AddMonths(1).AddDays(-1));
            }

            return new DatesRange(startDate, endDate);
        }

        static Dictionary<string, string> getReadOnlyMonthlySlots(DateTime startDate, DateTime endDate, string dateFormat, dynamic data)
        {
            var slots = new Dictionary<string, string>();
            // We prepare the slots with every date in the range, no matter
            // if some dates ends up without data (empty value list) we need to be
            // explicit about the returned dates.
            var fordate = startDate;
            while (fordate <= endDate)
            {
                slots.Add(fordate.ToString(dateFormat), "");
                // Next date
                fordate = fordate.AddDays(1);
            }

            // We set 'unavailable' (any database status except free -includes: unavailable, busy, tentative, offline)
            // or 'available' (free on database)
            // ALMOST one slot free sets the date availability as 'available' (because most times there will be
            // unavailable slots, and that cannot set all the date as unavailable)
            var curDate = startDate;
            var curStatus = "unavailable";
            bool jump = false;
            foreach (var ev in data)
            {
                if (jump || curDate != ev.DateSet)
                {
                    jump = false;
                    var strdate = curDate.ToString(dateFormat);
                    slots[strdate] = curStatus;
                    curDate = ev.DateSet;
                    curStatus = "unavailable";
                }
                if (ev.CalendarAvailabilityTypeID == (int)LcCalendar.AvailabilityType.Free)
                {
                    curStatus = "available";
                    jump = true;
                }
            }
            var laststrdate = curDate.ToString(dateFormat);
            slots[laststrdate] = curStatus;

            return slots;
        }

        static Dictionary<string, Dictionary<string, string>> getEditableMonthlySlots(DateTime startDate, DateTime endDate, string dateFormat, dynamic data)
        {
            var slots = new Dictionary<string, Dictionary<string, string>>();
            // We prepare the slots with every date in the range, no matter
            // if some dates ends up without data (empty value list) we need to be
            // explicit about the returned dates.
            var fordate = startDate;
            while (fordate <= endDate)
            {
                slots.Add(fordate.ToString(dateFormat), new Dictionary<string, string>());
                // Next date
                fordate = fordate.AddDays(1);
            }

            // We set 'unavailable' (any database status except free -includes: unavailable, busy, tentative, offline)
            // or 'available' (free on database)
            // ALMOST one slot free sets the date availability as 'available' (because most times there will be
            // unavailable slots, and that cannot set all the date as unavailable)
            var curDate = startDate;
            var curStatus = "unavailable";
            string curStatusSource = null;
            bool jump = false;
            foreach (var ev in data)
            {
                if (jump || curDate != ev.DateSet)
                {
                    jump = false;
                    var strdate = curDate.ToString(dateFormat);
                    slots[strdate]["status"] = curStatus;
                    slots[strdate]["source"] = curStatusSource ?? "computed";
                    curDate = ev.DateSet;
                    curStatus = "unavailable";
                    curStatusSource = null;
                }
                if (ev.CalendarAvailabilityTypeID == (int)LcCalendar.AvailabilityType.Free)
                {
                    curStatus = "available";
                    curStatusSource = "computed";
                    jump = true;
                }
            }
            var laststrdate = curDate.ToString(dateFormat);
            slots[laststrdate]["status"] = curStatus;
            slots[laststrdate]["source"] = curStatusSource;

            return slots;
        }

        static Dictionary<string, Dictionary<string, dynamic>> getMonthlyScheduleSlots(DatesRange dates, string dateFormat, dynamic data)
        {
            var slots = new Dictionary<string, Dictionary<string, dynamic>>();
            // We prepare the slots with every date in the range, no matter
            // if some dates ends up without data (empty value list) we need to be
            // explicit about the returned dates.
            var fordate = dates.Start;
            while (fordate <= dates.End)
            {
                slots.Add(fordate.ToString(dateFormat), new Dictionary<string, dynamic>());
                // Next date
                fordate = fordate.AddDays(1);
            }

            foreach (var ev in data)
            {
                var strdate = ev.StartTime.ToString(dateFormat);
                // We denote the source of the given data slot is a single record on database ("db")
                // On a user change, it will change to "user" to denote that must be saved.
                slots[strdate]["source"] = "db";
                if (ev.CalendarAvailabilityTypeID == (int)LcCalendar.AvailabilityType.Free)
                {
                    slots[strdate]["status"] = "available";
                }
                else
                {
                    // On any other status, we set 'unavailable'.
                    // Sure we must only have monthly-schedule events with 'unavailable' status for this
                    // and 'free' for 'available' slots.
                    slots[strdate]["status"] = "unavailable";
                }
            }

            return slots;
        }

        static void fillBookingEvents(dynamic bookingEvents, Dictionary<string, dynamic> result, string dateFormat, string timeFormat)
        {
            var rEvents = new Dictionary<string, dynamic>();
            var date = DateTime.MinValue;

            foreach (var e in bookingEvents)
            {
                // Format the required events information in the result,
                // indexed by its ID
                rEvents[e.Id.ToString()] = new
                {
                    summary = e.Summary,
                    start = e.StartTime.ToString(dateFormat) + "T" + e.StartTime.TimeOfDay.ToString(timeFormat),
                    end = e.EndTime.ToString(dateFormat) + "T" + e.EndTime.TimeOfDay.ToString(timeFormat),
                    id = e.Id,
                    url = LcUrl.LangPath + "dashboard/messages/booking/" + e.BookingID.ToString() + "/"
                };

                // Check what dates the booking performs and index it per date-slot:
                // Iterate all days, using the date without time and excluding the EndTime:
                // this avoid include midnight EndTimes while still adding it for other cases
                // (since our iteration 'date' has no time portion and EndTime has it)
                date = e.StartTime.Date;
                while (date < e.EndTime)
                {
                    // Only for existant dates slots
                    var strdate = date.ToString(dateFormat);
                    if (result["slots"][strdate] != null)
                    {
                        // Check or create if the index of related events exist for the slot
                        if (!result["slots"][strdate].ContainsKey("eventsIds"))
                        {
                            result["slots"][strdate]["eventsIds"] = new List<string>();
                        }
                        // Add the event id to the list:
                        result["slots"][strdate]["eventsIds"].Add(e.Id.ToString());
                    }

                    // Next date
                    date = date.AddDays(1);
                }
            }
            result["events"] = rEvents;
        }
        #endregion
    }
}