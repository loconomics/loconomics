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

        #region Filters class
        public class EarningsFilterValues
        {
            public DateTimeOffset? fromDate;
            public DateTimeOffset? toDate;
            public int? jobTitleID;
            public int? userExternalListingID;
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
              WHERE active = 1 and UserID = @0
                AND (@1 is null OR PaidDate >= @1)
                AND (@2 is null OR PaidDate <= @2)
                AND (@3 is null OR JobTitleID = @3)
                AND (@4 is null OR UserExternalListingID = @4)
            ) AS T
        ";
        #endregion
        public static UserEarningsReport Query(int userID, EarningsFilterValues filter)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlQuery, userID, filter.fromDate, filter.toDate, filter.jobTitleID, filter.userExternalListingID));
            }
        }
        #endregion

        #region Query CCC Admin
        #region SQL
        const string sqlQueryCccStudents = @"
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
              FROM UserEarningsEntry
                INNER JOIN CCCUsers
                ON UserEarningsEntry.UserID = CCCUsers.UserID
                    AND CCCUsers.UserType = 'student'
              WHERE active = 1
                AND (@0 is null OR PaidDate >= @0)
                AND (@1 is null OR PaidDate <= @1)
                AND (@2 is null OR JobTitleID = @2)
                AND (@3 is null OR UserExternalListingID = @3)
                AND (@4 is null OR CCCUsers.institutionID = @4)
            ) AS T
        ";
        #endregion
        public static UserEarningsReport QueryAllCccStudents(EarningsFilterValues filter)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlQueryCccStudents, filter.fromDate, filter.toDate, filter.jobTitleID, filter.userExternalListingID, null));
            }
        }
        public static UserEarningsReport QueryCccCollegeStudents(EarningsFilterValues filter, int institutionID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlQueryCccStudents, filter.fromDate, filter.toDate, filter.jobTitleID, filter.userExternalListingID, institutionID));
            }
        }
        #endregion
    }
}
