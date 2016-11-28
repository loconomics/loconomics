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
        /// It supports time zones, and times that have different offsets
        /// </summary>
        /// <param name="start"></param>
        /// <param name="end"></param>
        /// <returns></returns>
        public static string DateTimeRangeToString(DateTimeOffset start, DateTimeOffset end)
        {
            var diffOffset = start.Offset != end.Offset;
            var formatSameOffset = "{0:dddd, MMM d} from {1:t} to {2:t} ({3:zzz})";
            var formatDiffOffset = "{0:dddd, MMM d} from {1:t} ({3:zzz}) to {2:t} ({4:zzz})";
            return String.Format(diffOffset ? formatDiffOffset : formatSameOffset, start, start, end, start, end);
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