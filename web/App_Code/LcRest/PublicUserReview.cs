using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// PublicUserReviews
    /// </summary>
    public class PublicUserReview
    {
        #region Fields
        public int bookingID;
        /// <summary>
        /// Can be 0 for reviews to customers
        /// </summary>
        public int jobTitleID;
        public int reviewerUserID;
        public int reviewedUserID;
        public DateTime reviewerUserSince;
        public decimal rating1;
        public decimal rating2;
        public decimal rating3;
        public string publicReview;
        public decimal serviceHours;
        public long helpfulReviewCount;
        public DateTime updatedDate;
        private string reviewerFirstName;
        private string reviewerLastName;
        public string reviewerName
        {
            get
            {
                var l = "";
                if (!String.IsNullOrEmpty(reviewerLastName) && reviewerLastName.Length > 1)
                    l = " " + reviewerLastName.Substring(0, 1) + ".";
                return reviewerFirstName + l;
            }
        }
        #endregion

        #region Instances
        public static PublicUserReview FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserReview
            {
                bookingID = record.bookingID,
                jobTitleID = record.jobTitleID,
                reviewedUserID = record.reviewedUserID,
                reviewerUserID = record.reviewerUserID,
                reviewerFirstName = record.reviewerFirstName,
                reviewerLastName = record.reviewerLastName,
                reviewerUserSince = record.reviewerUserSince,
                serviceHours = record.serviceHours,
                helpfulReviewCount = record.helpfulReviewCount,
                publicReview = record.publicReview,
                updatedDate = record.updatedDate,
                rating1 = record.rating1,
                rating2 = record.rating2,
                rating3 = record.rating3
            };
        }
        #endregion

        #region SQL
        private const string sqlSelectJobReview = @"
            SELECT TOP @0
                R.BookingID As bookingID,
                R.PositionID As jobTitleID,
                R.CustomerUserID As reviewerUserID,
                R.ProviderUserID As reviewedUserID,
                UC.FirstName As reviewerFirstName,
                UC.LastName As reviewerLastName,
                UC.CreatedDate As reviewerUserSince,
                R.rating1, R.rating2, R.rating3,
                R.publicReview,
                R.updatedDate,
                R.serviceHours,
                R.helpfulReviewCount
            FROM
                UserReviews As R
                    INNER JOIN
                Users As UC
                    ON UC.UserID = R.CustomerUserID
            WHERE
                R.ProviderUserID = @1
                    AND
                R.PositionID = @2
        ";
        private const string sqlSelectClientReview = @"
            SELECT TOP @0
                R.BookingID As bookingID,
                R.PositionID As jobTitleID,
                R.CustomerUserID As reviewedUserID,
                R.ProviderUserID As reviewerUserID,
                UC.FirstName As reviewerFirstName,
                UC.LastName As reviewerLastName,
                UC.CreatedDate As reviewerUserSince,
                R.rating1, R.rating2, R.rating3,
                R.publicReview,
                R.updatedDate,
                R.serviceHours,
                R.helpfulReviewCount
            FROM
                UserReviews As R
                    INNER JOIN
                Users As UC
                    ON UC.UserID = R.ProviderUserID
            WHERE
                R.CustomerUserID = @1
                    AND
                R.PositionID = 0
        ";
        private const string sqlAndUntilSince = @"
                    AND
                (@3 is null OR R.UpdatedDate < @3)
                    AND
                (@4 is null OR R.UpdatedDate > @4)
        ";
        private const string sqlOrderDesc = @"
            ORDER BY R.UpdatedDate DESC
        ";
        private const string sqlOrderAsc = @"
            ORDER BY R.UpdatedDate ASC
        ";
        #endregion

        #region Fetch
        ///
        /// jobTitleID: must be 0 for customer review.
        ///
        public static IEnumerable<PublicUserReview> GetList(int userID, int jobTitleID, int limit = 20, DateTime? since = null, DateTime? until = null)
        {
            // Maximum limit: 100
            if (limit > 100)
                limit = 100;
            else if (limit < 1)
                limit = 1;

            var sql = jobTitleID == 0 ? sqlSelectClientReview : sqlSelectJobReview;
            sql += sqlAndUntilSince;
            // Generally, we get the more recent records (order desc), except
            // if the parameter since was set without an until: we
            // want the closest ones to that, in other words, 
            // the older records that are more recent that sinceID.
            // A final sorting is done to return rows in descending as ever.
            var usingSinceOnly = since.HasValue && !until.HasValue;
            if (usingSinceOnly)
            {
                sql += sqlOrderAsc;
            }
            else
            {
                // Default
                sql += sqlOrderDesc;
            }

            // db.Query has a bug not processing parameters in 'select top @1'
            // so manual replacement
            // IMPORTANT: Still included 'limit' in the db.Query so it counts to the assignments by index
            sql = sql.Replace("@0", limit.ToString());

            using (var db = new LcDatabase())
            {
                var data = db.Query(sql, limit, userID, jobTitleID, until, since).Select(FromDB);
                if (usingSinceOnly)
                {
                    // Since rows were get in ascending, records need to be inverted
                    // so we ever return data in descending order (latest first).
                    return data.Reverse();
                }
                else
                {
                    return data;
                }
            }
        }
        #endregion
    }
}