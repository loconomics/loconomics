using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

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
        public static readonly CultureInfo systemCulture = System.Globalization.CultureInfo.InvariantCulture;
        const int MAX_GETTIMELINE_PASSES = 255;
        static readonly Dictionary<int, string> PublicAvailabilityNames = new Dictionary<int, string>
        {
            { (int)LcCalendar.AvailabilityType.Busy, "[[[busy]]]" },
            { (int)LcCalendar.AvailabilityType.Free, "[[[free]]]" },
            { (int)LcCalendar.AvailabilityType.Transparent, "[[[transparent]]]" },
            { (int)LcCalendar.AvailabilityType.Tentative, "[[[tentative]]]" },
            { (int)LcCalendar.AvailabilityType.Unavailable, "[[[unavailable]]]" },
        };
        static readonly Dictionary<int, int> AvailabilityPriorities = new Dictionary<int, int>
        {
            { (int)LcCalendar.AvailabilityType.Busy, 40 }, // Busy stronger
            { (int)LcCalendar.AvailabilityType.Unavailable, 30 }, // Unavailable
            { (int)LcCalendar.AvailabilityType.Tentative, 20 }, // Tentative
            { (int)LcCalendar.AvailabilityType.Free, 10 },  // Free
            { (int)LcCalendar.AvailabilityType.Transparent, 0 }  // Transparent
        };
        #endregion

        #region Sub classes
        public class TimesRange
        {
            public TimeSpan start;
            public TimeSpan end;
        }

        public class PublicAvailableSlot
        {
            public DateTimeOffset startTime;
            public DateTimeOffset endTime;
            public string availability;
        }
        #endregion

        #region User Weekly Schedule
         static public string GetUserTimeZone(int userID)
        {
            using (var db = new LcDatabase())
            {
                // By default is null, in case it has no events will let the client app to auto pick one
                return (string)N.D(db.QueryValue("SELECT TOP 1 timeZone FROM CalendarProviderAttributes WHERE UserID=@0", userID));
            }
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

            // Read timeZone
            result["timeZone"] = GetUserTimeZone(userID);

            return result;
        }
        #endregion

        #region Internal Utils
        static DateTimeOffset MinDateTime(DateTimeOffset t1, DateTimeOffset t2)
        {
            return t1 <= t2 ? t1 : t2;
        }
        static DateTimeOffset MaxDateTime(DateTimeOffset t1, DateTimeOffset t2)
        {
            return t1 >= t2 ? t1 : t2;
        }
        #endregion

        #region Availability as Timeline/Times Slots
        /// <summary>
        /// Filter a list of occurrences, removing ones that are newer than the given endTime
        /// and cutting anyone with the endTime in the middle.
        /// </summary>
        /// <param name="occurrences"></param>
        /// <param name="endTime"></param>
        /// <returns></returns>
        private static IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> FilterEndTimeOccurrences(
            IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> occurrences, DateTimeOffset endTime)
        {
            foreach (var s in occurrences)
            {
                if (s.StartTime >= endTime)
                {
                    // Skip it
                    continue;
                }
                else if (s.EndTime > endTime)
                {
                    // Intersection (since StartTime is not newer than endTime, by previous 'if' check)
                    yield return new CalendarDll.CalendarUtils.AvailabilitySlot
                    {
                        StartTime = s.StartTime,
                        EndTime = endTime,
                        AvailabilityTypeID = s.AvailabilityTypeID
                    };
                }
                else
                {
                    // Is In, give it 'as is'
                    yield return s;
                }
            }
        }

        /// <summary>
        /// Filter a list of occurrences, removing ones that are older than the given startTime
        /// and cutting anyone with the startTime in the middle, plus set as unavailable any occurrence
        /// that happens inside the advanceTime (relative to the current machine time).
        /// </summary>
        /// <param name="occurences"></param>
        /// <param name="startTime"></param>
        /// <param name="advanceTime"></param>
        /// <returns></returns>
        private static IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> OccurrencesWithAdvanceTimeSlot(
            IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> occurences, DateTimeOffset startTime, double advanceTime)
        {
            var notBeforeTime = DateTimeOffset.Now.AddHours(advanceTime);
            if (startTime < notBeforeTime)
            {
                var past = new CalendarDll.CalendarUtils.AvailabilitySlot
                {
                    StartTime = startTime,
                    EndTime = notBeforeTime,
                    AvailabilityTypeID = (int)AvailabilityType.Unavailable
                };
                yield return past;
            }
            else
            {
                // Since the queried time is newer than the 'limit time in advance',
                // then our new limit is the queried startTime (anything before that 
                // is not wanted now)
                notBeforeTime = startTime;
            }
            // Occurrences need to be filtered to do not include ones that happens older than the advance time / startTime,
            // not just for performance of the timeline computation, but for consistency since it can breaks the logic there (since
            // it expects events sorted ascending by startTime, and occurrence with older start than advanceTime slot would break it).
            // Too, if an occurrence starts before advance but ends after, must create a new slot (cut from intersection -advanceTimeStart- to endtime).
            foreach (var s in occurences)
            {
                if (s.EndTime <= notBeforeTime)
                {
                    // Excluded, is old
                    continue;
                }
                else if (s.StartTime < notBeforeTime)
                {
                    // Intersection (since endTime is not older than notBeforeTime, by first 'if' check)
                    yield return new CalendarDll.CalendarUtils.AvailabilitySlot
                    {
                        StartTime = notBeforeTime,
                        EndTime = s.EndTime,
                        AvailabilityTypeID = s.AvailabilityTypeID
                    };
                }
                else
                {
                    // Just newer, give it 'as is'
                    yield return s;
                }
            }
        }

        public static IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> GetUserTimeline(int userID, DateTimeOffset startTime, DateTimeOffset endTime, double advanceTime = 0)
        {
            var cu = new CalendarDll.CalendarUtils();
            var data = cu.GetEventsOccurrencesInUtcAvailabilitySlotsByUser(userID, startTime, endTime);

            // NOTE: To avoid to show as available past time or inside the AdvanceTime period,
            // we need to add an unavailable slot (if needed). It too filters out and cut slots
            // that happens or starts before of now
            // IMPORTANT: Not only takes care of advanceTime, even when that is 0 (because is excluded or is the saved value)
            // this method filters the beggining of the slots to set an unavailable slot for any time older than current machine time,
            // with careful for a current time that happens in between a slot range.
            data = OccurrencesWithAdvanceTimeSlot(data, startTime, advanceTime);
            data = FilterEndTimeOccurrences(data, endTime);

            // Create result
            return GetTimeline(data);
        }

        public static IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> GetUserTimeline(int userID, DateTimeOffset startTime, DateTimeOffset endTime, bool useAdvanceTime)
        {
            double advanceTime = 0;
            var prefs = LcCalendar.GetSchedulingPreferences(userID);
            if (useAdvanceTime)
            {
                advanceTime = (double)prefs.advanceTime;
            }
            return GetUserTimeline(userID, startTime, endTime, advanceTime);
        }

        /// <summary>
        /// Public API for the availability/times endpoint.
        /// Get the Availability of the user as a timeline: a list of consecutive date time ranges,
        /// without overlapping, computed the precedence of availability types and intersections
        /// so a single, no holes, line of time is returned.
        /// NOTE: Additional information, important for the public API, is offered, as incrementsSizeInMinutes
        /// from the user scheduling preferences.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="startTime"></param>
        /// <param name="endTime"></param>
        /// <returns></returns>
        public static Dictionary<string, object> Times(int userID, DateTimeOffset startTime, DateTimeOffset endTime, bool useAdvanceTime)
        {
            var result = new Dictionary<string, object>();

            double advanceTime = 0;
            var prefs = LcCalendar.GetSchedulingPreferences(userID);
            if (useAdvanceTime)
            {
                advanceTime = (double)prefs.advanceTime;
            }

            // Create result
            var data = GetUserTimeline(userID, startTime, endTime, advanceTime);
            result["times"] = GetTimelinePublicOutputFormat(data);
            // Communicating service professional Slot size, because Apps must show times in that precision
            // (server would enforce that rule, throwing availability errors if not met)
            result["incrementsSizeInMinutes"] = prefs.incrementsSizeInMinutes;
            // NOTE: Not sure if advanceTime and betweenTime may be needed in the API: both are being take into consideration
            // when building the availability that generates the returned slots so is expected to not be needed for App computations
            // but can be added if a need for it is found.

            return result;
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

        static CalendarDll.CalendarUtils.AvailabilitySlot GetPriorityAvailabilitySlot(CalendarDll.CalendarUtils.AvailabilitySlot date1, CalendarDll.CalendarUtils.AvailabilitySlot date2)
        {
            var pri1 = AvailabilityPriorities[date1.AvailabilityTypeID];
            var pri2 = AvailabilityPriorities[date2.AvailabilityTypeID];
            return pri1 >= pri2 ? date1 : date2;
        }

        /// <summary>
        /// Gets a timeline of non overlapping slots, without holes (filled in with 'unavailable')
        /// for the given set of slots, sorted ascending.
        /// The output is optimized to reduce size and prevent consecutive slots with the same AvailabilityTypeID.
        /// </summary>
        /// <param name="AvailabilitySlots"></param>
        /// <returns></returns>
        static public IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> GetTimeline(IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> AvailabilitySlots)
        {
            return OptimizeTimeline(GetTimeline(AvailabilitySlots, 0));
        }
        /// <summary>
        /// Gets a timeline of non overlapping slots, without holes (filled in with 'unavailable')
        /// for the given set of slots, sorted ascending.
        /// But is NOT optimized, meaning can contains consecutive slots of same availability type; to
        /// get an optimized, compressed, output, apply OptimizeTimeline to the result.
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
                    if (passNumber + 1 > MAX_GETTIMELINE_PASSES) throw new Exception("[[[Impossible to compute availability.]]]");
                    prevsBuffer = GetTimeline(prevsBuffer.OrderBy(x => x.StartTime), passNumber + 1).ToList();
                }
            }

            // Return last pending:
            foreach (var range in prevsBuffer)
                yield return range;
        }

        /// <summary>
        /// It optimizes a given timeline, as a list of non overlapping and ordered slots, by merging consecutive
        /// slots of the same availabilityType in one, getting the smaller timeline list possible to represent
        /// the same availability.
        /// </summary>
        /// <param name="slots">Non overlapping and ordered slots, as coming from GetTimeline; otherwise, results are unexpected. A null slot in the list will throw random exception.</param>
        /// <returns></returns>
        static private IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> OptimizeTimeline(IEnumerable<CalendarDll.CalendarUtils.AvailabilitySlot> slots)
        {
            var enumerate = slots.GetEnumerator();
            // Quick return on empty list
            if (!enumerate.MoveNext())
            {
                yield break;
            }

            // Read first: is the initial 'previous one'
            var prevSlot = enumerate.Current;

            while (enumerate.MoveNext())
            {
                var currentSlot = enumerate.Current;

                if (currentSlot.AvailabilityTypeID == prevSlot.AvailabilityTypeID)
                {
                    // Merge lastSlot and current slot
                    prevSlot = new CalendarDll.CalendarUtils.AvailabilitySlot
                    {
                        AvailabilityTypeID = prevSlot.AvailabilityTypeID,
                        StartTime = prevSlot.StartTime,
                        EndTime = currentSlot.EndTime
                    };
                }
                else
                {
                    // Merging not possible, return last one and 
                    // replace reference with current one
                    yield return prevSlot;
                    prevSlot = currentSlot;
                }
            }

            // Return the pending last slot
            yield return prevSlot;
        }
        #endregion

        #region Unit Testing Timeline
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
        /// IMPORTANT: Expected output for GetTimeline and OptimizeTimeline is different
        /// since even both output are correct representing the availability, the un-optimized can contains consecutive ranges
        /// for the same availability ID that could, when optimized, being joined into a unique range.
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
                    EndTime = new DateTime(2015, 10, 3, 18, 0, 0),
                    AvailabilityTypeID = 2
                },
                new CalendarDll.CalendarUtils.AvailabilitySlot {
                    StartTime = new DateTime(2015, 10, 3, 18, 0, 0),
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
    }
}