-- IMPORTANT: All 'alter' sentences need a 'GO' batch separator line in order to get really executed
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
GO
ALTER TABLE [alert]                                 ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [alerttype]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [backgroundcheck]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [booking]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [CalendarAvailabilityType]              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [cancellationpolicy]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [clienttype]                            ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [country]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [ExperienceLevel]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [FieldOfStudy]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [Gender]                                ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [JobTitlePlatform]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [JobTitleSolution]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [languagelevel]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [messagetype]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [Platform]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [positionpricingtype]                   ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [positionratings]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [positions]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [postingTemplate]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [PricingGroups]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [pricingtype]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [PricingVariableDefinition]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [providerpackage]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [providerpaymentpreferencetype]         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [question]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [SearchCategory]                        ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [SearchSubCategory]                     ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [SearchSubCategorySolution]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [serviceattribute]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [serviceattributecategory]              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [ServiceAttributeExperienceLevel]       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [ServiceAttributeLanguageLevel]         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [servicecategory]                       ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [servicecategoryposition]               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [servicecategorypositionattribute]      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [servicesubcategory]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [Solution]                              ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [Specialization]                        ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [taxentitytype]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [tintype]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [transporttype]                         ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [UserBadge]                             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [UserListingSpecialization]             ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [UserPosting]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [userprofilepositions]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [userprofileserviceattributes]          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [UserSolution]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [verification]                          ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [verificationcategory]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [verificationstatus]                    ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [VOCElement]                            ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [VOCExperienceCategory]                 ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [VOCFlag]                               ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [xJobTitlePricing]                      ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [xJobTitleReviewRules]                  ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [xServiceProfessionalPricing]           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO

PRINT 'New users columns'
-- Special case: [users] have different language and keeps one for country but slightly different meaning and type
ALTER TABLE [users] ADD [PreferredLanguage] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO
ALTER TABLE [users] ADD [SignupCountryCode] NVARCHAR(2) NULL
GO

-- Transfer/migrate data: new column comes already with default value and other ones are removed already,
-- but there is a special case: [users]
PRINT 'Update users new columns'
UPDATE [users] SET
    [PreferredLanguage] = CASE WHEN PreferredLanguageID=2 THEN 'es-US' ELSE 'en-US' END,
    [SignupCountryCode] = (SELECT CountryCodeAlpha2 FROM country WHERE CountryID = [users].PreferredCountryID)

-- Constraints (except FKs): some must be removed since only involve removed columns, while others require an update
-- Drop old constraints for languageID and countryID. This includes removal of some redundant or dummy constraints found during
-- the language migration
PRINT 'Drop constraints'

-- Create procedure MUST be first in a batch
GO

-- First, a small utility because of unnamed/random constraint names, preventing errors when having to match multiples expected names
-- for the same constraint without throw errors. DO NOT USE FOR WELL KNOW names.
CREATE PROCEDURE temp_util_DROP_CONSTRAINT_IF_EXISTS (
	@table NVARCHAR(512),
	@constraintName NVARCHAR(512)
) AS BEGIN
    -- Usage EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.Student', 'FK__Student__2AE52389F'
	DECLARE @sql NVARCHAR(MAX)
	DECLARE @name NVARCHAR(1000)

	IF EXISTS (
		SELECT name
		FROM sys.foreign_keys
		WHERE [name] = @name
			AND [parent_object_id] = OBJECT_ID(@table)
	) BEGIN
		SET @sql =
			'ALTER TABLE ' + @table
			+ ' DROP CONSTRAINT ' + @name + ';'
		EXEC sp_executeSQL @sql;
		PRINT 'Removed ' + @table + ' CONSTRAINT: ' + @name
	END
	ELSE
		PRINT 'Not Found ' + @table + ' CONSTRAINT: ' + @name
END
GO

-- Now, the constraints
ALTER TABLE SearchCategory DROP CONSTRAINT [FK_SearchCategory_language]
GO
ALTER TABLE CalendarRecurrenceFrequencyTypes DROP CONSTRAINT [FK_CalendarRecurrenceFrequencyTypes_CalendarRecurrenceFrequencyTypes]
GO
ALTER TABLE FieldOfStudy DROP CONSTRAINT [FK__FieldOfStudy__LanguageID__CountryID]
GO
ALTER TABLE Platform DROP CONSTRAINT [FK_Platform_language]
GO
ALTER TABLE SearchSubCategory DROP CONSTRAINT [FK_SearchSubCategory_language]
GO
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_language]
GO
ALTER TABLE Solution DROP CONSTRAINT [FK_Solution_language]
GO

-- Update complex constraints/indexes, phase one: drop; re-creation will come after PKs re-creation
PRINT 'Update complex indexes/constraints'
DROP INDEX [userprofilepositions].IX_userprofilepositions
GO

-- CCCUsers duped userID FK
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.CCCUsers', 'FK__CCCUsers__UserID'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.CCCUsers', 'FK__CCCUsers__UserID__6EA14102'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.CCCUsers', 'FK__CCCUsers__UserID__75586032'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.CCCUsers', 'FK__CCCUsers__UserID__4A6E022D'
GO
--- UserLicenseCertifications duped UserID FK
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.UserLicenseCertifications', 'FK__userlicen__Provi__5B045CA9'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.UserLicenseCertifications', 'FK_userlicen__ProviderUserID'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.UserLicenseCertifications', 'FK__userlicen__Provi__64CCF2AE'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.UserLicenseCertifications', 'FK__UserLicen__Provi__4FD1D5C8'
GO
-- Others..
ALTER TABLE JobTitlePlatform DROP CONSTRAINT [FK_JobTitlePlatform_Platform]
GO
ALTER TABLE JobTitleSolution DROP CONSTRAINT [FK_JobTitleSolution_positions]
GO
ALTER TABLE JobTitleSolution DROP CONSTRAINT [FK_JobTitleSolution_Solution]
GO
ALTER TABLE SearchSubCategory DROP CONSTRAINT [FK_SearchSubCategory_SearchCategory]
GO
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_SearchSubCategory]
GO
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_Solution]
GO
ALTER TABLE Specialization DROP CONSTRAINT [FK_Specialization_Solution]
GO
ALTER TABLE UserBadge DROP CONSTRAINT [FK_UserBadge_Solution]
GO
ALTER TABLE UserListingSpecialization DROP CONSTRAINT [FK_UserListingSpecialization_Specialization]
GO
ALTER TABLE UserSolution DROP CONSTRAINT [FK_UserSolution_Solution]
GO
ALTER TABLE booking DROP CONSTRAINT [FK__booking__cancellationPolicy]
GO
ALTER TABLE booking DROP CONSTRAINT [FK__booking__jobtitle]
GO
ALTER TABLE booking DROP CONSTRAINT [FK__booking__pricingSummary]
GO
ALTER TABLE servicesubcategory DROP CONSTRAINT [FK_servicesubcategory_servicecategory]
GO
ALTER TABLE userprofilepositions DROP CONSTRAINT [FK_userprofilepositions_positions]
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.pricingSummary', 'FK_pricingestimate_pricingestimate'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.pricingSummary', 'FK_pricingSummary_pricingSummary'
GO
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS N'dbo.pricingSummary', 'FK_pricingSummary_pricingSummary1'
GO
-- PositionPricingType
ALTER TABLE positionpricingtype DROP CONSTRAINT [Fk_positionpricingtype]
GO
ALTER TABLE positionpricingtype DROP CONSTRAINT [Fk_positionpricingtype_0]
GO
ALTER TABLE positionpricingtype DROP CONSTRAINT [Fk_positionpricingtype_1]
GO

-- Remove utility (mandatory to happen at a different batch, or an error is thrown)
GO
DROP PROCEDURE temp_util_DROP_CONSTRAINT_IF_EXISTS
GO

-- Update PKs
PRINT 'Replace Primary Keys that had languageID/countryID as members'

-- Create procedure MUST be first in a batch
GO

-- First, a small utility, so we can deal with unnamed/random PK names without problem
-- (creates a proc, but is removed later)
CREATE PROCEDURE temp_util_drop_table_pk (
	@table NVARCHAR(512)
) AS BEGIN
    -- Usage EXEC temp_util_drop_table_pk(N'dbo.Student')
	DECLARE @sql NVARCHAR(MAX)
	DECLARE @name NVARCHAR(1000)

	SELECT @name = name
    FROM sys.key_constraints
    WHERE [type] = 'PK'
		AND [parent_object_id] = OBJECT_ID(@table);

	SET @sql =
		'ALTER TABLE ' + @table
		+ ' DROP CONSTRAINT ' + @name + ';'

	EXEC sp_executeSQL @sql;

	PRINT 'Removed ' + @table + ' PK: ' + @name
END

-- Procedure creation must go in a single batch
GO

-- Now the PKs
EXEC temp_util_drop_table_pk N'dbo.JobTitlePlatform'
GO
ALTER TABLE [JobTitlePlatform] ADD CONSTRAINT [PK_JobTitlePlatform] PRIMARY KEY ([JobTitleID] ASC, [PlatformID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.JobTitleSolution'
GO
ALTER TABLE [JobTitleSolution] ADD CONSTRAINT [PK_JobTitleSolution] PRIMARY KEY ([JobTitleID] ASC, [SolutionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.Platform'
GO
ALTER TABLE [Platform] ADD CONSTRAINT [PK_Platform] PRIMARY KEY ([PlatformID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.PricingVariableDefinition'
GO
ALTER TABLE [PricingVariableDefinition] ADD CONSTRAINT [PK_PricingVariableDefinition] PRIMARY KEY ([PricingVariableID] ASC, [PositionID] ASC, [PricingTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.SearchCategory'
GO
ALTER TABLE [SearchCategory] ADD CONSTRAINT [PK_SearchCategory] PRIMARY KEY ([SearchCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.SearchSubCategory'
GO
ALTER TABLE [SearchSubCategory] ADD CONSTRAINT [PK_SearchSubCategory] PRIMARY KEY ([SearchSubCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.SearchSubCategorySolution'
GO
ALTER TABLE [SearchSubCategorySolution] ADD CONSTRAINT [PK_SearchSubCategorySolution] PRIMARY KEY ([SearchSubCategoryID] ASC, [SolutionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.ServiceAttributeExperienceLevel'
GO
ALTER TABLE [ServiceAttributeExperienceLevel] ADD CONSTRAINT [PK_ServiceAttributeExperienceLevel] PRIMARY KEY ([UserID] ASC, [PositionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.ServiceAttributeLanguageLevel'
GO
ALTER TABLE [ServiceAttributeLanguageLevel] ADD CONSTRAINT [PK_ServiceAttributeLanguageLevel] PRIMARY KEY ([UserID] ASC, [PositionID] ASC, [ServiceAttributeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.Solution'
GO
ALTER TABLE [Solution] ADD CONSTRAINT [PK_Solution] PRIMARY KEY ([SolutionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.Specialization'
GO
ALTER TABLE [Specialization] ADD CONSTRAINT [PK_Specialization] PRIMARY KEY ([SpecializationID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.UserListingSpecialization'
GO
ALTER TABLE [UserListingSpecialization] ADD CONSTRAINT [PK_UserListingSpecialization] PRIMARY KEY ([UserID] ASC, [UserListingID] ASC, [SpecializationID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.VOCElement'
GO
ALTER TABLE [VOCElement] ADD CONSTRAINT [PK_VOCElement] PRIMARY KEY ([VOCElementID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.VOCExperienceCategory'
GO
ALTER TABLE [VOCExperienceCategory] ADD CONSTRAINT [PK_VOCExperienceCategory] PRIMARY KEY ([VOCExperienceCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.VOCFlag'
GO
ALTER TABLE [VOCFlag] ADD CONSTRAINT [PK_VOCFlag] PRIMARY KEY ([VOCFlagID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.addresstype'
GO
ALTER TABLE [addresstype] ADD CONSTRAINT [PK_addresstype] PRIMARY KEY ([AddressTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.alert'
GO
ALTER TABLE [alert] ADD CONSTRAINT [PK_alert] PRIMARY KEY ([AlertID] ASC, [AlertTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.backgroundcheck'
GO
ALTER TABLE [backgroundcheck] ADD CONSTRAINT [PK_backgroundcheck] PRIMARY KEY ([BackgroundCheckID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.cancellationpolicy'
GO
ALTER TABLE [cancellationpolicy] ADD CONSTRAINT [PK_cancellationpolicy] PRIMARY KEY ([CancellationPolicyID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.country'
GO
ALTER TABLE [country] ADD CONSTRAINT [PK_country] PRIMARY KEY ([CountryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.languagelevel'
GO
ALTER TABLE [languagelevel] ADD CONSTRAINT [PK_languagelevel] PRIMARY KEY ([LanguageLevelID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.licensecertification'
GO
ALTER TABLE [licensecertification] ADD CONSTRAINT [PK_licensecertification] PRIMARY KEY ([LicenseCertificationID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.messagethreadstatus'
GO
-- Special case: messagethreadstatus had a (wrong) unique index, named with the expected name for the PK. Remove first since is a mistake,
-- and to be able to create the PK
ALTER TABLE [messagethreadstatus] DROP CONSTRAINT [Pk_messagethreadstatus]
GO
ALTER TABLE [messagethreadstatus] ADD CONSTRAINT [PK_messagethreadstatus] PRIMARY KEY ([MessageThreadStatusID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.messagetype'
GO
ALTER TABLE [messagetype] ADD CONSTRAINT [PK_messagetype] PRIMARY KEY ([MessageTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.positionpricingtype'
GO
ALTER TABLE [positionpricingtype] ADD CONSTRAINT [PK_positionpricingtype] PRIMARY KEY ([PositionID] ASC, [PricingTypeID] ASC, [ClientTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.positionratings'
GO
ALTER TABLE [positionratings] ADD CONSTRAINT [PK_positionratings] PRIMARY KEY ([PositionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.positions'
GO
ALTER TABLE [positions] ADD CONSTRAINT [PK_positions] PRIMARY KEY ([PositionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.pricingsummary'
GO
ALTER TABLE [pricingsummary] ADD CONSTRAINT [PK_pricingsummary] PRIMARY KEY ([PricingSummaryID] ASC, [PricingSummaryRevision] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.pricingtype'
GO
-- Special case: pricingtype had a (wrong) unique index, named with the expected name for the PK. Remove first since is a mistake, and
-- to be able to create the PK
ALTER TABLE [pricingtype] DROP CONSTRAINT [PK_pricingtype]
GO
ALTER TABLE [pricingtype] ADD CONSTRAINT [PK_pricingtype] PRIMARY KEY ([PricingTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.providerpaymentpreferencetype'
GO
ALTER TABLE [providerpaymentpreferencetype] ADD CONSTRAINT [PK_providerpaymentpreferencetype] PRIMARY KEY ([ProviderPaymentPreferenceTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.serviceattribute'
GO
ALTER TABLE [serviceattribute] ADD CONSTRAINT [PK_serviceattribute] PRIMARY KEY ([ServiceAttributeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.serviceattributecategory'
GO
ALTER TABLE [serviceattributecategory] ADD CONSTRAINT [PK_serviceattributecategory] PRIMARY KEY ([ServiceAttributeCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.servicecategory'
GO
ALTER TABLE [servicecategory] ADD CONSTRAINT [PK_servicecategory] PRIMARY KEY ([ServiceCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.servicecategoryposition'
GO
ALTER TABLE [servicecategoryposition] ADD CONSTRAINT [PK_servicecategoryposition] PRIMARY KEY ([ServiceCategoryID] ASC, [PositionID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.servicecategorypositionattribute'
GO
ALTER TABLE [servicecategorypositionattribute] ADD CONSTRAINT [PK_servicecategorypositionattribute] PRIMARY KEY ([PositionID] ASC, [ServiceAttributeCategoryID] ASC, [ServiceAttributeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.servicesubcategory'
GO
ALTER TABLE [servicesubcategory] ADD CONSTRAINT [PK_servicesubcategory] PRIMARY KEY ([ServiceSubCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.taxentitytype'
GO
ALTER TABLE [taxentitytype] ADD CONSTRAINT [PK_taxentitytype] PRIMARY KEY ([TaxEntityTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.tintype'
GO
ALTER TABLE [tintype] ADD CONSTRAINT [PK_tintype] PRIMARY KEY ([TINTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.transporttype'
GO
ALTER TABLE [transporttype] ADD CONSTRAINT [PK_transporttype] PRIMARY KEY ([TransportTypeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.userprofileserviceattributes'
GO
ALTER TABLE [userprofileserviceattributes] ADD CONSTRAINT [PK_userprofileserviceattributes] PRIMARY KEY ([UserID] ASC, [PositionID] ASC, [ServiceAttributeCategoryID] ASC, [ServiceAttributeID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.verification'
GO
ALTER TABLE [verification] ADD CONSTRAINT [PK_verification] PRIMARY KEY ([VerificationID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.verificationcategory'
GO
ALTER TABLE [verificationcategory] ADD CONSTRAINT [PK_verificationcategory] PRIMARY KEY ([VerificationCategoryID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.verificationstatus'
GO
ALTER TABLE [verificationstatus] ADD CONSTRAINT [PK_verificationstatus] PRIMARY KEY ([VerificationStatusID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.verificationstatus'
GO
ALTER TABLE [verificationstatus] ADD CONSTRAINT [PK_verificationstatus] PRIMARY KEY ([VerificationStatusID] ASC)
GO
EXEC temp_util_drop_table_pk N'dbo.xJobTitleReviewRules'
GO
ALTER TABLE [xJobTitleReviewRules] ADD CONSTRAINT [PK_xJobTitleReviewRules] PRIMARY KEY ([JobTitleID] ASC)
GO

-- Special cas on [clienttype]: it replaces PK, index and RENAMES the PK column. FIRST: drop, THEN: rename, LAST: add again
EXEC temp_util_drop_table_pk N'dbo.clienttype'
GO
DROP INDEX clienttype.idx_clienttype
GO
EXEC sp_RENAME 'clienttype.CllientTypeID' , 'ClientTypeID', 'COLUMN'
GO
ALTER TABLE [clienttype] ADD CONSTRAINT [PK_clienttype] PRIMARY KEY ([ClientTypeID] ASC)
GO
CREATE NONCLUSTERED INDEX [idx_clienttype] ON [dbo].[clienttype]([ClientTypeID] ASC, [CountryID] ASC)
GO

-- Remove utility (mandatory to happen at a different batch, or an error is thrown)
GO
DROP PROCEDURE temp_util_drop_table_pk
GO

-- Drop constraints Phase 2: re-create them, attached to new PKs
PRINT 'Re-create constraints (mostly FKs)'
CREATE UNIQUE NONCLUSTERED INDEX [IX_userprofilepositions] ON [dbo].[userprofilepositions]([UserID] ASC, [PositionID] ASC)
GO
ALTER TABLE [CCCUsers] ADD CONSTRAINT [FK__CCCUsers__UserID] FOREIGN KEY ([UserID]) REFERENCES [dbo].[users] ([UserID])
GO
ALTER TABLE [UserLicenseCertifications] ADD CONSTRAINT [FK_userlicen__ProviderUserID] FOREIGN KEY ([ProviderUserID]) REFERENCES [dbo].[users] ([UserID])
GO
ALTER TABLE JobTitlePlatform ADD CONSTRAINT [FK_JobTitlePlatform_Platform] FOREIGN KEY ([PlatformID]) REFERENCES [dbo].[Platform] ([PlatformID])
GO
ALTER TABLE JobTitleSolution ADD CONSTRAINT [FK_JobTitleSolution_positions] FOREIGN KEY ([JobTitleID]) REFERENCES [dbo].[positions] ([PositionID])
GO
ALTER TABLE JobTitleSolution ADD CONSTRAINT [FK_JobTitleSolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
GO
ALTER TABLE SearchSubCategory ADD CONSTRAINT [FK_SearchSubCategory_SearchCategory] FOREIGN KEY ([SearchCategoryID]) REFERENCES [dbo].[SearchCategory] ([SearchCategoryID])
GO
ALTER TABLE SearchSubCategorySolution ADD CONSTRAINT [FK_SearchSubCategorySolution_SearchSubCategory] FOREIGN KEY ([SearchSubCategoryID]) REFERENCES [dbo].[SearchSubCategory] ([SearchSubCategoryID])
GO
ALTER TABLE SearchSubCategorySolution ADD CONSTRAINT [FK_SearchSubCategorySolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
GO
ALTER TABLE Specialization ADD CONSTRAINT [FK_Specialization_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
GO
ALTER TABLE UserBadge ADD CONSTRAINT [FK_UserBadge_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
GO
ALTER TABLE UserListingSpecialization ADD CONSTRAINT [FK_UserListingSpecialization_Specialization] FOREIGN KEY ([SpecializationID]) REFERENCES [dbo].[Specialization] ([SpecializationID])
GO
ALTER TABLE UserSolution ADD CONSTRAINT [FK_UserSolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
GO
ALTER TABLE booking ADD CONSTRAINT [FK__booking__cancellationPolicy] FOREIGN KEY ([CancellationPolicyID]) REFERENCES [dbo].[cancellationpolicy] ([CancellationPolicyID])
GO
ALTER TABLE booking ADD CONSTRAINT [FK__booking__jobtitle] FOREIGN KEY ([JobTitleID]) REFERENCES [dbo].[positions] ([PositionID])
GO
ALTER TABLE booking ADD CONSTRAINT [FK__booking__pricingSummary] FOREIGN KEY ([PricingSummaryID], [PricingSummaryRevision]) REFERENCES [dbo].[pricingSummary] ([PricingSummaryID], [PricingSummaryRevision])
GO
ALTER TABLE servicesubcategory ADD CONSTRAINT [FK_servicesubcategory_servicecategory] FOREIGN KEY ([ServiceCategoryID]) REFERENCES [dbo].[servicecategory] ([ServiceCategoryID])
GO
ALTER TABLE userprofilepositions ADD CONSTRAINT [FK_userprofilepositions_positions] FOREIGN KEY([PositionID]) REFERENCES [dbo].[positions] ([PositionID])
GO
ALTER TABLE positionpricingtype ADD CONSTRAINT [Fk_positionpricingtype_pricingtype] FOREIGN KEY ([PricingTypeID]) REFERENCES [dbo].[pricingtype] ([PricingTypeID])
GO
ALTER TABLE positionpricingtype ADD CONSTRAINT [Fk_positionpricingtype_positions] FOREIGN KEY ([PositionID]) REFERENCES [dbo].[positions] ([PositionID])
GO
ALTER TABLE positionpricingtype ADD CONSTRAINT [Fk_positionpricingtype_clienttype] FOREIGN KEY ([ClientTypeID]) REFERENCES [dbo].[clienttype] ([ClientTypeID])
GO

-- Drop old columns languageID columns
PRINT 'Drop old languageID columns'
ALTER TABLE [addresstype]                           DROP COLUMN [LanguageID]
GO
ALTER TABLE [alert]                                 DROP COLUMN [LanguageID]
GO
ALTER TABLE [alerttype]                             DROP COLUMN [LanguageID]
GO
ALTER TABLE [backgroundcheck]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [booking]                               DROP COLUMN [LanguageID]
GO
ALTER TABLE [CalendarAvailabilityType]              DROP COLUMN [LanguageID]
GO
ALTER TABLE [cancellationpolicy]                    DROP COLUMN [LanguageID]
GO
ALTER TABLE [clienttype]                            DROP COLUMN [LanguageID]
GO
ALTER TABLE [country]                               DROP COLUMN [LanguageID]
GO
ALTER TABLE [ExperienceLevel]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [FieldOfStudy]                          DROP COLUMN [LanguageID]
GO
ALTER TABLE [Gender]                                DROP COLUMN [LanguageID]
GO
ALTER TABLE [JobTitlePlatform]                      DROP COLUMN [LanguageID]
GO
ALTER TABLE [JobTitleSolution]                      DROP COLUMN [LanguageID]
GO
ALTER TABLE [languagelevel]                         DROP COLUMN [LanguageID]
GO
ALTER TABLE [messagetype]                           DROP COLUMN [LanguageID]
GO
ALTER TABLE [Platform]                              DROP COLUMN [LanguageID]
GO
ALTER TABLE [positionpricingtype]                   DROP COLUMN [LanguageID]
GO
ALTER TABLE [positionratings]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [positions]                             DROP COLUMN [LanguageID]
GO
ALTER TABLE [postingTemplate]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [PricingGroups]                         DROP COLUMN [LanguageID]
GO
ALTER TABLE [pricingtype]                           DROP COLUMN [LanguageID]
GO
ALTER TABLE [PricingVariableDefinition]             DROP COLUMN [LanguageID]
GO
ALTER TABLE [providerpackage]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [providerpaymentpreferencetype]         DROP COLUMN [LanguageID]
GO
ALTER TABLE [question]                              DROP COLUMN [LanguageID]
GO
ALTER TABLE [SearchCategory]                        DROP COLUMN [LanguageID]
GO
ALTER TABLE [SearchSubCategory]                     DROP COLUMN [LanguageID]
GO
ALTER TABLE [SearchSubCategorySolution]             DROP COLUMN [LanguageID]
GO
ALTER TABLE [serviceattribute]                      DROP COLUMN [LanguageID]
GO
ALTER TABLE [serviceattributecategory]              DROP COLUMN [LanguageID]
GO
ALTER TABLE [ServiceAttributeExperienceLevel]       DROP COLUMN [LanguageID]
GO
ALTER TABLE [ServiceAttributeLanguageLevel]         DROP COLUMN [LanguageID]
GO
ALTER TABLE [servicecategory]                       DROP COLUMN [LanguageID]
GO
ALTER TABLE [servicecategoryposition]               DROP COLUMN [LanguageID]
GO
ALTER TABLE [servicecategorypositionattribute]      DROP COLUMN [LanguageID]
GO
ALTER TABLE [servicesubcategory]                    DROP COLUMN [LanguageID]
GO
ALTER TABLE [Solution]                              DROP COLUMN [LanguageID]
GO
ALTER TABLE [Specialization]                        DROP COLUMN [LanguageID]
GO
ALTER TABLE [taxentitytype]                         DROP COLUMN [LanguageID]
GO
ALTER TABLE [tintype]                               DROP COLUMN [LanguageID]
GO
ALTER TABLE [transporttype]                         DROP COLUMN [LanguageID]
GO
ALTER TABLE [UserBadge]                             DROP COLUMN [LanguageID]
GO
ALTER TABLE [UserListingSpecialization]             DROP COLUMN [LanguageID]
GO
ALTER TABLE [UserPosting]                           DROP COLUMN [LanguageID]
GO
ALTER TABLE [userprofilepositions]                  DROP COLUMN [LanguageID]
GO
ALTER TABLE [userprofileserviceattributes]          DROP COLUMN [LanguageID]
GO
ALTER TABLE [UserSolution]                          DROP COLUMN [LanguageID]
GO
ALTER TABLE [verification]                          DROP COLUMN [LanguageID]
GO
ALTER TABLE [verificationcategory]                  DROP COLUMN [LanguageID]
GO
ALTER TABLE [verificationstatus]                    DROP COLUMN [LanguageID]
GO
ALTER TABLE [VOCElement]                            DROP COLUMN [LanguageID]
GO
ALTER TABLE [VOCExperienceCategory]                 DROP COLUMN [LanguageID]
GO
ALTER TABLE [VOCFlag]                               DROP COLUMN [LanguageID]
GO
ALTER TABLE [xJobTitlePricing]                      DROP COLUMN [LanguageID]
GO
ALTER TABLE [xJobTitleReviewRules]                  DROP COLUMN [LanguageID]
GO
ALTER TABLE [xServiceProfessionalPricing]           DROP COLUMN [LanguageID]
GO

PRINT 'Drop old countryID columns'
ALTER TABLE [addresstype]                           DROP COLUMN [CountryID]
GO
ALTER TABLE [alert]                                 DROP COLUMN [CountryID]
GO
ALTER TABLE [alerttype]                             DROP COLUMN [CountryID]
GO
ALTER TABLE [backgroundcheck]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [booking]                               DROP COLUMN [CountryID]
GO
ALTER TABLE [CalendarAvailabilityType]              DROP COLUMN [CountryID]
GO
ALTER TABLE [cancellationpolicy]                    DROP COLUMN [CountryID]
GO
ALTER TABLE [clienttype]                            DROP COLUMN [CountryID]
GO
ALTER TABLE [country]                               DROP COLUMN [CountryID]
GO
ALTER TABLE [ExperienceLevel]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [FieldOfStudy]                          DROP COLUMN [CountryID]
GO
ALTER TABLE [Gender]                                DROP COLUMN [CountryID]
GO
ALTER TABLE [JobTitlePlatform]                      DROP COLUMN [CountryID]
GO
ALTER TABLE [JobTitleSolution]                      DROP COLUMN [CountryID]
GO
ALTER TABLE [languagelevel]                         DROP COLUMN [CountryID]
GO
ALTER TABLE [messagetype]                           DROP COLUMN [CountryID]
GO
ALTER TABLE [Platform]                              DROP COLUMN [CountryID]
GO
ALTER TABLE [positionpricingtype]                   DROP COLUMN [CountryID]
GO
ALTER TABLE [positionratings]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [positions]                             DROP COLUMN [CountryID]
GO
ALTER TABLE [postingTemplate]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [PricingGroups]                         DROP COLUMN [CountryID]
GO
ALTER TABLE [pricingtype]                           DROP COLUMN [CountryID]
GO
ALTER TABLE [PricingVariableDefinition]             DROP COLUMN [CountryID]
GO
ALTER TABLE [providerpackage]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [providerpaymentpreferencetype]         DROP COLUMN [CountryID]
GO
ALTER TABLE [question]                              DROP COLUMN [CountryID]
GO
ALTER TABLE [SearchCategory]                        DROP COLUMN [CountryID]
GO
ALTER TABLE [SearchSubCategory]                     DROP COLUMN [CountryID]
GO
ALTER TABLE [SearchSubCategorySolution]             DROP COLUMN [CountryID]
GO
ALTER TABLE [serviceattribute]                      DROP COLUMN [CountryID]
GO
ALTER TABLE [serviceattributecategory]              DROP COLUMN [CountryID]
GO
ALTER TABLE [ServiceAttributeExperienceLevel]       DROP COLUMN [CountryID]
GO
ALTER TABLE [ServiceAttributeLanguageLevel]         DROP COLUMN [CountryID]
GO
ALTER TABLE [servicecategory]                       DROP COLUMN [CountryID]
GO
ALTER TABLE [servicecategoryposition]               DROP COLUMN [CountryID]
GO
ALTER TABLE [servicecategorypositionattribute]      DROP COLUMN [CountryID]
GO
ALTER TABLE [servicesubcategory]                    DROP COLUMN [CountryID]
GO
ALTER TABLE [Solution]                              DROP COLUMN [CountryID]
GO
ALTER TABLE [Specialization]                        DROP COLUMN [CountryID]
GO
ALTER TABLE [taxentitytype]                         DROP COLUMN [CountryID]
GO
ALTER TABLE [tintype]                               DROP COLUMN [CountryID]
GO
ALTER TABLE [transporttype]                         DROP COLUMN [CountryID]
GO
ALTER TABLE [UserBadge]                             DROP COLUMN [CountryID]
GO
ALTER TABLE [UserListingSpecialization]             DROP COLUMN [CountryID]
GO
ALTER TABLE [UserPosting]                           DROP COLUMN [CountryID]
GO
ALTER TABLE [userprofilepositions]                  DROP COLUMN [CountryID]
GO
ALTER TABLE [userprofileserviceattributes]          DROP COLUMN [CountryID]
GO
ALTER TABLE [UserSolution]                          DROP COLUMN [CountryID]
GO
ALTER TABLE [verification]                          DROP COLUMN [CountryID]
GO
ALTER TABLE [verificationcategory]                  DROP COLUMN [CountryID]
GO
ALTER TABLE [verificationstatus]                    DROP COLUMN [CountryID]
GO
ALTER TABLE [VOCElement]                            DROP COLUMN [CountryID]
GO
ALTER TABLE [VOCExperienceCategory]                 DROP COLUMN [CountryID]
GO
ALTER TABLE [VOCFlag]                               DROP COLUMN [CountryID]
GO
ALTER TABLE [xJobTitlePricing]                      DROP COLUMN [CountryID]
GO
ALTER TABLE [xJobTitleReviewRules]                  DROP COLUMN [CountryID]
GO
ALTER TABLE [xServiceProfessionalPricing]           DROP COLUMN [CountryID]
GO

-- Special case: Language table, is removed completely
DROP TABLE [language]
GO
