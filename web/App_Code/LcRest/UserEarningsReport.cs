using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class UserEarningsReport
    {
        #region Fields
        public decimal total;
        public decimal paidOut;
        public decimal expected;
        public int entriesCount;
        public int totalDurationMinutes;
        public decimal averageHourlyRate
        {
            get
            {
                return totalDurationMinutes == 0 ? 0 : total / (totalDurationMinutes / 60M);
            }
        }
        /// <summary>
        /// Job title name or 'all' depending on the report query
        /// </summary>
        public string jobTitleName = "All job titles";
        /// <summary>
        /// Listing title or 'all' depending on the report query
        /// </summary>
        public string listingTitle = "All listings/platforms";
        #endregion

        #region Instances
        public UserEarningsReport() { }

        public static UserEarningsReport FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserEarningsReport
            {
                total = record.total ?? 0,
                paidOut = record.paidOut ?? 0,
                expected = record.expected ?? 0,
                entriesCount = record.entriesCount ?? 0,
                totalDurationMinutes = record.totalDurationMinutes ?? 0
            };
        }
        #endregion

        #region Query
        #region SQL
        const string sqlQuery = @"
        SELECT
	        SUM(amount) as total
	        ,SUM(paidOut) as paidOut
	        ,SUM(expected) as expected
	        ,count(*) as entriesCount
	        ,SUM(durationMinutes) as totalDurationMinutes
        FROM (
          SELECT 
              amount
              ,CASE WHEN PaidDate < GETDATE() THEN amount ELSE 0 END as paidOut
              ,CASE WHEN PaidDate >= GETDATE() THEN amount ELSE 0 END as expected
              ,DurationMinutes
      
          FROM [UserEarningsEntry]
          WHERE active = 1 and UserID = 141
        ) AS T
    ";
        #endregion
        public static UserEarningsReport Query(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlQuery, userID));
            }
        }
        #endregion
    }
}
