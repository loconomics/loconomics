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

-- Constraints (except FKs): some must be removed since only involve removed columns, while others require an update
-- Drop old constraints for languageID and countryID. This includes removal of some redundant or dummy constraints found during
-- the language migration
PRINT 'Drop constraints'
-- First, a small utility because of unnamed/random constraint names, preventing errors when having to match multiples expected names
-- for the same constraint without throw errors. DO NOT USE FOR WELL KNOW names.
CREATE PROCEDURE temp_util_DROP_CONSTRAINT_IF_EXISTS (
	@table NVARCHAR(512),
	@constraintName NVARCHAR(512)
) AS BEGIN
    -- Usage EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.Student', 'FK__Student__2AE52389F')
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
-- Now, the constraints
ALTER TABLE SearchCategory DROP CONSTRAINT [FK_SearchCategory_language]
ALTER TABLE CalendarRecurrenceFrequencyTypes DROP CONSTRAINT [FK_CalendarRecurrenceFrequencyTypes_CalendarRecurrenceFrequencyTypes]
ALTER TABLE FieldOfStudy DROP CONSTRAINT [FK__FieldOfStudy__LanguageID__CountryID]
ALTER TABLE FieldOfStudy DROP CONSTRAINT [FK__FieldOfStudy__LanguageID__CountryID]
ALTER TABLE Platform DROP CONSTRAINT [FK_Platform_language]
ALTER TABLE SearchSubCategory DROP CONSTRAINT [FK_SearchSubCategory_language]
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_language]
ALTER TABLE Solution DROP CONSTRAINT [FK_Solution_language]

-- Update complex constraints/indexes
PRINT 'Update complex indexes/constraints'
DROP INDEX [userprofilepositions].IX_userprofilepositions
CREATE UNIQUE NONCLUSTERED INDEX [IX_userprofilepositions] ON [dbo].[userprofilepositions]([UserID] ASC, [PositionID] ASC)
-- CCCUsers duped userID FK
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.CCCUsers', 'FK__CCCUsers__UserID')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.CCCUsers', 'FK__CCCUsers__UserID__6EA14102')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.CCCUsers', 'FK__CCCUsers__UserID__75586032')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.CCCUsers', 'FK__CCCUsers__UserID__4A6E022D')
ALTER TABLE [CCCUsers] ADD CONSTRAINT [FK__CCCUsers__UserID] FOREIGN KEY ([UserID]) REFERENCES [dbo].[users] ([UserID])
--- UserLicenseCertifications duped UserID FK
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.UserLicenseCertifications', 'FK__userlicen__Provi__5B045CA9')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.UserLicenseCertifications', 'FK_userlicen__ProviderUserID')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.UserLicenseCertifications', 'FK__userlicen__Provi__64CCF2AE')
EXEC temp_util_DROP_CONSTRAINT_IF_EXISTS(N'dbo.UserLicenseCertifications', 'FK__UserLicen__Provi__4FD1D5C8')
ALTER TABLE [UserLicenseCertifications] ADD CONSTRAINT [FK_userlicen__ProviderUserID] FOREIGN KEY ([ProviderUserID]) REFERENCES [dbo].[users] ([UserID]))
--- Others..
ALTER TABLE JobTitlePlatform DROP CONSTRAINT [FK_JobTitlePlatform_Platform]
ALTER TABLE JobTitlePlatform ADD CONSTRAINT [FK_JobTitlePlatform_Platform] FOREIGN KEY ([PlatformID]) REFERENCES [dbo].[Platform] ([PlatformID])
ALTER TABLE JobTitleSolution DROP CONSTRAINT [FK_JobTitleSolution_positions]
ALTER TABLE JobTitleSolution ADD CONSTRAINT [FK_JobTitleSolution_positions] FOREIGN KEY ([JobTitleID]) REFERENCES [dbo].[positions] ([PositionID])
ALTER TABLE JobTitleSolution DROP CONSTRAINT [FK_JobTitleSolution_Solution]
ALTER TABLE JobTitleSolution ADD CONSTRAINT [FK_JobTitleSolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
ALTER TABLE SearchSubCategory DROP CONSTRAINT [FK_SearchSubCategory_SearchCategory]
ALTER TABLE SearchSubCategory ADD CONSTRAINT [FK_SearchSubCategory_SearchCategory] FOREIGN KEY ([SearchCategoryID]) REFERENCES [dbo].[SearchCategory] ([SearchCategoryID])
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_SearchSubCategory]
ALTER TABLE SearchSubCategorySolution ADD CONSTRAINT [FK_SearchSubCategorySolution_SearchSubCategory] FOREIGN KEY ([SearchSubCategoryID]) REFERENCES [dbo].[SearchSubCategory] ([SearchSubCategoryID])
ALTER TABLE SearchSubCategorySolution DROP CONSTRAINT [FK_SearchSubCategorySolution_Solution]
ALTER TABLE SearchSubCategorySolution ADD CONSTRAINT [FK_SearchSubCategorySolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
ALTER TABLE Specialization DROP CONSTRAINT [FK_Specialization_Solution]
ALTER TABLE Specialization ADD CONSTRAINT [FK_Specialization_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
ALTER TABLE UserBadge DROP CONSTRAINT [FK_UserBadge_Solution]
ALTER TABLE UserBadge ADD CONSTRAINT [FK_UserBadge_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
ALTER TABLE UserListingSpecialization DROP CONSTRAINT [FK_UserBadge_Solution]
ALTER TABLE UserListingSpecialization ADD CONSTRAINT [FK_UserListingSpecialization_Specialization] FOREIGN KEY ([SpecializationID]) REFERENCES [dbo].[Specialization] ([SpecializationID])
ALTER TABLE UserSolution DROP CONSTRAINT [FK_UserSolution_Solution]
ALTER TABLE UserSolution ADD CONSTRAINT [FK_UserSolution_Solution] FOREIGN KEY ([SolutionID]) REFERENCES [dbo].[Solution] ([SolutionID])
ALTER TABLE booking DROP CONSTRAINT [FK__booking__cancellationPolicy]
ALTER TABLE booking ADD CONSTRAINT [FK__booking__cancellationPolicy] FOREIGN KEY ([CancellationPolicyID]) REFERENCES [dbo].[cancellationpolicy] ([CancellationPolicyID])
ALTER TABLE booking DROP CONSTRAINT [FK__booking__jobtitle]
ALTER TABLE booking ADD CONSTRAINT [FK__booking__jobtitle] FOREIGN KEY ([JobTitleID]) REFERENCES [dbo].[positions] ([PositionID])
ALTER TABLE booking DROP CONSTRAINT [FK__booking__pricingSummary]
ALTER TABLE booking ADD CONSTRAINT [FK__booking__pricingSummary] FOREIGN KEY ([PricingSummaryID]) REFERENCES [dbo].[pricingSummary] ([PricingSummaryID])

-- Remove utility
DROP PROCEDURE temp_util_DROP_CONSTRAINT_IF_EXISTS

-- Update PKs
PRINT 'Replace Primary Keys that had languageID/countryID as members'
-- First, a small utility, so we can deal with unnamed/random PK names without problem
-- (creates a proc, but is removed later)
CREATE PROCEDURE fx__temp_util_drop_table_pk (
	@table NVARCHAR(512)
) AS BEGIN
    -- Usage EXEC fx__temp_util_drop_table_pk(N'dbo.Student')
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
-- Now the PKs
EXEC fx__temp_util_drop_table_pk N'dbo.JobTitlePlatform'
ALTER TABLE [JobTitlePlatform] ADD CONSTRAINT [PK_JobTitlePlatform] PRIMARY KEY ([JobTitleID] ASC, [PlatformID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.JobTitleSolution'
ALTER TABLE [JobTitleSolution] ADD CONSTRAINT [PK_JobTitleSolution] PRIMARY KEY ([JobTitleID] ASC, [SolutionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.Platform'
ALTER TABLE [Platform] ADD CONSTRAINT [PK_Platform] PRIMARY KEY ([PlatformID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.PricingVariableDefinition'
ALTER TABLE [PricingVariableDefinition] ADD CONSTRAINT [PK_PricingVariableDefinition] PRIMARY KEY ([PricingVariableID] ASC, [PositionID] ASC, [PricingTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.SearchSubCategory'
ALTER TABLE [SearchSubCategory] ADD CONSTRAINT [PK_SearchSubCategory] PRIMARY KEY ([SearchSubCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.SearchSubCategorySolution'
ALTER TABLE [SearchSubCategorySolution] ADD CONSTRAINT [PK_SearchSubCategorySolution] PRIMARY KEY ([SearchSubCategoryID] ASC, [SolutionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.ServiceAttributeExperienceLevel'
ALTER TABLE [ServiceAttributeExperienceLevel] ADD CONSTRAINT [PK_ServiceAttributeExperienceLevel] PRIMARY KEY ([UserID] ASC, [PositionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.ServiceAttributeLanguageLevel'
ALTER TABLE [ServiceAttributeLanguageLevel] ADD CONSTRAINT [PK_ServiceAttributeLanguageLevel] PRIMARY KEY ([UserID] ASC, [PositionID] ASC, [ServiceAttributeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.Solution'
ALTER TABLE [Solution] ADD CONSTRAINT [PK_Solution] PRIMARY KEY ([SolutionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.Specialization'
ALTER TABLE [Specialization] ADD CONSTRAINT [PK_Specialization] PRIMARY KEY ([SpecializationID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.UserListingSpecialization'
ALTER TABLE [UserListingSpecialization] ADD CONSTRAINT [PK_UserListingSpecialization] PRIMARY KEY ([UserID] ASC, [UserListingID] ASC, [SpecializationID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.VOCElement'
ALTER TABLE [VOCElement] ADD CONSTRAINT [PK_VOCElement] PRIMARY KEY ([VOCElementID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.VOCExperienceCategory'
ALTER TABLE [VOCExperienceCategory] ADD CONSTRAINT [PK_VOCExperienceCategory] PRIMARY KEY ([VOCExperienceCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.VOCFlag'
ALTER TABLE [VOCFlag] ADD CONSTRAINT [PK_VOCFlag] PRIMARY KEY ([VOCFlagID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.addresstype'
ALTER TABLE [addresstype] ADD CONSTRAINT [PK_addresstype] PRIMARY KEY ([AddressTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.alert'
ALTER TABLE [alert] ADD CONSTRAINT [PK_alert] PRIMARY KEY ([AlertID] ASC, [AlertTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.backgroundcheck'
ALTER TABLE [backgroundcheck] ADD CONSTRAINT [PK_backgroundcheck] PRIMARY KEY ([BackgroundCheckID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.cancellationpolicy'
ALTER TABLE [cancellationpolicy] ADD CONSTRAINT [PK_cancellationpolicy] PRIMARY KEY ([CancellationPolicyID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.country'
ALTER TABLE [country] ADD CONSTRAINT [PK_country] PRIMARY KEY ([CountryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.languagelevel'
ALTER TABLE [languagelevel] ADD CONSTRAINT [PK_languagelevel] PRIMARY KEY ([LanguageLevelID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.licensecertification'
ALTER TABLE [licensecertification] ADD CONSTRAINT [PK_licensecertification] PRIMARY KEY ([LicenseCertificationID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.messagethreadstatus'
ALTER TABLE [messagethreadstatus] ADD CONSTRAINT [PK_messagethreadstatus] PRIMARY KEY ([MessageThreadStatusID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.messagetype'
ALTER TABLE [messagetype] ADD CONSTRAINT [PK_messagetype] PRIMARY KEY ([MessageTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.positionpricingtype'
ALTER TABLE [positionpricingtype] ADD CONSTRAINT [PK_positionpricingtype] PRIMARY KEY ([PositionID] ASC, [PricingTypeID] ASC, [ClientTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.positionratings'
ALTER TABLE [positionratings] ADD CONSTRAINT [PK_positionratings] PRIMARY KEY ([PositionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.pricingtype'
ALTER TABLE [pricingtype] ADD CONSTRAINT [PK_pricingtype] PRIMARY KEY ([PricingTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.providerpaymentpreferencetype'
ALTER TABLE [providerpaymentpreferencetype] ADD CONSTRAINT [PK_providerpaymentpreferencetype] PRIMARY KEY ([ProviderPaymentPreferenceTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.serviceattribute'
ALTER TABLE [serviceattribute] ADD CONSTRAINT [PK_serviceattribute] PRIMARY KEY ([ServiceAttributeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.serviceattributecategory'
ALTER TABLE [serviceattributecategory] ADD CONSTRAINT [PK_serviceattributecategory] PRIMARY KEY ([ServiceAttributeCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.servicecategory'
ALTER TABLE [servicecategory] ADD CONSTRAINT [PK_servicecategory] PRIMARY KEY ([ServiceCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.servicecategoryposition'
ALTER TABLE [servicecategoryposition] ADD CONSTRAINT [PK_servicecategoryposition] PRIMARY KEY ([ServiceCategoryID] ASC, [PositionID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.servicecategorypositionattribute'
ALTER TABLE [servicecategorypositionattribute] ADD CONSTRAINT [PK_servicecategorypositionattribute] PRIMARY KEY ([PositionID] ASC, [ServiceAttributeCategoryID] ASC, [ServiceAttributeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.servicesubcategory'
ALTER TABLE [servicesubcategory] ADD CONSTRAINT [PK_servicesubcategory] PRIMARY KEY ([ServiceSubCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.taxentitytype'
ALTER TABLE [taxentitytype] ADD CONSTRAINT [PK_taxentitytype] PRIMARY KEY ([TaxEntityTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.tintype'
ALTER TABLE [tintype] ADD CONSTRAINT [PK_tintype] PRIMARY KEY ([TINTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.transporttype'
ALTER TABLE [transporttype] ADD CONSTRAINT [PK_transporttype] PRIMARY KEY ([TransportTypeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.userprofileserviceattributes'
ALTER TABLE [userprofileserviceattributes] ADD CONSTRAINT [PK_userprofileserviceattributes] PRIMARY KEY ([UserID] ASC, [PositionID] ASC, [ServiceAttributeCategoryID] ASC, [ServiceAttributeID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.verification'
ALTER TABLE [verification] ADD CONSTRAINT [PK_verification] PRIMARY KEY ([VerificationID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.verificationcategory'
ALTER TABLE [verificationcategory] ADD CONSTRAINT [PK_verificationcategory] PRIMARY KEY ([VerificationCategoryID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.verificationstatus'
ALTER TABLE [verificationstatus] ADD CONSTRAINT [PK_verificationstatus] PRIMARY KEY ([VerificationStatusID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.verificationstatus'
ALTER TABLE [verificationstatus] ADD CONSTRAINT [PK_verificationstatus] PRIMARY KEY ([VerificationStatusID] ASC)
EXEC fx__temp_util_drop_table_pk N'dbo.xJobTitleReviewRules'
ALTER TABLE [xJobTitleReviewRules] ADD CONSTRAINT [PK_xJobTitleReviewRules] PRIMARY KEY ([JobTitleID] ASC)

-- Special cas on [clienttype]: it replaces PK, index and RENAMES the PK column. FIRST: drop, THEN: rename, LAST: add again
EXEC fx__temp_util_drop_table_pk N'dbo.clienttype'
DROP INDEX clienttype.idx_clienttype
EXEC sp_RENAME 'clienttype.CllientTypeID' , 'ClientTypeID', 'COLUMN'
ALTER TABLE [clienttype] ADD CONSTRAINT [PK_clienttype] PRIMARY KEY ([ClientTypeID] ASC)
CREATE NONCLUSTERED INDEX [idx_clienttype] ON [dbo].[clienttype]([ClientTypeID] ASC, [CountryID] ASC)

/* STILL FOR REVIEW
ALTER TABLE [dbo].[positionpricingtype] ADD
-    CONSTRAINT [Fk_positionpricingtype] FOREIGN KEY ([PricingTypeID], [LanguageID], [CountryID]) REFERENCES [dbo].[pricingtype] ([PricingTypeID], [LanguageID], [CountryID]),
-    CONSTRAINT [Fk_positionpricingtype_0] FOREIGN KEY ([PositionID], [LanguageID], [CountryID]) REFERENCES [dbo].[positions] ([PositionID], [LanguageID], [CountryID]),
-    CONSTRAINT [Fk_positionpricingtype_1] FOREIGN KEY ([ClientTypeID], [LanguageID], [CountryID]) REFERENCES [dbo].[clienttype] ([CllientTypeID], [LanguageID], [CountryID])
+    CONSTRAINT [Fk_positionpricingtype] FOREIGN KEY ([PricingTypeID]) REFERENCES [dbo].[pricingtype] ([PricingTypeID]),
+    CONSTRAINT [Fk_positionpricingtype_0] FOREIGN KEY ([PositionID]) REFERENCES [dbo].[positions] ([PositionID]),
+    CONSTRAINT [Fk_positionpricingtype_1] FOREIGN KEY ([ClientTypeID]) REFERENCES [dbo].[clienttype] ([ClientTypeID])

 ALTER TABLE [dbo].[servicesubcategory] ADD
-    CONSTRAINT [FK_servicesubcategory_servicecategory] FOREIGN KEY ([ServiceCategoryID], [LanguageID], [CountryID]) REFERENCES [dbo].[servicecategory] ([ServiceCategoryID], [LanguageID], [CountryID])
+    CONSTRAINT [FK_servicesubcategory_servicecategory] FOREIGN KEY ([ServiceCategoryID]) REFERENCES [dbo].[servicecategory] ([ServiceCategoryID])

 ALTER TABLE [dbo].[userprofilepositions] ADD
     CONSTRAINT [FK_userprofilepositions_accountstatus] FOREIGN KEY ([StatusID]) REFERENCES [dbo].[accountstatus] ([AccountStatusID]),
-    CONSTRAINT [FK_userprofilepositions_positions] FOREIGN KEY ([PositionID], [LanguageID], [CountryID]) REFERENCES [dbo].[positions] ([PositionID], [LanguageID], [CountryID]),
+    CONSTRAINT [FK_userprofilepositions_positions] FOREIGN KEY ([PositionID]) REFERENCES [dbo].[positions] ([PositionID]),
     CONSTRAINT [FK_userprofilepositions_users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[users] ([UserID])

     
*/

-- Remove temporary utility
DROP PROCEDURE fx__temp_util_drop_table_pk

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
