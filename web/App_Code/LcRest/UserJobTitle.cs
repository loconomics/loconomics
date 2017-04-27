using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// User Job Title record
    /// 
    /// TODO: Initial draft migrating some LcData.JobTitle stuff, need to be finished and replaced the old LcData.* class
    /// </summary>
    public class UserJobTitle
    {
        #region Fields
        public int userID;
        public int jobTitleID;

        public string intro;
        public int statusID;
        public int cancellationPolicyID;
        public bool instantBooking;
        public bool bookMeButtonReady;
        public bool collectPaymentAtBookMeButton;

        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        public static UserJobTitle FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserJobTitle
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,

                intro = record.intro,
                cancellationPolicyID = record.cancellationPolicyID,
                instantBooking = record.instantBooking,
                bookMeButtonReady = record.bookMeButtonReady,
                collectPaymentAtBookMeButton = record.collectPaymentAtBookMeButton,

                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }

        #region Fetch
        #region SQL
        /// <summary>
        /// Get list by user or explicit job title if a value different than -1 is given
        /// </summary>
        private const string sqlGet = @"
            SELECT
                u.UserID As userID,
                u.PositionID As jobTitleID,
                u.PositionIntro As intro,
                u.StatusID As statusID,
                u.CancellationPolicyID As cancellationPolicyID,
                u.InstantBooking As instantBooking,
                u.CreateDate As createdDate,
                u.UpdatedDate As updatedDate,
                u.bookMeButtonReady As bookMeButtonReady,
                u.collectPaymentAtBookMeButton As collectPaymentAtBookMeButton
            FROM
                userprofilepositions as u
                    INNER JOIN
                positions on u.positionID = positions.positionID AND positions.languageID = @1 and positions.countryID = @2
            WHERE
                u.UserID = @0
                    AND u.LanguageID = @1
                    AND u.CountryID = @2
                    AND u.Active = 1
                    AND u.StatusID > 0
                    AND (@3 = -1 OR @3 = u.PositionID)
                    -- Double check for approved positions
                    AND positions.Active = 1
                    AND (positions.Approved = 1 Or positions.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        ";
        #endregion

        public static IEnumerable<UserJobTitle> GetByUser(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlGet, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), -1).Select(FromDB);
            }
        }

        public static UserJobTitle GetItem(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlGet, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), jobTitleID));
            }
        }
        #endregion
    }
}
