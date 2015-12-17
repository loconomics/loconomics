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
        public int helpfulReviewCount;
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
            SELECT
                R.PositionID As jobTitleID,
                R.CustomerUserID As reviewerUserID,
                R.ProviderUserID As reviewedUserID,
                UC.FirstName As reviewerFirstName,
                UC.LastName As reviewerLastName,
                UC.CreatedDate As reviewerUserSince,
                R.rating1, R.rating2, R.rating3
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
                R.ProviderUserID = @0
                    AND
                R.PositionID = @1
        ";
        private const string sqlSelectClientReview = @"
            SELECT
                R.PositionID As jobTitleID,
                R.CustomerUserID As reviewedUserID,
                R.ProviderUserID As reviewerUserID,
                UC.FirstName As reviewerFirstName,
                UC.LastName As reviewerLastName,
                UC.CreatedDate As reviewerUserSince,
                R.rating1, R.rating2, R.rating3
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
                R.CustomerUserID = @0
                    AND
                R.PositionID = 0
        ";
        #endregion

        #region Fetch
        ///
        /// jobTitleID: must be 0 for customer review.
        ///
        public static PublicUserReview Get(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(jobTitleID == 0 ? sqlSelectClientReview : sqlSelectJobReview, userID, jobTitleID));
            }
        }
        #endregion
    }
}