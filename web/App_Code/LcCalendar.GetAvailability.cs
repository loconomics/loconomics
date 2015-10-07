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
        public class TimesRange
        {
            public TimeSpan start;
            public TimeSpan end;
        }
        /// <summary>
        /// Gets the weekly schedule of a user in a structure for the public REST API.
        /// Result includes a timeZone property, a property for each weekday that includes
        /// each one a list of TimesRanges, and a isAllTime property as true if all returned
        /// weekdays are available for work in full.
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        static public Dictionary<string, object> WeeklySchedule(int userID)
        {
            var result = new Dictionary<string, object>();
            var data = LcCalendar.GetProviderWorkHours(userID);
            // Bit flag to track if isAllTime: each bit matches a weekday position, if 1 is fullday,
            // if all are 1 (127) is all time.
            var isAllTime = 0;

            // Timezone shared by all (even if specified individually, is considered
            // to be the same on all cases)
            // By default:
            result["timeZone"] = "America/Los_Angeles";

            // To ensure all weekdays are included in the output, and preparing in advance
            // the list objects, add them now:
            foreach (var dow in Enum.GetNames(typeof(DayOfWeek)))
            {
                var wk = String.Format(systemCulture, "{0}", dow).ToLower();
                result.Add(wk, new List<TimesRange>());
            }

            foreach (var r in data)
            {
                var wk = String.Format(systemCulture, "{0}", r.DayOfWeek).ToLower();

                // Set timeZone if any
                // Since is a general setting, will get the last one
                if (!String.IsNullOrEmpty(r.TimeZone))
                {
                    result["timeZone"] = r.TimeZone;
                }

                // Convert WorkHoursDay into a TimesRange and add it to the list for this weekday:
                ((List<TimesRange>)result[wk]).Add(new TimesRange
                {
                    start = r.StartTime,
                    end = r.EndTime
                });

                // Check if this weekday is an alltime available and add it to the bit flag
                if (r.StartTime == TimeSpan.Zero &&
                    r.EndTime == LcCalendar.LastMinute)
                {
                    isAllTime |= (1 << (int)r.DayOfWeek);
                }
            }

            result["isAllTime"] = isAllTime == 127;

            return result;
        }

        [Obsolete("Use WeeklySchedule, for an optimized, more convenient, result, rather than slots")]
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
            // Timezone shared by all (even if specified individually, is considered
            // to be the same on all cases)
            // By default:
            result["timeZone"] = "America/Los_Angeles";

            foreach(var r in data) {
                var wk = String.Format(systemCulture, "{0}", r.DayOfWeek).ToLower();
                if (!slots.ContainsKey(wk)) {
                    slots.Add(wk, new List<string>());
                }

                // Set timeZone if any
                // Since is a general setting, will get the last one
                if (!String.IsNullOrEmpty(r.TimeZone))
                {
                    result["timeZone"] = r.TimeZone;
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
            // TODO DEPRECATED defaultStatus, since now all dates in the requested range are being returned.
            // I think no piece of software used the defaultStatus, but double check (maybe R6 dashboard calendar widget, but could get it
            // hardcoded too).
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

        /// <summary>
        /// Input startDate and endDate must be in the server/database time zone.
        /// The inUtc flag is only for the timezone of the returned data.
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <param name="inUtc"></param>
        /// <returns></returns>
        [Obsolete("Use Times API, more optimized and convenient output")]
        static public Dictionary<string, object> Weekly(int userId, DateTime startDate, DateTime endDate, bool inUtc)
        {
            var result = new Dictionary<string, object>();

            // Fix on the endDate to avoid one calendar back-end error for the dates range.
            // Too, endDate is given as inclusive but is exclusive when querying the data.
            endDate = endDate.AddDays(1).AddSeconds(-1);
            
            // TODO: change how availability works in the calendar so it respects the time part of the filter
            // (right now is getting avail info for the full date of the given start-end)
            var data = LcCalendar.GetUserAvailability(userId, startDate, endDate);

            // Create result
            var slots = new Dictionary<string, List<string>>();
            // We prepare the slots with every date in the range, no matter
            // if some dates ends up without data (empty value list) we need to be
            // explicit about the returned dates.
            // IMPORTANT: We MUST compare against the Date component (without hour) because the given datetime
            // can include hours in the middle of the date and adding 1 day on each iteration will make that,
            // by comparing date AND time fail to get all the involved natural dates, ending in a crash during
            // the slots loop soon later (specially because of differences in time zones from requester and server).
            var fordate = startDate.Date;
            var lastdate = endDate.Date;

            if (inUtc)
            {
                fordate = startDate.ToUniversalTime().Date;
                lastdate = endDate.ToUniversalTime().Date;
            }

            while (fordate <= lastdate) {
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
                    
                    var slotDT = ev.DT;
                    // Ensure filter the time properly
                    // (see note on getAvailability)
                    if (slotDT < startDate ||
                        slotDT > endDate)
                    {
                        continue;
                    }

                    if (inUtc)
                    {
                        slotDT = slotDT.ToUniversalTime();
                    }

                    // Result set is organized per dates,
                    var date = slotDT.ToString(dateFormat);
                    // and inside, per time slot.
                    var slot = slotDT.TimeOfDay.ToString(timeFormat);
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

        #region TIMES Availability Slots Timeline [mixed Public and Private API]

        /// <summary>
        /// Public API for the availability/times endpoint.
        /// Get the Availability of the user as a timeline: a list of consecutive date time ranges,
        /// without overlapping, computed the precedence of availability types and intersections
        /// so a single, no holes, line of time is returned.
        /// IMPORTANT: Times are in UTC ever.
        /// NOTE: Additional information, important for the public API, is offered, as incrementsSizeInMinutes
        /// from the user scheduling preferences.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="startTime"></param>
        /// <param name="endTime"></param>
        /// <returns></returns>
        public static Dictionary<string, object> Times(int userID, DateTime startTime, DateTime endTime)
        {
            var result = new Dictionary<string, object>();

            var cu = new CalendarDll.CalendarUtils();
            var calUser = new CalendarDll.CalendarUser(141);
            var data = cu.GetEventsOccurrencesInUtcAvailabilitySlotsByUser(calUser.Id, startTime, endTime);

            // Create result
            result["times"] = GetTimelinePublicOutputFormat(GetTimeline(data));
            var prefs = LcCalendar.GetSchedulingPreferences(userID);
            // Communicating service professional Slot size, because Apps must show times in that precision
            // (server would enforce that rule, throwing availability errors if not met)
            result["incrementsSizeInMinutes"] = prefs.incrementsSizeInMinutes;
            // NOTE: Not sure if advanceTime and betweenTime may be needed in the API: both are being take into consideration
            // when building the availability that generates the returned slots so is expected to not be needed for App computations
            // but can be added if a need for it is found.

            return result;
        }

        public class PublicAvailableSlot
        {
            public DateTime startTime;
            public DateTime endTime;
            public string availability;
        }
        static private IEnumerable<PublicAvailableSlot> GetTimelinePublicOutputFormat(IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> slots)
        {
            foreach (var slot in slots)
            {
                yield return new PublicAvailableSlot
                {
                    startTime = slot.StartTime,
                    endTime = slot.EndTime,
                    availability = PublicAvailabilityNames[slot.AvailabilityTypeID]
                };
            }
        }

        static Dictionary<int, string> PublicAvailabilityNames = new Dictionary<int, string>
        {
            { (int)LcCalendar.AvailabilityType.Busy, "busy" },
            { (int)LcCalendar.AvailabilityType.Free, "free" },
            { (int)LcCalendar.AvailabilityType.Offline, "transparent" },
            { (int)LcCalendar.AvailabilityType.Tentative, "tentative" },
            { (int)LcCalendar.AvailabilityType.Unavailable, "unavailable" },
        };

        static Dictionary<int, int> AvailabilityPriorities = new Dictionary<int, int>
        {
            { (int)LcCalendar.AvailabilityType.Busy, 40 }, // Busy stronger
            { (int)LcCalendar.AvailabilityType.Unavailable, 30 }, // Unavailable
            { (int)LcCalendar.AvailabilityType.Tentative, 20 }, // Tentative
            { (int)LcCalendar.AvailabilityType.Free, 10 }  // Free
        };
        static CalendarDll.CalendarUtils.AvailabilitySlot GetPriorityAvailabilitySlot(CalendarDll.CalendarUtils.AvailabilitySlot date1, CalendarDll.CalendarUtils.AvailabilitySlot date2)
        {
            var pri1 = AvailabilityPriorities[date1.AvailabilityTypeID];
            var pri2 = AvailabilityPriorities[date2.AvailabilityTypeID];
            return pri1 >= pri2 ? date1 : date2;
        }
        static DateTime MinDateTime(DateTime t1, DateTime t2)
        {
            return t1 <= t2 ? t1 : t2;
        }
        static DateTime MaxDateTime(DateTime t1, DateTime t2)
        {
            return t1 >= t2 ? t1 : t2;
        }

        const int MAX_GETTIMELINE_PASSES = 255;
        /// <summary>
        /// Gets a timeline of non overlapping slots, without holes (filled in with 'unavailable')
        /// for the given set of slots, sorted ascending.
        /// </summary>
        /// <param name="AvailabilitySlots"></param>
        /// <returns></returns>
        static public IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> GetTimeline(IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> AvailabilitySlots)
        {
            return GetTimeline(AvailabilitySlots, 0);
        }
        /// <summary>
        /// Gets a timeline of non overlapping slots, without holes (filled in with 'unavailable')
        /// for the given set of slots, sorted ascending.
        /// </summary>
        /// <param name="AvailabilitySlots"></param>
        /// <param name="passNumber">Used only internally, to avoid that recursive calls creates an stack overflow.</param>
        /// <returns></returns>
        static private IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> GetTimeline(IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> AvailabilitySlots, int passNumber)
        {
            var enumerate = AvailabilitySlots.GetEnumerator();
            // Quick return
            if (!enumerate.MoveNext())
            {
                yield break;
            }
            // First one, as previous on the iteration.
            var prevsBuffer = new List<CalendarDll.CalendarUtils.AvailabilitySlot>();
            prevsBuffer.Add(enumerate.Current);
            var newsBuffer = new List<CalendarDll.CalendarUtils.AvailabilitySlot>();
            // On each iteration, number of queued items in the buffer that can be released
            var dequeueCount = 0;
            // On each iteration, number of queued items in the buffer After the dequeueCount
            // that must be discarded/removed frmo the buffer without return them, because
            // gets obsolete after perform the analysis (that means that new, fragmented,
            // ranges were created for that one because of collisions)
            var discardCount = 0;
            // On each iteration, current element must or must not be added 'as is' to the queue
            var addCurrentToBuffer = true;

            // Implemented several passes when an analyzed lists of 'prevsBuffer' contains more than 1
            // element, because how elements may overlap has edge cases that only can be solved
            // by reordering the list and apply the logic on it.
            //
            // NOTE: It's something optmized because rather than re-analyze the whole resultsets when
            // a complete pass is done [like GetTimeline(GetTimeline(...))], only the specific sections of overlaped ranges
            // performs a second (or more) passes, and still is effective.
            // 
            // TODO: Review if the logic updates makes possible to remove the multiple passes feature OR a most effective way to check when
            // multiple passes are needed (right now just [prevsBuffer.length > 2], maybe other quick logic can discard
            // cases that match that condiction but don't need a second pass).
            // IMPORTANT: Right now, on unit tests for different edge cases extra passes are not needed.
            var needsAnotherPass = false;

            while (enumerate.MoveNext())
            {
                var current = enumerate.Current;
                needsAnotherPass = prevsBuffer.Count > 2;

                foreach (var prev in prevsBuffer)
                {
                    if (current.StartTime >= prev.EndTime)
                    {
                        // Previous can be dequeue (will not collide with following ranges)
                        dequeueCount++;
                    }
                    else /* current.StartTime < prev.EndTime */
                    {
                        addCurrentToBuffer = false;
                        discardCount++;
                        // Intersection of events:
                        // |.....prev.....|
                        //         |.....current.....|
                        // |.prev..|.new..|..current.|
                        //
                        // TODO: Optimize creation of ranges: only 2 are needed, because the
                        // new range will share its availability with one of the others, allowing
                        // to mix both in one.
                        //
                        // IMPORTANT: current may finish before prev (current inside prev) like
                        // |.............prev..............|
                        //        |......current....|
                        // |.prev.|.prev-or-current.|.prev.|
                        //
                        // TODO: If prev has higher or same priority, there is only one range, the prev
                        // TODO: If current has higher priority, three ranges are needed, the current keeps 'as is'
                        //
                        // IMPORTANT: because of multiple ranges overlapping and ones first being longer than following ones,
                        // the split behavior may end creating 'prev' ranges that happens AFTER 'current', because
                        // of that the first cut may end being a prev or current section and 'minDateTime and maxdatetime' are required.
                        // The graph can be something like
                        //        |.......prev........|
                        // |....current....|
                        // |p-or-c|.p-or-c.|.prev.....|
                        // ANOTHER EDGE CASE Because multiple overlapping and passes
                        //                  |.....prev.....|
                        // |...current..|
                        // |...current..|new|.....prev.....|

                        // - Return a reduced version of the prev
                        // (if there is place for one!)
                        var minStart = MinDateTime(prev.StartTime, current.StartTime);
                        var minEnd = MinDateTime(MinDateTime(prev.EndTime, current.EndTime), MaxDateTime(prev.StartTime, current.StartTime));
                        //if (minEnd < minStart) throw new Exception("TEST minEnd < minStart::" + passNumber + ":" + minEnd.ToString("r") + ":" + minStart.ToString("r"));
                        if (prev.StartTime != current.StartTime)
                        {
                            newsBuffer.Add(new CalendarDll.CalendarUtils.AvailabilitySlot
                            {
                                StartTime = minStart,
                                EndTime = minEnd,
                                AvailabilityTypeID = minStart == current.StartTime ? current.AvailabilityTypeID : prev.AvailabilityTypeID
                            });
                        }
                        // - New range on the intersection, with the stronger availability
                        var maxStart = MaxDateTime(MinDateTime(prev.EndTime, current.EndTime), MaxDateTime(prev.StartTime, current.StartTime));
                        //if (maxStart < minEnd) throw new Exception("TEST maxStart < minEnd::" + maxStart.ToString("r") + ":" + minEnd.ToString("r"));
                        newsBuffer.Add(new CalendarDll.CalendarUtils.AvailabilitySlot
                        {
                            StartTime = minEnd,
                            EndTime = maxStart,
                            AvailabilityTypeID = GetPriorityAvailabilitySlot(prev, current).AvailabilityTypeID
                        });
                        // - Reduced version of the current
                        // (if there is place for one!)
                        if (prev.EndTime != current.EndTime)
                        {
                            var maxEnd = MaxDateTime(prev.EndTime, current.EndTime);
                            //if (maxEnd < maxStart) throw new Exception("TEST maxEnd < maxStart::" + maxEnd.ToString("r") + ":" + maxStart.ToString("r"));
                            newsBuffer.Add(new CalendarDll.CalendarUtils.AvailabilitySlot
                            {
                                StartTime = maxStart,
                                EndTime = maxEnd,
                                AvailabilityTypeID = maxEnd == current.EndTime ? current.AvailabilityTypeID : prev.AvailabilityTypeID
                            });
                        }
                    }
                }

                if (addCurrentToBuffer)
                {
                    // Current must be in the list
                    prevsBuffer.Add(current);
                }
                addCurrentToBuffer = true;

                // Add the new ones to queue
                foreach (var ne in newsBuffer)
                    prevsBuffer.Add(ne);
                newsBuffer.Clear();

                // Check two latest ranges in order to fill in a hole (if any)
                if (prevsBuffer.Count > 1)
                {
                    var preHole = prevsBuffer[prevsBuffer.Count - 2];
                    var postHole = prevsBuffer[prevsBuffer.Count - 1];
                    if (postHole.StartTime > preHole.EndTime)
                    {
                        // There is a gap:
                        // fill it with unavailable slot
                        var hole = new CalendarDll.CalendarUtils.AvailabilitySlot
                        {
                            AvailabilityTypeID = (int)LcCalendar.AvailabilityType.Unavailable,
                            StartTime = preHole.EndTime,
                            EndTime = postHole.StartTime
                        };
                        // Must be inserted in the place of postHole (to keep them sorted), and re-add that after
                        prevsBuffer[prevsBuffer.Count - 1] = hole;
                        prevsBuffer.Add(postHole);
                        dequeueCount++;
                    }
                }

                // Dequee: return and remove from buffer that elements that are ready
                for (var i = 0; i < dequeueCount; i++)
                {
                    // Since we are modifing the buffer on each iteration,
                    // the element to return and remove is ever the first (0)
                    yield return prevsBuffer[0];
                    prevsBuffer.RemoveAt(0);
                }
                dequeueCount = 0;
                // Discard: remove from buffer, but NOT return, elements that get obsolete
                for (var i = 0; i < discardCount; i++)
                {
                    // Since we are modifing the buffer on each iteration,
                    // the element to remove is ever the first (0)
                    prevsBuffer.RemoveAt(0);
                }
                discardCount = 0;

                // Multi passes are needed to ensure correct results.
                if (needsAnotherPass)
                {
                    // Stack overflow, excessive passes, control:
                    if (passNumber + 1 > MAX_GETTIMELINE_PASSES) throw new Exception("Impossible to compute availability.");
                    prevsBuffer = GetTimeline(prevsBuffer.OrderBy(x => x.StartTime), passNumber + 1).ToList();
                }
            }

            // Return last pending:
            foreach (var range in prevsBuffer)
                yield return range;
        }

        #region Unit Testing
        /// <summary>
        /// Utility to compare a set of expected results with the actual results. Returns a list of errors
        /// </summary>
        /// <param name="name"></param>
        /// <param name="result"></param>
        /// <param name="expected"></param>
        /// <returns></returns>
        static List<string> CheckTestTimeline(string name, IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> result, IList<CalendarDll.CalendarUtils.AvailabilitySlot> expected)
        {
            var testErrors = new List<string>();
            if (result.Count() != expected.Count)
            {
                testErrors.Add(name + ": expected result set has different size");
            }
            else
            {
                var ir = -1;
                foreach (var r in result)
                {
                    ir++;
                    if (!r.Equals(expected[ir]))
                    {
                        testErrors.Add(name + ": result " + ir + " is different");
                    }
                }
            }
            return testErrors;
        }

        /// <summary>
        /// Helper class for Unit Testing results
        /// </summary>
        public class CheckTimelineResults
        {
            public List<List<CalendarDll.CalendarUtils.AvailabilitySlot>> Outputs = new List<List<CalendarDll.CalendarUtils.AvailabilitySlot>>();
            public List<List<string>> Errors = new List<List<string>>();
        }

        /// <summary>
        /// Unit Tests for GetTimeline
        /// Returns a list of errors.
        /// 
        /// IMPORTANT: Expected output written for initial versions that has un-optimized output, that means that the
        /// output is correct representing the availability but can contains consecutive ranges for the same availability ID
        /// that could, when optimized, being joined into a unique range. If the function is optimized, or a second 
        /// optimization function is applied, the expected resultset must be updated in order to avoid false negatives.
        /// </summary>
        /// <returns></returns>
        public static CheckTimelineResults GetTimeline_UnitTests()
        {
            var testdataBasic = new List<CalendarDll.CalendarUtils.AvailabilitySlot>
            {
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 5, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 8, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 8, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 10, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 12, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 14, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 12, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 14, 0, 0),
                    AvailabilityTypeID = 3
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 13, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 15, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 15, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 16, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    AvailabilityTypeID = 2
                }
            };
            var testresultBasic = new List<CalendarDll.CalendarUtils.AvailabilitySlot>
            {
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 5, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 8, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 8, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 10, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 10, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 12, 0, 0),
                    AvailabilityTypeID = 0
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 12, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 13, 0, 0),
                    AvailabilityTypeID = 3
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 13, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 14, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 14, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 15, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 15, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 16, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 16, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    AvailabilityTypeID = 1
                }      
            };
            var testdata3Coincidences = new List<CalendarDll.CalendarUtils.AvailabilitySlot>
            {
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 16, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 20, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 17, 30, 0),
                    EndTime = new DateTime(2015, 10, 3, 21, 0, 0),
                    AvailabilityTypeID = 3
                },
       
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 0, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 10, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 2, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 6, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 5, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 8, 0, 0),
                    AvailabilityTypeID = 3
                },
            
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 0, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 10, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 2, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 5, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 3, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 4, 0, 0),
                    AvailabilityTypeID = 3
                }
            };
            var testresult3Coincidences = new List<CalendarDll.CalendarUtils.AvailabilitySlot>
            {
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 16, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 17, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 17, 30, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 17, 30, 0),
                    EndTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 20, 0, 0),
                    AvailabilityTypeID = 3
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 20, 0, 0),
                    EndTime = new DateTime(2015, 10, 3, 21, 0, 0),
                    AvailabilityTypeID = 3
                },

                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 21, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 0, 0, 0),
                    AvailabilityTypeID = 0
                },
       
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 0, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 2, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 2, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 5, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 5, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 6, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 6, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 8, 0, 0),
                    AvailabilityTypeID = 3
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 8, 0, 0),
                    EndTime = new DateTime(2015, 10, 4, 10, 0, 0),
                    AvailabilityTypeID = 1
                },
            
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 4, 10, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 0, 0, 0),
                    AvailabilityTypeID = 0
                },
            
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 0, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 2, 0, 0),
                    AvailabilityTypeID = 1
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 2, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 3, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 3, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 4, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 4, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 5, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 5, 5, 0, 0),
                    EndTime = new DateTime(2015, 10, 5, 10, 0, 0),
                    AvailabilityTypeID = 1
                }
            };

            var result = new CheckTimelineResults();

            var output = GetTimeline(testdataBasic).ToList();
            result.Outputs.Add(output);
            result.Errors.Add(CheckTestTimeline("Basic", output, testresultBasic));

            output = GetTimeline(testdata3Coincidences).ToList();
            result.Outputs.Add(output);
            result.Errors.Add(CheckTestTimeline("3Coincidences", output, testresult3Coincidences));

            return result;
        }
        #endregion
        #endregion
    }
}