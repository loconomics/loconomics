using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Descripción breve de UpcomingBookingsInfo
    /// </summary>
    public class UpcomingBookingsInfo
    {
        public class Summary
        {
            #region Fields
            public int quantity;
            public DateTime? time;
            #endregion
        }

        #region Fields
        public Summary today;
        public Summary tomorrow;
        public Summary thisWeek;
        public Summary nextWeek;
        public int? nextBookingID;
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
                     B.ClientUserID=@0
                      OR
                     B.ServiceProfessionalUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                         AND
                        E.StartTime <= @2
                    )
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
                      OR
                     B.ServiceProfessionalUserID=@0
                    )
                     AND
                    (   
                        E.StartTime >= @1
                    )
            ORDER BY E.StartTime ASC
        ";
        #endregion

        public static UpcomingBookingsInfo GetList(int userID)
        {
            var ret = new UpcomingBookingsInfo();

            // Preparing dates for further filtering
            var leftToday = DateTime.Now;
            var tomorrow = DateTime.Today.AddDays(1);
            // This week is today until the end of Sunday
            int daysUntilSunday = (((int) DayOfWeek.Monday - (int) today.DayOfWeek + 7) % 7) + 1; 
            var thisWeekStart = DateTime.Now;
            var thisWeekEnd = leftToday.AddDays(daysUntilSunday).AddSeconds(-1);
            
            // Next week is from the next Monday until Sunday
            var nextWeekStart = tomorrow.AddDays(daysUntilSunday + 1).AddSeconds(-1);
            var nextWeekEnd = nextWeekStart.AddDays(7);

            using (var db = new LcDatabase())
            {
                dynamic d = null;

                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, leftToday, tomorrow);
                ret.today = new Summary
                {
                    quantity = d.count,
                    // NOTE: What if the endTime is for a different date? Last work hour on the date?
                    time = d.endTime
                };

                // NOTE: what if there is a booking for several days and we are in the middel of that? First work hour on the date?
                d = db.QuerySingle(sqlGetBookingsSumByDateRange, userID, tomorrow, nextWeekStart);
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

                ret.nextBookingID = db.QueryValue(sqlGetNextBookingID, userID, leftToday);
            }

            return ret;
        }
        #endregion

        #region OLD UpcomingBookings Code
        /*
        #region SQLs
        private const string sqlGetBookingsByDateRange = @"
        SELECT  B.BookingID,
                B.ServiceProfessionalUserID,
                B.ClientUserID,
                B.PricingSummaryID,
                B.BookingStatusID,

                UC.FirstName As CustomerFirstName,
                UC.LastName As CustomerLastName,

                UP.FirstName As ProviderFirstName,
                UP.LastName As ProviderLastName,

                E.StartTime,
                E.EndTime,
                E.TimeZone,
                Pos.PositionSingular,
                Pr.TotalPrice As CustomerPrice,
                (Pr.SubtotalPrice - Pr.PFeePrice) As ProviderPrice
        FROM    Booking As B
                 INNER JOIN
                PricingSummary As Pr
                  ON Pr.PricingSummaryID = B.PricingSummaryID AND Pr.PricingSummaryRevision = B.PricingSummaryRevision
                 INNER JOIN
                Users As UC
                  ON UC.UserID = B.ClientUserID
                 INNER JOIN
                Users As UP
                  ON UP.UserID = B.ServiceProfessionalUserID
                 LEFT JOIN
                CalendarEvents As E
                  ON E.Id = B.ServiceDateID
                 INNER JOIN
                Positions As Pos
                  ON Pos.PositionID = R.PositionID
					AND Pos.LanguageID = @3 AND Pos.CountryID = @4
        WHERE   (
                 B.ClientUserID=@0
                  OR
                 B.ServiceProfessionalUserID=@0
                )
                 AND
                (   @1 is null AND E.StartTime is null
                    OR
                    Convert(date, E.StartTime) >= @1
                     AND
                    Convert(date, E.StartTime) <= @2
                )
        ORDER BY E.StartTime DESC, B.UpdatedDate DESC
        ";
        #endregion

        public static Dictionary<string, dynamic> GetUpcomingBookings(int userID, int upcomingLimit = 10)
        {
            var ret = new Dictionary<string, dynamic>();

            // Preparing dates for further filtering
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            // This week must not include today and tomorrow, to avoid duplicated entries
            var upcomingFirstDay = tomorrow.AddDays(1);
            var upcomingLastDay = System.Data.SqlTypes.SqlDateTime.MaxValue; // DateTime.MaxValue;

            using (var db = Database.Open("sqlloco"))
            {
                var l = LcData.GetCurrentLanguageID();
                var c = LcData.GetCurrentCountryID();
                dynamic d = null;

                d = db.Query(sqlGetBookingsByDateRange, userID, today, today, l, c);
                if (d != null && d.Count > 0)
                {
                    ret["today"] = d;
                }
                d = db.Query(sqlGetBookingsByDateRange, userID, tomorrow, tomorrow, l, c);
                if (d != null && d.Count > 0)
                {
                    ret["tomorrow"] = d;
                }

                var sqlLimited = sqlGetBookingsByDateRange.Replace("SELECT", "SELECT TOP " + upcomingLimit.ToString());
                d = db.Query(sqlLimited, userID, upcomingFirstDay, upcomingLastDay, l, c);
                if (d != null && d.Count > 0)
                {
                    ret["upcoming"] = d;
                }
            }

            return ret;
        }
        */
        #endregion
    }
}
