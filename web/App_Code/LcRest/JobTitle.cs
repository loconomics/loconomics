using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// JobTitle
    /// </summary>
    public class JobTitle
    {
        /// <summary>
        /// Allows users to create a new job title with basic and default information. #650
        /// </summary>
        /// <param name="singularName"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static int CreateByName(string singularName, int languageID, int countryID, int enteredByUserID)
        {
            using (var db = new LcDatabase())
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
                                RETURN
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
                    "[[[I specialize in]]]",
                    enteredByUserID);
            }
        }
    }
}