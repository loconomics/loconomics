-- Read (to use as backup) and delete data for non en-US values (other than languageID=1, countryID=1)
PRINT '[addrestype]'
SELECT * FROM addresstype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM addresstype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[alert]'
SELECT * FROM alert WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM alert WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[alerttype]'
SELECT * FROM alerttype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM alerttype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[backgroundcheck]'
SELECT * FROM [backgroundcheck] WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM [backgroundcheck] WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[booking]'
SELECT * FROM booking WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM booking WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[CalendarAvailabilityType]'
SELECT * FROM CalendarAvailabilityType WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM CalendarAvailabilityType WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[cancellationpolicy]'
SELECT * FROM cancellationpolicy WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM cancellationpolicy WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[clienttype]'
SELECT * FROM clienttype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM clienttype WHERE LanguageID <> 1 OR CountryID <> 1
-- Special case: [country]
PRINT '[country] Keeps all countries, just remove non EN language records'
SELECT * FROM country WHERE LanguageID <> 1
DELETE FROM country WHERE LanguageID <> 1
PRINT '[ExperienceLevel]'
SELECT * FROM ExperienceLevel WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM ExperienceLevel WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[FieldOfStudy]'
SELECT * FROM FieldOfStudy WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM FieldOfStudy WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[Gender]'
SELECT * FROM Gender WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM Gender WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[JobTitlePlatform]'
SELECT * FROM JobTitlePlatform WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM JobTitlePlatform WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[JobTitleSolution]'
SELECT * FROM JobTitleSolution WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM JobTitleSolution WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[languagelevel]'
SELECT * FROM languagelevel WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM languagelevel WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[messagetype]'
SELECT * FROM messagetype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM messagetype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[Platform]'
SELECT * FROM [Platform] WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM [Platform] WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[positionpricingtype]'
SELECT * FROM positionpricingtype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM positionpricingtype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[positionratings]'
SELECT * FROM positionratings WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM positionratings WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[positions]'
SELECT * FROM positions WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM positions WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[postingTemplate]'
SELECT * FROM postingTemplate WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM postingTemplate WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[PricingGroups]'
SELECT * FROM PricingGroups WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM PricingGroups WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[pricingtype]'
SELECT * FROM pricingtype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM pricingtype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[PricingVariableDefinition]'
SELECT * FROM PricingVariableDefinition WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM PricingVariableDefinition WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[providerpackage]'
SELECT * FROM providerpackage WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM providerpackage WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[providerpaymentpreferencetype]'
SELECT * FROM providerpaymentpreferencetype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM providerpaymentpreferencetype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[question]'
SELECT * FROM question WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM question WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[SearchCategory]'
SELECT * FROM SearchCategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM SearchCategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[SearchSubCategory]'
SELECT * FROM SearchSubCategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM SearchSubCategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[SearchSubCategorySolution]'
SELECT * FROM SearchSubCategorySolution WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM SearchSubCategorySolution WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[serviceattribute]'
SELECT * FROM serviceattribute WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM serviceattribute WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[serviceattributecategory]'
SELECT * FROM serviceattributecategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM serviceattributecategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[ServiceAttributeExperienceLevel]'
SELECT * FROM ServiceAttributeExperienceLevel WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM ServiceAttributeExperienceLevel WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[ServiceAttributeLanguageLevel]'
SELECT * FROM ServiceAttributeLanguageLevel WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM ServiceAttributeLanguageLevel WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[servicecategory]'
SELECT * FROM servicecategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM servicecategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[servicecategoryposition]'
SELECT * FROM servicecategoryposition WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM servicecategoryposition WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[servicecategorypositionattribute]'
SELECT * FROM servicecategorypositionattribute WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM servicecategorypositionattribute WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[servicesubcategory]'
SELECT * FROM servicesubcategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM servicesubcategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[Solution]'
SELECT * FROM Solution WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM Solution WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[Specialization]'
SELECT * FROM Specialization WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM Specialization WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[taxentitytype]'
SELECT * FROM taxentitytype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM taxentitytype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[tintype]'
SELECT * FROM tintype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM tintype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[transporttype]'
SELECT * FROM transporttype WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM transporttype WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[UserBadge]'
SELECT * FROM UserBadge WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM UserBadge WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[UserListingSpecialization]'
SELECT * FROM UserListingSpecialization WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM UserListingSpecialization WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[UserPosting]'
SELECT * FROM UserPosting WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM UserPosting WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[userprofilepositions]'
SELECT * FROM userprofilepositions WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM userprofilepositions WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[userprofileserviceattributes]'
SELECT * FROM userprofileserviceattributes WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM userprofileserviceattributes WHERE LanguageID <> 1 OR CountryID <> 1
-- Special case [users] require other update of data after inserting the new column
PRINT '[UserSolution]'
SELECT * FROM UserSolution WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM UserSolution WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[verification]'
SELECT * FROM verification WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM verification WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[verificationcategory]'
SELECT * FROM verificationcategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM verificationcategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[verificationstatus]'
SELECT * FROM verificationstatus WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM verificationstatus WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[VOCElement]'
SELECT * FROM VOCElement WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM VOCElement WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[VOCExperienceCategory]'
SELECT * FROM VOCExperienceCategory WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM VOCExperienceCategory WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[VOCFlag]'
SELECT * FROM VOCFlag WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM VOCFlag WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[xJobTitlePricing]'
SELECT * FROM xJobTitlePricing WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM xJobTitlePricing WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[xJobTitleReviewRules]'
SELECT * FROM xJobTitleReviewRules WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM xJobTitleReviewRules WHERE LanguageID <> 1 OR CountryID <> 1
PRINT '[xServiceProfessionalPricing]'
SELECT * FROM xServiceProfessionalPricing WHERE LanguageID <> 1 OR CountryID <> 1
DELETE FROM xServiceProfessionalPricing WHERE LanguageID <> 1 OR CountryID <> 1
-- Special case: Language table, is removed completely, we backup data first
PRINT '[language]'
SELECT * FROM [language]

GO

-- Add new language column with ISO code
PRINT 'Add language columns'
ALTER TABLE [addresstype]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [alert]                                 ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [alerttype]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [backgroundcheck]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [booking]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [CalendarAvailabilityType]              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [cancellationpolicy]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [clienttype]                            ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [country]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [ExperienceLevel]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [FieldOfStudy]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [Gender]                                ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [JobTitlePlatform]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [JobTitleSolution]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [languagelevel]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [messagetype]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [Platform]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [positionpricingtype]                   ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [positionratings]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [positions]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [postingTemplate]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [PricingGroups]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [pricingtype]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [PricingVariableDefinition]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [providerpackage]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [providerpaymentpreferencetype]         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [question]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [SearchCategory]                        ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [SearchSubCategory]                     ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [SearchSubCategorySolution]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [serviceattribute]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [serviceattributecategory]              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [ServiceAttributeExperienceLevel]       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [ServiceAttributeLanguageLevel]         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [servicecategory]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [servicecategoryposition]               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [servicecategorypositionattribute]      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [servicesubcategory]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [Solution]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [Specialization]                        ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [taxentitytype]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [tintype]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [transporttype]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [UserBadge]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [UserListingSpecialization]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [UserPosting]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [userprofilepositions]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [userprofileserviceattributes]          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [UserSolution]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [verification]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [verificationcategory]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [verificationstatus]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [VOCElement]                            ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [VOCExperienceCategory]                 ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [VOCFlag]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [xJobTitlePricing]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [xJobTitleReviewRules]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [xServiceProfessionalPricing]           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL

PRINT 'New users columns'
-- Special case: [users] have different language and keeps one for country but slightly different meaning and type
ALTER TABLE [users] ADD [PreferredLanguage] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
ALTER TABLE [users] ADD [SignupCountryCode] NVARCHAR(2) NULL

GO

-- Transfer/migrate data: new column comes already with default value and other ones are removed already,
-- but there is a special case: [users]
PRINT 'Update users new columns'
UPDATE [users] SET
    [PreferredLanguage] = CASE WHEN LanguageID=2 THEN 'es-US' ELSE 'en-US' END,
    [SignupCountryCode] = (SELECT CountryCodeAlpha2 FROM country WHERE CountryID = [users].PreferredCountryID)

GO

-- Drop old constraints for languageID and countryID
PRINT 'Drop constraints'
PRINT 'TODO'

PRINT 'Replace Primary Keys that had languageID/countryID as members'
PRINT 'TODO'

GO

-- Drop old columns languageID columns
PRINT 'Drop old languageID columns'
ALTER TABLE [addresstype]                           DROP COLUMN [LanguageID]
ALTER TABLE [alert]                                 DROP COLUMN [LanguageID]
ALTER TABLE [alerttype]                             DROP COLUMN [LanguageID]
ALTER TABLE [backgroundcheck]                       DROP COLUMN [LanguageID]
ALTER TABLE [booking]                               DROP COLUMN [LanguageID]
ALTER TABLE [CalendarAvailabilityType]              DROP COLUMN [LanguageID]
ALTER TABLE [cancellationpolicy]                    DROP COLUMN [LanguageID]
ALTER TABLE [clienttype]                            DROP COLUMN [LanguageID]
ALTER TABLE [country]                               DROP COLUMN [LanguageID]
ALTER TABLE [ExperienceLevel]                       DROP COLUMN [LanguageID]
ALTER TABLE [FieldOfStudy]                          DROP COLUMN [LanguageID]
ALTER TABLE [Gender]                                DROP COLUMN [LanguageID]
ALTER TABLE [JobTitlePlatform]                      DROP COLUMN [LanguageID]
ALTER TABLE [JobTitleSolution]                      DROP COLUMN [LanguageID]
ALTER TABLE [languagelevel]                         DROP COLUMN [LanguageID]
ALTER TABLE [messagetype]                           DROP COLUMN [LanguageID]
ALTER TABLE [Platform]                              DROP COLUMN [LanguageID]
ALTER TABLE [positionpricingtype]                   DROP COLUMN [LanguageID]
ALTER TABLE [positionratings]                       DROP COLUMN [LanguageID]
ALTER TABLE [positions]                             DROP COLUMN [LanguageID]
ALTER TABLE [postingTemplate]                       DROP COLUMN [LanguageID]
ALTER TABLE [PricingGroups]                         DROP COLUMN [LanguageID]
ALTER TABLE [pricingtype]                           DROP COLUMN [LanguageID]
ALTER TABLE [PricingVariableDefinition]             DROP COLUMN [LanguageID]
ALTER TABLE [providerpackage]                       DROP COLUMN [LanguageID]
ALTER TABLE [providerpaymentpreferencetype]         DROP COLUMN [LanguageID]
ALTER TABLE [question]                              DROP COLUMN [LanguageID]
ALTER TABLE [SearchCategory]                        DROP COLUMN [LanguageID]
ALTER TABLE [SearchSubCategory]                     DROP COLUMN [LanguageID]
ALTER TABLE [SearchSubCategorySolution]             DROP COLUMN [LanguageID]
ALTER TABLE [serviceattribute]                      DROP COLUMN [LanguageID]
ALTER TABLE [serviceattributecategory]              DROP COLUMN [LanguageID]
ALTER TABLE [ServiceAttributeExperienceLevel]       DROP COLUMN [LanguageID]
ALTER TABLE [ServiceAttributeLanguageLevel]         DROP COLUMN [LanguageID]
ALTER TABLE [servicecategory]                       DROP COLUMN [LanguageID]
ALTER TABLE [servicecategoryposition]               DROP COLUMN [LanguageID]
ALTER TABLE [servicecategorypositionattribute]      DROP COLUMN [LanguageID]
ALTER TABLE [servicesubcategory]                    DROP COLUMN [LanguageID]
ALTER TABLE [Solution]                              DROP COLUMN [LanguageID]
ALTER TABLE [Specialization]                        DROP COLUMN [LanguageID]
ALTER TABLE [taxentitytype]                         DROP COLUMN [LanguageID]
ALTER TABLE [tintype]                               DROP COLUMN [LanguageID]
ALTER TABLE [transporttype]                         DROP COLUMN [LanguageID]
ALTER TABLE [UserBadge]                             DROP COLUMN [LanguageID]
ALTER TABLE [UserListingSpecialization]             DROP COLUMN [LanguageID]
ALTER TABLE [UserPosting]                           DROP COLUMN [LanguageID]
ALTER TABLE [userprofilepositions]                  DROP COLUMN [LanguageID]
ALTER TABLE [userprofileserviceattributes]          DROP COLUMN [LanguageID]
ALTER TABLE [UserSolution]                          DROP COLUMN [LanguageID]
ALTER TABLE [verification]                          DROP COLUMN [LanguageID]
ALTER TABLE [verificationcategory]                  DROP COLUMN [LanguageID]
ALTER TABLE [verificationstatus]                    DROP COLUMN [LanguageID]
ALTER TABLE [VOCElement]                            DROP COLUMN [LanguageID]
ALTER TABLE [VOCExperienceCategory]                 DROP COLUMN [LanguageID]
ALTER TABLE [VOCFlag]                               DROP COLUMN [LanguageID]
ALTER TABLE [xJobTitlePricing]                      DROP COLUMN [LanguageID]
ALTER TABLE [xJobTitleReviewRules]                  DROP COLUMN [LanguageID]
ALTER TABLE [xServiceProfessionalPricing]           DROP COLUMN [LanguageID]

PRINT 'Drop old countryID columns'
ALTER TABLE [addresstype]                           DROP COLUMN [CountryID]
ALTER TABLE [alert]                                 DROP COLUMN [CountryID]
ALTER TABLE [alerttype]                             DROP COLUMN [CountryID]
ALTER TABLE [backgroundcheck]                       DROP COLUMN [CountryID]
ALTER TABLE [booking]                               DROP COLUMN [CountryID]
ALTER TABLE [CalendarAvailabilityType]              DROP COLUMN [CountryID]
ALTER TABLE [cancellationpolicy]                    DROP COLUMN [CountryID]
ALTER TABLE [clienttype]                            DROP COLUMN [CountryID]
ALTER TABLE [country]                               DROP COLUMN [CountryID]
ALTER TABLE [ExperienceLevel]                       DROP COLUMN [CountryID]
ALTER TABLE [FieldOfStudy]                          DROP COLUMN [CountryID]
ALTER TABLE [Gender]                                DROP COLUMN [CountryID]
ALTER TABLE [JobTitlePlatform]                      DROP COLUMN [CountryID]
ALTER TABLE [JobTitleSolution]                      DROP COLUMN [CountryID]
ALTER TABLE [languagelevel]                         DROP COLUMN [CountryID]
ALTER TABLE [messagetype]                           DROP COLUMN [CountryID]
ALTER TABLE [Platform]                              DROP COLUMN [CountryID]
ALTER TABLE [positionpricingtype]                   DROP COLUMN [CountryID]
ALTER TABLE [positionratings]                       DROP COLUMN [CountryID]
ALTER TABLE [positions]                             DROP COLUMN [CountryID]
ALTER TABLE [postingTemplate]                       DROP COLUMN [CountryID]
ALTER TABLE [PricingGroups]                         DROP COLUMN [CountryID]
ALTER TABLE [pricingtype]                           DROP COLUMN [CountryID]
ALTER TABLE [PricingVariableDefinition]             DROP COLUMN [CountryID]
ALTER TABLE [providerpackage]                       DROP COLUMN [CountryID]
ALTER TABLE [providerpaymentpreferencetype]         DROP COLUMN [CountryID]
ALTER TABLE [question]                              DROP COLUMN [CountryID]
ALTER TABLE [SearchCategory]                        DROP COLUMN [CountryID]
ALTER TABLE [SearchSubCategory]                     DROP COLUMN [CountryID]
ALTER TABLE [SearchSubCategorySolution]             DROP COLUMN [CountryID]
ALTER TABLE [serviceattribute]                      DROP COLUMN [CountryID]
ALTER TABLE [serviceattributecategory]              DROP COLUMN [CountryID]
ALTER TABLE [ServiceAttributeExperienceLevel]       DROP COLUMN [CountryID]
ALTER TABLE [ServiceAttributeLanguageLevel]         DROP COLUMN [CountryID]
ALTER TABLE [servicecategory]                       DROP COLUMN [CountryID]
ALTER TABLE [servicecategoryposition]               DROP COLUMN [CountryID]
ALTER TABLE [servicecategorypositionattribute]      DROP COLUMN [CountryID]
ALTER TABLE [servicesubcategory]                    DROP COLUMN [CountryID]
ALTER TABLE [Solution]                              DROP COLUMN [CountryID]
ALTER TABLE [Specialization]                        DROP COLUMN [CountryID]
ALTER TABLE [taxentitytype]                         DROP COLUMN [CountryID]
ALTER TABLE [tintype]                               DROP COLUMN [CountryID]
ALTER TABLE [transporttype]                         DROP COLUMN [CountryID]
ALTER TABLE [UserBadge]                             DROP COLUMN [CountryID]
ALTER TABLE [UserListingSpecialization]             DROP COLUMN [CountryID]
ALTER TABLE [UserPosting]                           DROP COLUMN [CountryID]
ALTER TABLE [userprofilepositions]                  DROP COLUMN [CountryID]
ALTER TABLE [userprofileserviceattributes]          DROP COLUMN [CountryID]
ALTER TABLE [UserSolution]                          DROP COLUMN [CountryID]
ALTER TABLE [verification]                          DROP COLUMN [CountryID]
ALTER TABLE [verificationcategory]                  DROP COLUMN [CountryID]
ALTER TABLE [verificationstatus]                    DROP COLUMN [CountryID]
ALTER TABLE [VOCElement]                            DROP COLUMN [CountryID]
ALTER TABLE [VOCExperienceCategory]                 DROP COLUMN [CountryID]
ALTER TABLE [VOCFlag]                               DROP COLUMN [CountryID]
ALTER TABLE [xJobTitlePricing]                      DROP COLUMN [CountryID]
ALTER TABLE [xJobTitleReviewRules]                  DROP COLUMN [CountryID]
ALTER TABLE [xServiceProfessionalPricing]           DROP COLUMN [CountryID]

-- Special case: Language table, is removed completely
DROP TABLE [language]
