using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Get statistical information about the upcoming bookings
    /// for the client, like how many, when starts, for different criteria.
    /// It includes the next booking (closest in time to the moment of the request).
    /// IMPORTANT: Bookings where the requested user is service-professional are NOT included; check UpcomingBookingsInfo for that
    /// </summary>
    public class UpcomingAppointmentsInfo
    {
        public class Summary
        {
            #region Fields
            public int quantity;
            public DateTime? time;
            #endregion
        }

        #region Fields
        /// <summary>
        /// Booking requests pending of confirmation
        /// </summary>
        public Summary pendingRequests;
        /// <summary>
        /// All future bookings, including the nextBooking
        /// </summary>
        public Summary nextOnes;
        /// <summary>
        /// Multi-session booking with sessions pending of scheduling
        /// </summary>
        public Summary pendingScheduling;
        /// <summary>
        /// Next booking, closest to current time
        /// </summary>
        public Booking nextBooking;
        #endregion

        #region Get
        #region SQL
        private const string sqlGetBookingsSumSinceDate = @"
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
                        B.ClientUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                    )
                    AND B.BookingStatusID = @2
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
                        B.ClientUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                    )
                     AND B.BookingStatusID = @2
            ORDER BY E.StartTime ASC
        ";
        #endregion

        public static UpcomingAppointmentsInfo GetList(int userID)
        {
            var ret = new UpcomingAppointmentsInfo();

            using (var db = new LcDatabase())
            {
                dynamic d = null;

                d = db.QuerySingle(sqlGetBookingsSumSinceDate, userID, DateTime.Now, LcEnum.BookingStatus.confirmed);
                ret.nextOnes = new Summary
                {
                    quantity = d.count,
                    time = d.startTime
                };

                // NOTE: what if there is a booking for several days and we are in the middel of that? First work hour on the date?
                d = db.QuerySingle(sqlGetBookingsSumSinceDate, userID, DateTime.Now, LcEnum.BookingStatus.request);
                ret.pendingRequests = new Summary
                {
                    quantity = d.count,
                    time = d.startTime
                };

                // TODO Implement multi-session pending scheduling look-up
                //d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, DateTime.Now, ...);
                //ret.pendingScheduling = new Summary
                //{
                //    quantity = d.count,
                //    time = d.startTime
                //};

                var nextBoookingID = (int?)db.QueryValue(sqlGetNextBookingID, userID, DateTime.Now, LcEnum.BookingStatus.confirmed);
                if (nextBoookingID.HasValue) {
                    ret.nextBooking = Booking.Get(nextBoookingID.Value, true, false, userID);
                }
            }

            return ret;
        }
        #endregion
    }
}
