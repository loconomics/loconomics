using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

public static partial class LcUtils
{
    /// <summary>
    /// Utilities for dates/times/offsets/timezones
    /// </summary>
    public static class Time
    {
        /// <summary>
        /// It supports displaying offsets, with care when both are in same or different offset.
        /// TODO: Originally named DateTimeRangeToString, replaced in use by ZonedTimesRangeToString, needs review for any possible use case or removal
        /// </summary>
        /// <param name="start"></param>
        /// <param name="end"></param>
        /// <returns></returns>
        public static string OffsetTimesRangeToString(DateTimeOffset start, DateTimeOffset end)
        {
            var diffOffset = start.Offset != end.Offset;
            var formatSameOffset = "{0:dddd, MMM d} from {1:t} to {2:t} ({3:zzz})";
            var formatDiffOffset = "{0:dddd, MMM d} from {1:t} ({3:zzz}) to {2:t} ({4:zzz})";
            return String.Format(diffOffset ? formatDiffOffset : formatSameOffset, start, start, end, start, end);
        }

        public static string ZonedTimesRangeToString(LcRest.EventDates range)
        {
            // NOTE: format 'x' means: the abbreviation associated with the time zone at the given time (for example, PST or CET)
            var isSameDate = range.startTime.UtcDateTime.Date == range.endTime.UtcDateTime.Date;
            var formatSameDate = "{0:dddd, MMM d} from {1:t} to {2:t} {4:(x)}";
            var formatDiffDate = "{0:dddd, MMM d} from {1:t} to {2:t} {3:dddd, MMM d} {4:(x)}";
            var zone = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(range.timeZone);
            var start = NodaTime.ZonedDateTime.FromDateTimeOffset(range.startTime).WithZone(zone);
            var end = NodaTime.ZonedDateTime.FromDateTimeOffset(range.endTime).WithZone(zone);
            return String.Format(isSameDate ? formatSameDate : formatDiffDate, start, start.TimeOfDay, end.TimeOfDay, end, start);
        }

        public static string ZonedTimeToShortString(DateTimeOffset time, string timeZone)
        {
            var zone = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZone);
            var zonedTime = NodaTime.ZonedDateTime.FromDateTimeOffset(time).WithZone(zone);
            var format = "{0:g} {1:(x)}";
            return String.Format(format, zonedTime.LocalDateTime, zonedTime);
        }

        public static string ZonedTimeOnDateString(DateTimeOffset time, string timeZone)
        {
            var zone = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZone);
            var zonedTime = NodaTime.ZonedDateTime.FromDateTimeOffset(time).WithZone(zone);
            var format = "{0:t} on {0:D} {1:(x)}";
            return String.Format(format, zonedTime.ToDateTimeUnspecified(), zonedTime);
        }

        public static DateTimeOffset ConvertToTimeZone(DateTimeOffset time, string timeZone)
        {
            var tz = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZone);
            if (tz == null) throw new Exception(String.Format("Time zone does not found ({0})", timeZone));

            return NodaTime.Instant
                .FromDateTimeOffset(time)
                .InZone(tz)
                .ToDateTimeOffset();
        }
    }
}