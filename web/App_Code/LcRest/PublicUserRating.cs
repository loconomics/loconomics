using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Public User Rating stats/average
    /// </summary>
    public class PublicUserRating
    {
        #region Fields
        public decimal rating1;
        public decimal rating2;
        public decimal rating3;
        public decimal ratingAverage;
        public long totalRatings;
        public decimal serviceHours;
        //public int totalUsersSatisfied;
        public DateTime? lastRatingDate;
        #endregion

        public static PublicUserRating FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserRating
            {
                rating1 = record.rating1,
                rating2 = record.rating2,
                rating3 = record.rating3,
                ratingAverage = record.ratingAverage,
                totalRatings = record.totalRatings,
                serviceHours = record.serviceHours,
                //totalUsersSatisfied = record.totalUsersSatisfied,
                lastRatingDate = record.lastRatingDate
            };
        }

        #region SQL
        // @params: @0:UserID,@1:PositionID. PositionID special values: -1=global-rating, 0=client-rating, -2=freelance-jobprofile-rating
        // SQL NOTE: the aggregated operations are needed to this sql mainly for the PositionID=-1 option
        // and in other cases is useful too, although results are unique per user and position, with aggregation
        // we can get default values when there are not a record for the user and avoid
        // exceptions because the null record:
        private const string sqlSelect = @"
        SELECT  TOP 1
                coalesce(avg(Rating1), 0) As rating1,
                coalesce(avg(Rating2), 0) As rating2,
                coalesce(avg(Rating3), 0) As rating3,
                (coalesce(avg(Rating1), 0) + coalesce(avg(Rating2), 0) + coalesce(avg(Rating3), 0)) / 3 As ratingAverage,
                coalesce(sum(ServiceHours), 0) As serviceHours,
                coalesce(max(UpdatedDate), 0) As lastRatingDate,
                coalesce(sum(TotalRatings), 0) As totalRatings
                -- ,coalesce(sum(Answer2), 0) As totalUsersSatisfied
        FROM    UserReviewScores
        WHERE   UserID = @0
                 AND
                (PositionID = @1 
                    OR @1 = -1
                    OR (@1 = -2 AND PositionID > 0))
    ";
        #endregion

        #region Fetch
        ///
        /// jobTitleID: special values: -1=global-rating, 0=client-rating, -2=freelance-jobprofile-rating
        ///
        public static PublicUserRating Get(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlSelect, userID, jobTitleID));
            }
        }
        #endregion
    }
}