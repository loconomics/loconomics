using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// UserJobTitle record
    /// 
    /// </summary>
    public class UserJobTitle
    {
        public enum ProfileStatus : short
        {
            Deleted = 0,
            /// <summary>
            /// Profile is publicly available
            /// </summary>
            On = 1,
            /// <summary>
            /// Profile is not publicly available, but _may_ be able to be automatically activated
            /// </summary>
            Incomplete = 2,
            /// <summary>
            /// Profile has been disabled by the user and _may_ be able to be manually activated
            /// </summary>
            Off = 3
        }

        #region Fields
        public int userID;
        public int jobTitleID;

        public string intro;
        public ProfileStatus statusID;
        public int cancellationPolicyID;
        public bool instantBooking;
        public bool bookMeButtonReady;
        public bool collectPaymentAtBookMeButton;
        public List<Alert> alerts;

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
                statusID = (ProfileStatus)record.statusID,
                cancellationPolicyID = record.cancellationPolicyID,
                instantBooking = record.instantBooking,
                bookMeButtonReady = record.bookMeButtonReady,
                collectPaymentAtBookMeButton = record.collectPaymentAtBookMeButton,

                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }

        private void BindAlerts(Dictionary<int, IEnumerable<Alert>> alertsCollection)
        {
            alerts = alertsCollection.ContainsKey(jobTitleID) ? alertsCollection[jobTitleID].ToList() : new List<Alert>();
        }

        private static IEnumerable<UserJobTitle> BindAlerts(IEnumerable<UserJobTitle> userJobTitles, Dictionary<int, IEnumerable<Alert>> alerts)
        {
            foreach(UserJobTitle userJobTitle in userJobTitles)
            {
                userJobTitle.BindAlerts(alerts);
            }

            return userJobTitles;
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
            const int jobTitleID = -1;

            using (var db = new LcDatabase())
            {
                var userJobTitles = db.Query(sqlGet,
                                userID,
                                LcData.GetCurrentLanguageID(),
                                LcData.GetCurrentCountryID(),
                                jobTitleID)
                .Select(FromDB);

                return BindAlerts(userJobTitles, Alert.IndexByPosition(Alert.GetActive(userID)));
            }
        }

        public static UserJobTitle GetItem(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                var userJobTitle = FromDB(db.QuerySingle(sqlGet,
                                             userID,
                                             LcData.GetCurrentLanguageID(),
                                             LcData.GetCurrentCountryID(),
                                             jobTitleID));

                userJobTitle.alerts = Alert.GetActive(userID, jobTitleID).ToList();

                return userJobTitle;
            }
        }
        #endregion

        public static void Create(UserJobTitle userJobTitle)
        {
            using (var db = new LcDatabase())
            {
                var results = db.QuerySingle("EXEC dbo.InsertUserProfilePositions @0, @1, @2, @3, @4, @5, @6, @7",
                    userJobTitle.userID,
                    userJobTitle.jobTitleID,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID(),
                    userJobTitle.cancellationPolicyID,
                    userJobTitle.intro,
                    userJobTitle.instantBooking,
                    userJobTitle.collectPaymentAtBookMeButton);

                if (results.Result != "Success")
                {
                    throw new Exception("We're sorry, there was an error creating your job title: " + results.Result);
                }
            }
        }

        public static bool Update(UserJobTitle userJobTitle)
        {
            var sqlUpdate = @"
                UPDATE  UserProfilePositions
                SET     PositionIntro = @4,
                        CancellationPolicyID = @5,
                        InstantBooking = @6,
                        collectPaymentAtBookMeButton = @7,
                        UpdatedDate = getdate()
                WHERE   UserID = @0 AND PositionID = @1
                    AND LanguageID = @2
                    AND CountryID = @3
            ";

            using (var db = new LcDatabase())
            {
                var affected = db.Execute(sqlUpdate,
                    userJobTitle.userID,
                    userJobTitle.jobTitleID,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID(),
                    userJobTitle.intro,
                    userJobTitle.cancellationPolicyID,
                    userJobTitle.instantBooking,
                    userJobTitle.collectPaymentAtBookMeButton
                );

                // Task done? Almost a record must be affected to be a success
                return affected > 0;
            }
        }

        public static bool Delete(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                // Set StatusID to 0 'deleted by user'
                int affected = db.Execute(@"
                    UPDATE UserProfilePositions
                    SET     StatusID = 0,
                            UpdatedDate = getdate()
                    WHERE UserID = @0 AND PositionID = @1
                     AND LanguageID = @2
                     AND CountryID = @3
                ", userID, jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                // Task done? Almost a record must be affected to be a success
                return affected > 0;
            }
        }

        /// <summary>
        /// Deactivation consists in switch the status of the profile
        /// to 'manually disabled / private'.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <returns></returns>
        public static bool Deactivate(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                // It just update StatusID to 3 'private profile, manual activation'
                var affected = db.Execute(@"
                        UPDATE UserProfilePositions
                        SET     StatusID = 3,
                                UpdatedDate = getdate()
                        WHERE UserID = @0 AND PositionID = @1
                            AND LanguageID = @2
                            AND CountryID = @3
                    ",
                    userID, jobTitleID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                // Task done? Almost a record must be affected to be a success
                return affected > 0;
            }
        }

        /// <summary>
        /// Reactivation consists in switch the status of the profile
        /// to the 'active' state but only if the profile fullfill the constraints
        /// for 'active profiles', so the profile can get stucked
        /// in the non-active state as a result, pending on requesting
        /// a reactivation once its contraints are fullfilled.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <returns></returns>
        public static bool Reactivate(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                // Check the current StatusID
                var statusID = LcData.UserInfo.GetUserPositionStatus(userID, jobTitleID);

                // If status is -1, the records does not exists
                if (statusID == -1)
                {
                    return false;
                }

                // If status is of type 3 'private profile, manual activation'..
                if (statusID == 3)
                {
                    // ..modify the profile StatusID from 3 to 2 'private profile, automatic activation'
                    // (because the TestProfileActivation only works for StatusID:2 to avoid unexpected changes)
                    db.Execute(@"
                            UPDATE  UserProfilePositions
                            SET     StatusID = 2,
                                    UpdatedDate = getdate()
                            WHERE UserID = @0 AND PositionID = @1
                                AND LanguageID = @2
                                AND CountryID = @3
                        ", userID, jobTitleID,
                        LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                }

                // It executes the profile activation that checks that all required alerts must be off to activate:
                db.Execute("EXEC TestProfileActivation @0, @1", userID, jobTitleID);

                // Check the updated StatusID
                var newStatusID = LcData.UserInfo.GetUserPositionStatus(userID, jobTitleID);
                // If the status is 1 'public profile', success!
                if (newStatusID == 1)
                {
                    return true;
                }
                else
                {
                    // It is Not activated still, required alerts are pending, back to the original
                    // StatusID if was not 2 originally (it was updated in the middle of the process to run
                    // the TestProfileActivation procedure)
                    if (statusID >= 2)
                    {
                        db.Execute(@"
                                UPDATE UserProfilePositions
                                SET     StatusID = @2,
                                        UpdatedDate = getdate()
                                WHERE UserID = @0 AND PositionID = @1
                                    AND LanguageID = @3
                                    AND CountryID = @4
                            ", userID, jobTitleID, statusID,
                            LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                    }

                    return false;
                }
            }
        }
    }
}
