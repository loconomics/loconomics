using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcData
/// </summary>
public static partial class LcData
{
	public static class JobTitle
    {
        public static dynamic GetJobTitle(int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var job = db.QuerySingle(@"
                    SELECT
                        PositionID As jobTitleID,
                        PositionSingular As singularName,
                        PositionPlural As pluralName,
                        Aliases As aliases,
                        PositionDescription As description,
                        PositionSearchDescription As searchDescription,
                        CreatedDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        positions
                    WHERE
                        PositionID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                if (job == null)
                {
                    return null;
                }
                else
                {
                    var pricings = db.Query(@"
                        SELECT
                            PricingTypeID As pricingTypeID,
                            ClientTypeID As clientTypeID,
                            CreatedDate As createdDate,
                            UpdatedDate As updatedDate
                        FROM
                            positionpricingtype
                        WHERE
                            PositionID = @0
                             AND LanguageID = @1
                             AND CountryID = @2
                             AND Active = 1
                    ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                    // Return an object that includes the collection of pricings
                    return new {
                        jobTitleID = job.jobTitleID,
                        singularName = job.singularName,
                        pluralName = job.pluralName,
                        aliases = job.aliases,
                        description = job.description,
                        searchDescription = job.searchDescription,
                        createdDate = job.createdDate,
                        updatedDate = job.updatedDate,
                        pricingTypes = pricings
                    };
                }
            }
        }

        #region User Job Title relationship
        public static dynamic GetUserJobTitles(int userID, int jobTitleID = -1)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT
                        UserID As userID,
                        PositionID As jobTitleID,
                        PositionIntro As intro,
                        StatusID As statusID,
                        CancellationPolicyID As cancellationPolicyID,
                        InstantBooking As instantBooking,
                        CreateDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        userprofilepositions
                    WHERE
                        UserID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                         AND StatusID > 0
                         AND (@3 = -1 OR @3 = PositionID)
                ", userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), jobTitleID);
            }
        }

        public static bool SoftDeleteUserJobTitle(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco")) {
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

        public static bool UpdateUserJobTitle(
            int userID,
            int jobTitleID,
            int policyID,
            string intro,
            bool instantBooking)
        {
            var sqlUpdate = @"
                UPDATE  UserProfilePositions
                SET     PositionIntro = @4,
                        CancellationPolicyID = @5,
                        InstantBooking = @6,
                        UpdatedDate = getdate()
                WHERE   UserID = @0 AND PositionID = @1
                    AND LanguageID = @2
                    AND CountryID = @3
            ";

            using (var db = Database.Open("sqlloco")) {
                var affected = db.Execute(sqlUpdate,
                    userID,
                    jobTitleID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(),
                    intro,
                    policyID,
                    instantBooking
                );

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
        public static bool DeactivateUserJobTitle(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco")) {
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
        public static bool ReactivateUserJobTitle(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco")) {
                // Check the current StatusID
                var statusID = LcData.UserInfo.GetUserPositionStatus(userID, jobTitleID);

                // If status is -1, the records does not exists
                if (statusID == -1)
                {
                    return false;
                }

                // If status is of type 3 'private profile, manual activation'..
                if (statusID == 3) {
                    // ..modify the profile StatusID from 3 to 2 'private profile, automatic activation'
                    // (because the TestProfileActivation only works for StatusID:2 to avoid unexpected changes)
                    db.Execute(@"
                        UPDATE  UserProfilePositions
                        SET     StatusID = 2,
                                UpdatedDate = getdate()
                        WHERE UserID = @0 AND PositionID = @1
                         AND LanguageID = @2
                         AND CountryID = @3
                    ",userID, jobTitleID,
                     LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                }
                
                // It executes the profile activation that checks that all required alerts must be off to activate:
                db.Execute("EXEC TestProfileActivation @0, @1", userID, jobTitleID);
                
                // Check the updated StatusID
                var newStatusID = LcData.UserInfo.GetUserPositionStatus(userID, jobTitleID);
                // If the status is 1 'public profile', success!
                if (newStatusID == 1) {
                    return true;
                } else {
                    // It is Not activated still, required alerts are pending, back to the original
                    // StatusID if was not 2 originally (it was updated in the middle of the process to run
                    // the TestProfileActivation procedure)
                    if (statusID >= 2) {
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
        #endregion
    }
}