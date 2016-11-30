using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Get statistical information about the upcoming bookings 
    /// for the service professional, like how many, when starts, for different criteria.
    /// It includes the next booking (closest in time to the moment of the request).
    /// IMPORTANT: Bookings where the requested user is client are NOT included; check UpcomingAppointmentsInfo for that
    /// </summary>
    public class UpcomingBookingsInfo
    {
        public class Summary
        {
            #region Fields
            public int quantity;
            public DateTimeOffset? time;
            #endregion
        }

        #region Fields
        public Summary today;
        public Summary tomorrow;
        public Summary thisWeek;
        public Summary nextWeek;
        public Booking nextBooking;
        #endregion

        #region Get
        #region SQL
        private const string sqlGetBookingsSumByDateRange = @"
            SELECT  count(*) as count,
                    min(E.StartTime) as startTime,
                    max(E.EndTime) as endTime
            FROM    Booking As B
                     INNER JOIN
                    CalendarEvents As E
                      ON E.Id = B.ServiceDateID
            WHERE   
                    -- Any bookings, as provider or customer
                    (
                        B.ServiceProfessionalUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                         AND
                        E.StartTime <= @2
                    )
                    AND B.BookingStatusID = 6
        ";
        private const string sqlGetNextBookingID = @"
            SELECT  TOP 1
                    B.BookingID
            FROM    Booking As B
                     INNER JOIN
                    CalendarEvents As E
                      ON E.Id = B.ServiceDateID
            WHERE   
                    -- Any bookings, as provider or customer
                    (
                        B.ServiceProfessionalUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                    )
                     AND B.BookingStatusID = 6
            ORDER BY E.StartTime ASC
        ";
        #endregion

        public static UpcomingBookingsInfo GetList(int userID)
        {
            var ret = new UpcomingBookingsInfo();

            // Preparing dates for further filtering
            var leftToday = DateTime.Now;
            var leftTodayEnd = DateTime.Today.AddDays(1).AddSeconds(-1);
            var tomorrow = DateTime.Today.AddDays(1);
            var tomorrowEnd = tomorrow.AddDays(1).AddSeconds(-1);
            // This week is today until the end of Sunday
            int daysUntilSunday = (((int)DayOfWeek.Monday - (int)DateTime.Today.DayOfWeek + 7) % 7);
            var thisWeekStart = DateTime.Now;
            var thisWeekEnd = DateTime.Today.AddDays(daysUntilSunday).AddSeconds(-1);

            // Next week is from the next Monday until Sunday
            var nextWeekStart = DateTime.Today.AddDays(daysUntilSunday);
            var nextWeekEnd = nextWeekStart.AddDays(7).AddSeconds(-1);

            using (var db = new LcDatabase())
            {
                dynamic d = null;

                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, leftToday, leftTodayEnd);
                ret.today = new Summary
                {
                    quantity = d.count,
                    // NOTE: What if the endTime is for a different date? Last work hour on the date?
                    time = d.endTime
                };

                // NOTE: what if there is a booking for several days and we are in the middel of that? First work hour on the date?
                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, tomorrow, tomorrowEnd);
                ret.tomorrow = new Summary
                {
                    quantity = d.count,
                    time = d.startTime
                };
                
                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, thisWeekStart, thisWeekEnd);
                ret.thisWeek = new Summary
                {
                    quantity = d.count,
                    time = d.startTime
                };
                
                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, nextWeekStart, nextWeekEnd);
                ret.nextWeek = new Summary
                {
                    quantity = d.count,
                    time = d.startTime
                };

                var nextBookingID = (int?)db.QueryValue(sqlGetNextBookingID, userID, leftToday);
                if (nextBookingID.HasValue)
                {
                    ret.nextBooking = Booking.Get(nextBookingID.Value, true, false, userID);
                }
            }

            return ret;
        }
        #endregion
    }
}
