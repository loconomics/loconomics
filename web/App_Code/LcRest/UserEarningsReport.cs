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
            public int? platformID;
            public int? institutionID;
            public int? fieldOfStudyID;
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
        const string sqlCccAdminReport = @"
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
                LEFT JOIN UserExternalListing As UEL
                ON UEL.UserExternalListingID = UserEarningsEntry.UserExternalListingID
                   AND UEL.Active = 1
              WHERE UserEarningsEntry.active = 1
                AND (@0 is null OR PaidDate >= @0)
                AND (@1 is null OR PaidDate <= @1)
                AND (@2 is null OR JobTitleID = @2)
                AND (@3 is null OR UEL.PlatformID = @3)
                AND (@4 is null OR CCCUsers.institutionID = @4)
                AND (@5 is null OR CCCUsers.fieldOfStudyID = @5)

              UNION ALL

                SELECT
                  (PricingSummary.totalPrice - PricingSummary.serviceFeeAmount) as amount
                  ,CASE WHEN Booking.BookingStatusID IN (3, 8)
                        THEN PricingSummary.totalPrice - PricingSummary.serviceFeeAmount
                        ELSE 0 END as paidOut
                  ,CASE WHEN Booking.BookingStatusID = 7
                        THEN PricingSummary.totalPrice - PricingSummary.serviceFeeAmount
                        ELSE 0 END as expected
                  ,PricingSummary.ServiceDurationMinutes as durationMinutes
                FROM Booking
                INNER JOIN CalendarEvents
                ON CalendarEvents.Id = Booking.ServiceDateID
                INNER JOIN PricingSummary
                ON Booking.PricingSummaryID = PricingSummary.PricingSummaryID
                    AND Booking.PricingSummaryRevision = PricingSummary.PricingSummaryRevision
                INNER JOIN CCCUsers
                ON Booking.ServiceProfessionalUserID = CCCUsers.UserID
                    AND CCCUsers.UserType = 'student'
                INNER JOIN UserProfilePositions As J
                ON J.PositionID = Booking.JobTitleID
                    AND J.UserID = Booking.ServiceProfessionalUserID
                WHERE
                    Booking.BookingStatusID IN (3, 7, 8) -- cancelled (can had paidOut cancellation feeds or 0), servicePerformed (expected) or completed (paidOut)
                    AND PricingSummary.TotalPrice > 0 -- (dont countr free services)
                    AND (@0 is null OR CalendarEvents.EndTime >= @0)
                    AND (@1 is null OR CalendarEvents.EndTime <= @1)
                    AND (@2 is null OR Booking.JobTitleID = @2)
                    AND (@3 is null OR 1 = @3) -- special platformID=1 Loconomics
                    AND (@4 is null OR CCCUsers.institutionID = @4)
                    AND (@5 is null OR CCCUsers.fieldOfStudyID = @5)
            ) AS T
        ";
        #endregion
        public static UserEarningsReport CccAdminReport(EarningsFilterValues filter)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlCccAdminReport,
                    filter.fromDate, filter.toDate,
                    filter.jobTitleID,
                    filter.platformID,
                    filter.institutionID,
                    filter.fieldOfStudyID));
            }
        }

        #endregion

        #region Query CCC Admin Detailed Report
        #region SQL
        const string sqlCccAdminDetailedReport = @"
            SELECT
                E.paidDate,
                E.userID,
                P.name as platform,
                J.positionSingular as jobTitle,
                C.institutionName as college,
                E.amount as earnings,
                E.durationMinutes as minutes,
                (F.fieldOfStudyName + '    (' + CAST(F.CCCTOPCode as nvarchar) + ')') as fieldOfStudy,
                U.studentID,
                Cast((UU.BirthYear + '-' + UU.BirthMonth + '-' + UU.BirthMonthDay) as datetime) as dateOfBirth
            FROM
                UserEarningsEntry As E
                  INNER JOIN
                UserExternalListing As L
                    ON E.userExternalListingID = L.userExternalListingID
                 INNER JOIN
                platform as P
                    ON P.platformID = L.platformID
                    AND P.languageID = @0 AND P.countryID = @1
                  INNER JOIN
                positions as J
                    ON J.positionID = E.jobTitleID
                    AND J.languageID = @0 AND J.countryID = @1
                  INNER JOIN
                CCCUsers as U
                    ON U.UserID = E.UserID
                  INNER JOIN
                Users as UU
                    ON UU.UserID = E.UserID
                  INNER JOIN
                institution As C
                    ON C.institutionID = U.institutionID
                  INNER JOIN
                fieldOfStudy As F
                    ON F.fieldOfStudyID = U.fieldOfStudyID
              WHERE
                E.active = 1
                AND (@2 is null OR E.PaidDate >= @2)
                AND (@3 is null OR E.PaidDate <= @3)
                AND (@4 is null OR E.JobTitleID = @4)
                AND (@5 is null OR L.PlatformID = @5)
                AND (@6 is null OR U.institutionID = @6)
                AND (@7 is null OR U.fieldOfStudyID = @7)
        ";
        #endregion
        public class DetailedReport
        {
            public DateTimeOffset paidDate;
            public int userID;
            public string platform;
            public string jobTitle;
            public string college;
            public decimal earnings;
            public int minutes;
            public string fieldOfStudy;
            public int? studentID;
            public DateTimeOffset? dateOfBirth;

            public static DetailedReport FromDB(dynamic record)
            {
                if (record == null) return null;
                return new DetailedReport
                {
                    paidDate = record.paidDate,
                    userID = record.userID,
                    platform = record.platform,
                    college = record.college,
                    earnings = record.earnings,
                    fieldOfStudy = record.fieldOfStudy,
                    jobTitle = record.jobTitle,
                    minutes = record.minutes,
                    studentID = record.studentID,
                    dateOfBirth = record.dateOfBirth
                };
            }
        }
        public static IEnumerable<DetailedReport> CccAdminDetailedReport(EarningsFilterValues filter, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlCccAdminDetailedReport,
                    locale.languageID, locale.countryID,
                    filter.fromDate, filter.toDate,
                    filter.jobTitleID,
                    filter.platformID,
                    filter.institutionID,
                    filter.fieldOfStudyID)
                    .Select(DetailedReport.FromDB);
            }
        }
        #endregion
    }
}
