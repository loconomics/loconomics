using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Manages the user data around service attributes, with API for editions, using mainly IDs.
    /// </summary>
    public class UserJobTitleServiceAttributes
    {
        #region Fields
        public int userID;
        public int jobTitleID;
        public Dictionary<int, List<int>> serviceAttributes;
        /// <summary>
        /// Only for editions: list of new service attribute names indexed
        /// by categoryID, proposed by the user to attach to its account 
        /// and being validated by Loconomics Stuff.
        /// It's internal because the external API will never show that attributes
        /// but will show them as normal serviceAttributes using its server generated ID.
        /// </summary>
        internal Dictionary<int, List<string>> proposedServiceAttributes;
        public int experienceLevelID;
        public int languageID;
        public int countryID;
        #endregion

        #region Instances
        public UserJobTitleServiceAttributes() { }
        #endregion

        #region Fetch
        public static UserJobTitleServiceAttributes Get(int userID, int jobTitleID, int languageID, int countryID)
        {
            var data = new UserJobTitleServiceAttributes
            {
                userID = userID,
                jobTitleID = jobTitleID,
                languageID = languageID,
                countryID = countryID
            };
            data.serviceAttributes = LcRest.ServiceAttribute.GetGroupedUserJobTitleAttributeIDs(jobTitleID, userID, languageID, countryID);
            data.experienceLevelID = GetExperienceLevelID(userID, jobTitleID, languageID, countryID);

            return data;
        }

        public static int GetExperienceLevelID(int userID, int jobTitleID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return (int)((int?)db.QueryValue(@"
                    SELECT  UL.experienceLevelID
                    FROM    ServiceAttributeExperienceLevel As UL
                    WHERE   UL.UserID = @0 AND UL.PositionID = @1 AND UL.LanguageID = @2 AND UL.CountryID = @3
                ", userID, jobTitleID, languageID, countryID) ?? 0);
            }
        }
        #endregion

        #region Updates
        #region SQLs attributes
        const string sqlRegisterNewAttribute = @"
            -- Create attribute
            DECLARE @attID int
            SELECT @attID = (max(serviceattributeid) + 1) from serviceattribute
            INSERT INTO [serviceattribute]
                ([ServiceAttributeID]
                ,[LanguageID]
                ,[CountryID]
                ,[SourceID]
                ,[Name]
                ,[ServiceAttributeDescription]
                ,[CreateDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
                ,[DisplayRank]
                ,[PositionReference]
                ,[EnteredByUserID]
                ,[Approved])
            VALUES
                (@attID
                ,@0 --<LanguageID, int,>
                ,@1 --<CountryID, int,>
                ,@2 --<SourceID, int,>
                ,@3 --<Name, varchar(100),>
                ,@4 --<ServiceAttributeDescription, varchar(2000),>
                ,getdate() --<CreateDate, datetime,>
                ,getdate() --<UpdatedDate, datetime,>
                ,'sys' --<ModifiedBy, varchar(45),>
                ,1 --<Active, bit,>
                ,1 --<DisplayRank, int,>
                ,@5 --<PositionReference, int,>
                ,@6 --<EnteredByUserID, int,>
                ,@7 --<Approved, bit,>
            )

            -- Link attribute with category and position
            INSERT INTO [servicecategorypositionattribute]
                ([PositionID]
                ,[ServiceAttributeCategoryID]
                ,[ServiceAttributeID]
                ,[LanguageID]
                ,[CountryID]
                ,[CreateDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
                ,[EnteredByUserID]
                ,[Approved])
            VALUES
                (@5
                ,@8
                ,@attID
                ,@0
                ,@1
                ,getdate()
                ,getdate()
                ,'sys'
                ,1
                ,@6
                ,@7
            )

            -- Return ID
            SELECT @attID ServiceAttributeID
        ";
        /*const string sqlSetAttribute = @"
            BEGIN TRAN
                UPDATE  userprofileserviceattributes WITH (serializable)
                SET     Active = 1,
                        UpdatedDate = getdate(),
                        ModifiedBy = 'sys'
                WHERE   UserId = @0 AND PositionID = @1
                            AND ServiceAttributeCategoryID = @2
                            AND ServiceAttributeID = @3
                            AND LanguageID = @4 AND CountryID = @5

                IF @@rowcount = 0
                BEGIN
                    INSERT INTO userprofileserviceattributes (UserID,
                        PositionID, ServiceAttributeCategoryID, ServiceAttributeID, LanguageID, CountryID, CreateDate, UpdatedDate, 
                        ModifiedBy, Active)
                    VALUES (@0, @1, @2, @3, @4, @5, getdate(), getdate(), 'sys', 1)
                END
            COMMIT TRAN
        ";*/
        const string sqlInsertAttribute = @"
            INSERT INTO userprofileserviceattributes (UserID,
                PositionID, ServiceAttributeCategoryID, ServiceAttributeID, LanguageID, CountryID, CreateDate, UpdatedDate, 
                ModifiedBy, Active)
            VALUES (@0, @1, @2, @3, @4, @5, getdate(), getdate(), 'sys', 1)
        ";
        /*const string sqlDelAttribute = @"
            DELETE FROM userprofileserviceattributes
            WHERE       UserID = @0 AND PositionID = @1
                            AND ServiceAttributeCategoryID = @2
                            AND ServiceAttributeID = @3
                            AND LanguageID = @4 AND CountryID = @5
        ";*/
        const string sqlDelAllAttributes = @"
            DELETE FROM userprofileserviceattributes
            WHERE       UserID = @0 AND PositionID = @1
                            AND LanguageID = @2 AND CountryID = @3
        ";
        #endregion

        #region SQLs Pseudo service attributes
        /*const string sqlSetLangLevel = @"
        BEGIN TRAN
            UPDATE  ServiceAttributeLanguageLevel WITH (serializable)
            SET     LanguageLevelID = @5,
                    UpdatedDate = getdate(),
                    ModifiedBy = 'sys'
            WHERE   UserId = @0 AND PositionID = @1
                        AND ServiceAttributeID = @2
                        AND LanguageID = @3 AND CountryID = @4

            IF @@rowcount = 0
            BEGIN
                INSERT INTO ServiceAttributeLanguageLevel (UserID,
                    PositionID, ServiceAttributeID, LanguageID, CountryID, LanguageLevelID,
                    CreatedDate, UpdatedDate, ModifiedBy)
                VALUES (@0, @1, @2, @3, @4, @5, getdate(), getdate(), 'sys')
            END
        COMMIT TRAN
        ";
        const string sqlDelLangLevel = @"
        DELETE FROM ServiceAttributeLanguageLevel
        WHERE   UserId = @0 AND PositionID = @1
                        AND ServiceAttributeID = @2
                        AND LanguageID = @3 AND CountryID = @4
        ";*/
        const string sqlSetExpLevel = @"
        BEGIN TRAN
            UPDATE  ServiceAttributeExperienceLevel WITH (serializable)
            SET     ExperienceLevelID = @4,
                    UpdatedDate = getdate(),
                    ModifiedBy = 'sys'
            WHERE   UserId = @0 AND PositionID = @1
                        AND LanguageID = @2 AND CountryID = @3

            IF @@rowcount = 0
            BEGIN
                INSERT INTO ServiceAttributeExperienceLevel (UserID,
                    PositionID, LanguageID, CountryID, ExperienceLevelID,
                    CreatedDate, UpdatedDate, ModifiedBy)
                VALUES (@0, @1, @2, @3, @4, getdate(), getdate(), 'sys')
            END
        COMMIT TRAN
        ";
        const string sqlDelExpLevel = @"
        DELETE FROM ServiceAttributeExperienceLevel
        WHERE   UserId = @0 AND PositionID = @1
                        AND LanguageID = @2 AND CountryID = @3
        ";
        #endregion

        private const string requiredAttCatError = "\"{0}\" requires at least one selection";
        static public void Set(UserJobTitleServiceAttributes serviceAttributes)
        {
            // Validate
            // Get all attributes that applies (we avoid save selected attributes that does not apply
            // to the job title).
            var validAttributes = ServiceAttribute.GetGroupedJobTitleAttributes(serviceAttributes.jobTitleID, serviceAttributes.languageID, serviceAttributes.countryID);
            var indexedValidAttributes = new Dictionary<int, HashSet<int>>();

            // Check that there is almost one value for required categories, or show error
            foreach (var attCat in validAttributes)
            {
                if (attCat.requiredInput && (
                    !serviceAttributes.serviceAttributes.ContainsKey(attCat.serviceAttributeCategoryID) ||
                    serviceAttributes.serviceAttributes[attCat.serviceAttributeCategoryID].Count == 0))
                {
                    throw new ValidationException(String.Format(requiredAttCatError, attCat.name), attCat.serviceAttributeCategoryID.ToString(), "serviceAttributes");
                }
                indexedValidAttributes.Add(attCat.serviceAttributeCategoryID, new HashSet<int>(attCat.serviceAttributes.Select(x => x.serviceAttributeID)));
            }

            // Save data
            using (var db = new LcDatabase())
            {
                // Transaction
                db.Execute("BEGIN TRANSACTION");
                
                // First, remove all current attributes, replaced by the new set
                db.Execute(sqlDelAllAttributes, serviceAttributes.userID, serviceAttributes.jobTitleID, serviceAttributes.languageID, serviceAttributes.countryID);

                // Add new ones, if they are valid
                foreach (var cat in serviceAttributes.serviceAttributes)
                {
                    if (indexedValidAttributes.ContainsKey(cat.Key))
                    {
                        foreach (var att in cat.Value)
                        {
                            if (indexedValidAttributes[cat.Key].Contains(att))
                            {
                                // Add to database
                                db.Execute(sqlInsertAttribute, serviceAttributes.userID, serviceAttributes.jobTitleID, cat.Key, att, serviceAttributes.languageID, serviceAttributes.countryID);
                            }
                            // else JUST DISCARD SILENTLY INVALID ATTID
                        }
                    }
                    // else JUST DISCARD SILENTLY INVALID CATID
                }

                // Register user proposed new attributes:
                foreach (var cat in serviceAttributes.proposedServiceAttributes)
                {
                    // Category must exists, even if the attribute is new.
                    if (indexedValidAttributes.ContainsKey(cat.Key))
                    {
                        foreach (var attName in cat.Value)
                        {
                            if (String.IsNullOrWhiteSpace(attName)) {
                                continue;
                            }
                            // Register new attribute
                            int serviceAttributeID = db.QueryValue(sqlRegisterNewAttribute,
                                serviceAttributes.languageID,
                                serviceAttributes.countryID,
                                null, // sourceID
                                attName.Capitalize(),
                                null, // description
                                serviceAttributes.jobTitleID,
                                serviceAttributes.userID,
                                false, // Initially not approved
                                cat.Key // categoryID
                            );
                            // Set for the user:
                            db.Execute(sqlInsertAttribute, serviceAttributes.userID, serviceAttributes.jobTitleID,
                                cat.Key, serviceAttributeID, serviceAttributes.languageID, serviceAttributes.countryID);
                        }
                    }
                }

                // Since ExperienceLevel is not a service category anymore else an independent table, we need
                // specific code to save its data.
                if (serviceAttributes.experienceLevelID > 0)
                {
                    db.Execute(sqlSetExpLevel, serviceAttributes.userID, serviceAttributes.jobTitleID, serviceAttributes.languageID, serviceAttributes.countryID, serviceAttributes.experienceLevelID);
                }
                else
                {
                    db.Execute(sqlDelExpLevel, serviceAttributes.userID, serviceAttributes.jobTitleID, serviceAttributes.languageID, serviceAttributes.countryID);
                }

                // Check alert
                db.Execute("EXEC TestAlertPositionServices @0, @1", serviceAttributes.userID, serviceAttributes.jobTitleID);

                // Ends transaction (very important for the delete-insert attributes part, but it guarantees that all or nothing):
                db.Execute("COMMIT TRANSACTION");
            }
        }
        #endregion
    }
}