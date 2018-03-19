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
        public int userListingID { get; set; }

        public int userID { get; set; }
        public int jobTitleID { get; set; }
        public string title { get; set; }

        public string intro { get; set; }
        public ProfileStatus statusID;
        
        public int cancellationPolicyID { get; set; }
        public bool instantBooking { get; set; }
        public bool bookMeButtonReady;
        public bool collectPaymentAtBookMeButton;

        [Obsolete("Preferred usage of title property. Is not in use at the current " +
            "App code, will be removed once old App instances are updated.")]
        public string jobTitleSingularName { get; set; }
        [Obsolete("Preferred usage of title property. Is not in use at the current " +
            "App code, will be removed once old App instances are updated.")]
        public string jobTitlePluralName { get; set; }

        public List<Alert> alerts { get; set; }

        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        public bool isActive {
            get
            {
                return this.statusID == ProfileStatus.On;
            }
        }

        /// <summary>
        /// New record with default values
        /// </summary>
        public UserJobTitle()
        {
            cancellationPolicyID = CancellationPolicy.DefaultCancellationPolicyID;
            alerts = new List<Alert>();
            instantBooking = false;
            collectPaymentAtBookMeButton = false;
        }

        public static UserJobTitle FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserJobTitle
            {
                userListingID = record.userListingID,

                userID = record.userID,
                jobTitleID = record.jobTitleID,
                title = record.title,

                intro = record.intro,
                statusID = (ProfileStatus)record.statusID,
                cancellationPolicyID = record.cancellationPolicyID,
                instantBooking = record.instantBooking,
                bookMeButtonReady = record.bookMeButtonReady,
                collectPaymentAtBookMeButton = record.collectPaymentAtBookMeButton,

                jobTitleSingularName = record.title,
                jobTitlePluralName = record.title,

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

        /// <summary>
        /// Value of the job title ID assigned when a user adds a new name as job title.
        /// Previously, a real job title was created ("user generated"), now this one is
        /// used for that cases, preventing from more new ones being added but using the
        /// user given name as the listing title.
        /// </summary>
        public const int UserGeneratedJobTitleID = -2;

        #region Fetch
        #region SQL
        /// <summary>
        /// Get list by user or explicit job title if a value different than -1 is given
        /// </summary>
        private const string sqlSelect = @"
            SELECT
                u.UserListingID as userListingID,
                u.UserID As userID,
                u.PositionID As jobTitleID,
                u.Title as title,
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
                    -- Double check for approved positions
                    AND (positions.Active = 1 OR positions.positionID = -2)
                    AND (positions.Approved = 1 Or positions.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        ";
        
        private const string sqlAndJobTitleID = " AND (@3 = -1 OR @3 = u.PositionID) "; 
        private const string sqlAndActiveOrInactiveProfiles = " AND u.StatusID > 0 ";
        private const string sqlAndActiveProfiles = " AND u.StatusID = 1 ";
        private const string sqlAndBookMeButtonReady = " AND bookMeButtonReady = 1";

        private const string sqlGetActiveItem = sqlSelect + sqlAndActiveProfiles + sqlAndJobTitleID;
        private const string sqlGetActiveOrInactiveItem = sqlSelect + sqlAndActiveOrInactiveProfiles + sqlAndJobTitleID;
        #endregion

        /// <summary>
        ///  Return a user job title in the current locale, even if the user job title is not
        ///  active.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        public static UserJobTitle GetItem(int userID, int jobTitleID)
        {
            return GetItem(userID, LcData.GetCurrentCountryID(), LcData.GetCurrentLanguageID(), jobTitleID, true, false);
        }

        /// <summary>
        /// Return a user job title based on userID and jobTitleID
        /// </summary>
        /// <param name="userID">userID of the professional</param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <param name="jobTitleID">jobTitleID of the user job title</param>
        /// <param name="includeDeactivatedProfile">if true, will include all non-deleted user job titles. If false, will only include those which are publicly active</param>
        /// <param name="bookMeButtonRequired"></param>
        /// <returns></returns>
        public static UserJobTitle GetItem(int userID, int languageID, int countryID, int jobTitleID = -1, bool includeDeactivatedProfile = false, bool bookMeButtonRequired = false)
        {
            var sql = includeDeactivatedProfile ? sqlGetActiveOrInactiveItem : sqlGetActiveItem;

            if (bookMeButtonRequired)
            {
                sql += sqlAndBookMeButtonReady;
            }

            using (var db = new LcDatabase())
            {
                var userJobTitle = FromDB(db.QuerySingle(sql, userID, languageID, countryID, jobTitleID));
                
                if(userJobTitle != null)
                {
                    userJobTitle.alerts = Alert.GetActive(userID, jobTitleID).ToList();
                }                

                return userJobTitle;
            }
        }

        /// <summary>
        /// Checks whether the user has the job title assigned already (publicly active or not).
        /// Does not include blocked records (Active=0).
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static Boolean HasItem(int userID, int jobTitleID, int? languageID = null, int? countryID = null)
        {
            languageID = languageID ?? LcData.GetCurrentLanguageID();
            countryID = countryID ?? LcData.GetCurrentCountryID();
            using (var db = new LcDatabase())
            {
                return db.QuerySingle(sqlGetActiveOrInactiveItem, userID, languageID, countryID, jobTitleID) != null;
            }
        }

        private static IEnumerable<UserJobTitle> GetListByUser(string sql, int userID)
        {
            using (var db = new LcDatabase())
            {
                var userJobTitles = db.Query(sql, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID())
                                    .Select(FromDB);

                return BindAlerts(userJobTitles, Alert.IndexByPosition(Alert.GetActive(userID)));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static IEnumerable<UserJobTitle> GetAllByUser(int userID)
        {
            return GetListByUser(sqlSelect + sqlAndActiveOrInactiveProfiles, userID);
        }

        /// <summary>
        /// Get all publicly active user job titles for a given user
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static IEnumerable<UserJobTitle> GetActiveByUser(int userID)
        {
            return GetListByUser(sqlSelect + sqlAndActiveProfiles, userID);
        }
        #endregion

        #region Validations
        /// <summary>
        /// Checks that the user has choosen allowed values for Booking Policies, and update
        /// current instance properly.
        /// For non-members, policies are restricted to default values.
        /// </summary>
        private void ValidateAndFixBookingPolicies()
        {
            var isMember = UserProfile.Get(userID).owner.status == LcEnum.OwnerStatus.active;
            if (!isMember)
            {
                // Enforce default policies
                instantBooking = false;
                cancellationPolicyID = CancellationPolicy.DefaultCancellationPolicyID;
            }
        }
        #endregion

        public static void Create(UserJobTitle userJobTitle)
        {
            userJobTitle.ValidateAndFixBookingPolicies();
            using (var db = new LcDatabase())
            {
                var results = db.QuerySingle("EXEC dbo.InsertUserProfilePositions @0, @1, @2, @3, @4, @5, @6, @7, @8",
                    userJobTitle.userID,
                    userJobTitle.jobTitleID,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID(),
                    userJobTitle.cancellationPolicyID,
                    userJobTitle.intro,
                    userJobTitle.instantBooking,
                    userJobTitle.collectPaymentAtBookMeButton,
                    userJobTitle.title);

                if (results.Result != "Success")
                {
                    // TODO: Add better error checks (codes) at new back-end when porting this rather than local text errors
                    var message = (string)results.Result;
                    if (message.Contains("Cannot insert duplicate key"))
                    {
                        if (userJobTitle.jobTitleID == UserGeneratedJobTitleID)
                        {
                            throw new ConstraintException("We're sorry, but we currently only support one custom job title (stay tunned, this will change soon!).");
                        }
                        else
                        {
                            throw new ConstraintException("You already have a listing with that job title.");
                        }
                    }
                    else
                    {
                        throw new Exception("We're sorry, there was an error creating your listing: " + message);
                    }
                }
            }
        }

        public static bool Update(UserJobTitle userJobTitle)
        {
            userJobTitle.ValidateAndFixBookingPolicies();
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

        public static bool MeetsOwnershipRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID int = @0
            DECLARE @hasListing bit = 0

            -- Firts: ensure all account and listing requirements are tested
            -- before we check listing status
            EXEC TestAllUserAlerts @UserID

            -- Check Listing
            IF EXISTS (
				SELECT *
				FROM userprofilepositions
				WHERE UserID = @UserID
					AND Active = 1
					AND StatusID = 1 -- active and publicly visible
			)
			BEGIN
				SET @hasListing = 1
			END

            SELECT @hasListing
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }
    }
}
