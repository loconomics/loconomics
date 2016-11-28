using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Ical.Net;
using Ical.Net.DataTypes;
using Ical.Net.Interfaces.DataTypes;
using Ical.Net.Serialization;
using Ical.Net.Serialization.iCalendar.Serializers;

namespace QuickTest
{
    class Program
    {
        static void Main(string[] args)
        {
            RecurrentExamples();
        }

        #region Recurrent Events with TimeZones
        static void RecurrentExamples()
        {
            Console.WriteLine("Recurrent Examples");

            // DST change on 10/30/2016
            //var tz = "Europe/Madrid"; // +1, +2
            // DST change on 11/06/2016
            //var tz = "America/Los_Angeles"; // -8, -7
            //var tz = "America/Anchorage"; // -9, -8
            // NO DST
            var tz = "America/Jamaica"; // -5

            Console.WriteLine("TimeZone {0}", tz);

            Console.WriteLine("iCal.net. Good Timezone calculations.");
            Console.WriteLine(RecurrentExample(tz));
            Console.WriteLine("---------------------");
            Console.WriteLine("OLD, BROKEN, DDay library --Does not compute Timezones");
            Console.WriteLine(DDayRecurrentExample(tz));
            Console.WriteLine("---------------------");
            Console.WriteLine("iCal.net, using a DateTimeOffset, better for DB");
            Console.WriteLine(OffsetRecurrentExample(tz));
            Console.ReadLine();
        }

        #region Recurrent Examples
        /// <summary>
        /// Old DDay.iCal does it WRONG, because doesn't respect Timezones DST rules or offsets,
        /// just append the TZ to them but does no calculations, so all DST changes and offsets comes
        /// from the local machine.
        /// </summary>
        /// <returns></returns>
        static string DDayRecurrentExample(string tz)
        {
            // This time created is being used as the local time on the time zone later specified, so
            // is NOT the local machine time and is a different UTC value depending on the TZ
            var now = new DateTime(2016, 1, 1, 12, 0, 0);
            var later = now.AddHours(1);

            var rrule = new DDay.iCal.RecurrencePattern(DDay.iCal.FrequencyType.Monthly, 1) { Count = 12 };

            var e = new DDay.iCal.Event
            {
                DTStart = new DDay.iCal.iCalDateTime(now, tz),
                DTEnd = new DDay.iCal.iCalDateTime(later, tz)
            };
            e.RecurrenceRules.Add(rrule);

            var calendar = new DDay.iCal.iCalendar();
            calendar.Events.Add(e);

            //var serializer = new CalendarSerializer(new SerializationContext());
            //return serializer.SerializeToString(calendar);

            var end = new DateTime(2017, 1, 1, 12, 0, 0);
            return e.GetOccurrences(now, end).Aggregate("", (ret, a) =>
            {
                return ret + a.Period.StartTime.UTC.ToString() + "\n";
            });
        }

        /// <summary>
        /// Testing how a non-timezone DateTime is managed when passing in a TimeZone,
        /// and how calculates occurrences on the year, displaying times in UTC to see
        /// the times changes because of DST when applicable. Too, time zones may change DST
        /// on different date.
        /// </summary>
        /// <returns></returns>
        static string RecurrentExample(string tz)
        {
            // This time created is being used as the local time on the time zone later specified, so
            // is NOT the local machine time and is a different UTC value depending on the TZ
            var now = new DateTime(2016, 1, 1, 12, 0, 0);
            var later = now.AddHours(1);

            var rrule = new RecurrencePattern(FrequencyType.Monthly, 1) { Count = 12 };

            var e = new Event
            {
                DtStart = new CalDateTime(now, tz),
                DtEnd = new CalDateTime(later, tz),
                RecurrenceRules = new List<IRecurrencePattern> { rrule },
            };

            var calendar = new Calendar();
            calendar.Events.Add(e);

            //var serializer = new CalendarSerializer(new SerializationContext());
            //return serializer.SerializeToString(calendar);

            var end = new DateTime(2017, 1, 1, 12, 0, 0);
            return calendar.GetOccurrences(now, end).Aggregate("", (ret, a) =>
            {
                return ret + a.Period.StartTime.AsUtc.ToString() + "\n";
            });
        }

        /// <summary>
        /// Testing RecurrentExample (see comment there) against a provided DateTimeOffset,
        /// trying what operations must be done to ensure that the DateTimeOffset is converted
        /// to the time as of the TimeZone rather than get it 'as is' (this will enable us to read
        /// database DateTimeOffsets that has an offset that doesn't match the Event or user time zone but
        /// must be converted to that before calculate occurrences).
        /// </summary>
        /// <returns></returns>
        static string OffsetRecurrentExample(string tz)
        {
            // We have a DateTime with an attached Offset, so the equivalent UTC time must be the same
            // on any tested time zone for a time not in the DST range,
            // it just changes the local value displayed and the calculations
            // of occurrences regarding DST (has or not DST, different DST date change).
            // Midday at UTC saved on UTC
            //var now = new DateTimeOffset(2016, 1, 1, 12, 0, 0, new TimeSpan(0, 0, 0));
            // Midday at UTC saved at PST (America/Los_Angeles)
            // -- results must be the same as when saved as UTC with the corrected time, as opposite to
            // the RecurrentExample method
            var now = new DateTimeOffset(2016, 1, 1, 4, 0, 0, new TimeSpan(-8, 0, 0));
            var later = now.AddHours(1);

            var rrule = new RecurrencePattern(FrequencyType.Monthly, 1) { Count = 12 };

            var timezone = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(tz);
            var znow = new NodaTime.ZonedDateTime(NodaTime.Instant.FromDateTimeOffset(now), timezone);
            var start = new CalDateTime(znow.LocalDateTime.ToDateTimeUnspecified(), tz);

            //Console.WriteLine("timezone {0}, znow: {1}, start: {2}", timezone, znow, start);

            var e = new Event
            {
                DtStart = start,
                Duration = new TimeSpan(1, 0, 0),
                RecurrenceRules = new List<IRecurrencePattern> { rrule },
            };

            var calendar = new Calendar();
            calendar.Events.Add(e);

            //var serializer = new CalendarSerializer(new SerializationContext());
            //return serializer.SerializeToString(calendar);

            var endSearch = new DateTime(2017, 1, 1, 12, 0, 0).ToUniversalTime();
            return calendar.GetOccurrences(now.UtcDateTime, endSearch).Aggregate("", (ret, a) =>
            {
                return ret + a.Period.StartTime.AsUtc.ToString() + "\n";
            });
        }
        #endregion
        #endregion
    }
}
