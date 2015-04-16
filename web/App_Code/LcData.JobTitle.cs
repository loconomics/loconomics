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
                         AND (Approved = 1 Or Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
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

        /// <summary>
        /// Search job titles by a partial text by singular or plural name, or alias,
        /// and the given locale.
        /// Just returns the ID as value and singular name as label, suitable for autocomplete components.
        /// </summary>
        /// <param name="searchText"></param>
        /// <param name="locale"></param>
        /// <returns></returns>
        public static IEnumerable<AutocompleteResult> SearchJobTitles(string searchText, LcRestLocale locale)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var sql = "EXEC SearchPositions @0, @1, @2";
                return db.Query(sql, "%" + searchText + "%", locale.languageID, locale.countryID)
                    .Select(job => new AutocompleteResult {
                        value = job.PositionID,
                        label = job.PositionSingular
                    });
            }
        }

        #region User Job Title relationship
        public static dynamic GetUserJobTitles(int userID, int jobTitleID = -1)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT
                        u.UserID As userID,
                        u.PositionID As jobTitleID,
                        u.PositionIntro As intro,
                        u.StatusID As statusID,
                        u.CancellationPolicyID As cancellationPolicyID,
                        u.InstantBooking As instantBooking,
                        u.CreateDate As createdDate,
                        u.UpdatedDate As updatedDate
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

        public static void InsertUserJobTitle(
            int userID,
            int jobTitleID,
            int cancellationPolicyID,
            string intro,
            bool instantBooking,
            int languageID,
            int countryID
            )
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Create position for the provider
                var results = db.QuerySingle("EXEC dbo.InsertUserProfilePositions @0, @1, @2, @3, @4, @5, @6",
                    userID,
                    jobTitleID,
                    languageID,
                    countryID,
                    cancellationPolicyID,
                    intro,
                    instantBooking);
                if (results.Result != "Success") {
                    throw new Exception("We're sorry, there was an error creating your job title: " + results.Result);
                }
            }
        }

        public static bool UpdateUserJobTitle(
            int userID,
            int jobTitleID,
            int policyID,
            string intro,
            bool instantBooking,
            int languageID,
            int countryID)
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
                    languageID,
                    countryID,
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

        #region Autogenerate Job Title
        /// <summary>
        /// Allows users to create a new job title with basic and default information. #650
        /// </summary>
        /// <param name="singularName"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static int CreateJobTitleByName(string singularName, int languageID, int countryID, int enteredByUserID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return (int)db.QueryValue(@"
                    DECLARE @PositionID int

                    -- Check that the job title does not exists for the exact name
                    -- With error if dissaproved
                    DECLARE @Approved bit
                    SELECT TOP 1 @PositionID = PositionID, @Approved = Approved
                    FROM positions
                    WHERE PositionSingular like @2
                    
                    IF @PositionID is not null
                    BEGIN
                        IF @Approved = 0 BEGIN
                            -- The Job Title is not allowed
                            SELECT -1 As ErrorNumber
                            RETURN
                        END
                        ELSE
                            -- Exists and valid, return that ID:
                            SELECT @PositionID
                    END
                    
                    -- Create Position with new ID

                    BEGIN TRANSACTION

                    SELECT TOP 1 @PositionID = PositionID + 1 FROM positions WITH (TABLOCKX) ORDER BY PositionID DESC

                    INSERT INTO positions
                       ([PositionID]
                       ,[LanguageID]
                       ,[CountryID]
                       ,[PositionSingular]
                       ,[PositionPlural]
                       ,[Aliases]
                       ,[PositionDescription]
                       ,[CreatedDate]
                       ,[UpdatedDate]
                       ,[ModifiedBy]
                       ,[GovID]
                       ,[GovPosition]
                       ,[GovPositionDescription]
                       ,[Active]
                       ,[DisplayRank]
                       ,[PositionSearchDescription]
                       ,[AttributesComplete]
                       ,[StarRatingsComplete]
                       ,[PricingTypeComplete]
                       ,[EnteredByUserID]
                       ,[Approved])
                    VALUES
                       (@PositionID
                       ,@0
                       ,@1
                       ,@2
                       ,@2
                       ,''
                       ,''
                       ,getdate()
                       ,getdate()
                       ,'ur'
                       ,null
                       ,null
                       ,null
                       ,1
                       ,null
                       ,''
                       ,0
                       ,0
                       ,0
                       ,@4
                        -- pre-approval: not approved, not disallowed, just null
                       ,null)

                    -- Add attributes category for the new position
                    DECLARE @ServiceAttributeCategoryID int
                    SELECT TOP 1 @ServiceAttributeCategoryID = ServiceAttributeCategoryID + 1 FROM ServiceAttributeCategory WITH (TABLOCKX) ORDER BY ServiceAttributeCategoryID DESC

                    INSERT INTO [serviceattributecategory]
                               ([ServiceAttributeCategoryID]
                               ,[LanguageID]
                               ,[CountryID]
                               ,[ServiceAttributeCategory]
                               ,[CreateDate]
                               ,[UpdatedDate]
                               ,[ModifiedBy]
                               ,[Active]
                               ,[SourceID]
                               ,[PricingOptionCategory]
                               ,[ServiceAttributeCategoryDescription]
                               ,[RequiredInput]
                               ,[SideBarCategory]
                               ,[EligibleForPackages]
                               ,[DisplayRank]
                               ,[PositionReference]
                               ,[BookingPathSelection])
                         VALUES
                               (@ServiceAttributeCategoryID
                               ,@0
                               ,@1
                               ,@3
                               ,getdate()
                               ,getdate()
                               ,'ur'
                               ,1
                               ,null
                               ,null
                               ,''
                               ,0
                               ,0
                               ,0
                               ,1
                               ,@PositionID
                               ,0)

                    -- Add basic pricing types for the new position
                    -- Consultation:5
                    INSERT INTO [PositionPricingType]
                           ([PositionID]
                           ,[PricingTypeID]
                           ,[ClientTypeID]
                           ,[LanguageID]
                           ,[CountryID]
                           ,[CreatedDate]
                           ,[UpdatedDate]
                           ,[ModifiedBy]
                           ,[Active])
                     VALUES
                            (@PositionID
                            ,5 -- Consultation
                            ,1 -- Client Type fixed since is not used right now
                            ,@0 -- language
                            ,@1 -- country
                            ,getdate()
                            ,getdate()
                            ,'sys'
                            ,1
                            )
                    -- Service:6
                    INSERT INTO [PositionPricingType]
                           ([PositionID]
                           ,[PricingTypeID]
                           ,[ClientTypeID]
                           ,[LanguageID]
                           ,[CountryID]
                           ,[CreatedDate]
                           ,[UpdatedDate]
                           ,[ModifiedBy]
                           ,[Active])
                     VALUES
                            (@PositionID
                            ,6 -- Service
                            ,1 -- Client Type fixed since is not used right now
                            ,@0 -- language
                            ,@1 -- country
                            ,getdate()
                            ,getdate()
                            ,'ur'
                            ,1
                            )

                    -- DONE!
                    COMMIT

                    SELECT @PositionID As PositionID
                ", languageID, countryID, singularName,
                 // L10N
                 "I specialize in",
                 enteredByUserID);
            }
        }
        #endregion
    }
}