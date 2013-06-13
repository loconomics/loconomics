
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM serviceattributecategory 
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
       ('1'
       ,'1'
       ,'1'
       ,'Experience'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'2'
       ,NULL
       ,NULL
       ,'False'
       ,'True'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('2'
       ,'1'
       ,'1'
       ,'Services routinely included'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'True'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'True')
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
       ('3'
       ,'1'
       ,'1'
       ,'Services upon request (fees may apply)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,'True'
       ,NULL
       ,'True'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'True')
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
       ('4'
       ,'1'
       ,'1'
       ,'Experience level'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'-1'
       ,NULL
       ,'False')
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
       ('5'
       ,'1'
       ,'1'
       ,'Languages spoken (level)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'True'
       ,NULL
       ,'3'
       ,NULL
       ,'False')
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
       ('6'
       ,'1'
       ,'1'
       ,'Minimum time'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('7'
       ,'1'
       ,'1'
       ,'Client types'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'True'
       ,NULL
       ,'4'
       ,NULL
       ,'False')
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
       ('8'
       ,'1'
       ,'1'
       ,'Subjects tutored (experience)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('9'
       ,'1'
       ,'1'
       ,'Education'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('10'
       ,'1'
       ,'1'
       ,'Meeting place(s)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('11'
       ,'1'
       ,'1'
       ,'Vehicle size'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('12'
       ,'1'
       ,'1'
       ,'Education'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('13'
       ,'1'
       ,'1'
       ,'Age groups'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('14'
       ,'1'
       ,'1'
       ,'Sports (experience)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('15'
       ,'1'
       ,'1'
       ,'Country expertise (days travelled)'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('16'
       ,'1'
       ,'1'
       ,'Materials included'
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('17'
       ,'1'
       ,'1'
       ,'Materials upon request (fees may apply)'
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('18'
       ,'1'
       ,'1'
       ,'Safety'
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('19'
       ,'1'
       ,'1'
       ,'Techniques offered'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,'Techniques offered description'
       ,'False'
       ,'False'
       ,'True'
       ,'1'
       ,NULL
       ,'False')
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
       ('20'
       ,'1'
       ,'1'
       ,'Languages tutored'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('21'
       ,'1'
       ,'1'
       ,'Equipment provided'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('22'
       ,'1'
       ,'1'
       ,'Equipment needed'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('23'
       ,'1'
       ,'1'
       ,'Activities offered'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('24'
       ,'1'
       ,'1'
       ,'Certifications'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('25'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('26'
       ,'1'
       ,'1'
       ,'Surfaces'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('27'
       ,'1'
       ,'1'
       ,'Event types'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('28'
       ,'1'
       ,'1'
       ,'Cuisine specialties'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('29'
       ,'1'
       ,'1'
       ,'Genres'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('30'
       ,'1'
       ,'1'
       ,'Instruments played'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('31'
       ,'1'
       ,'1'
       ,'Tasks performed'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
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
       ('32'
       ,'1'
       ,'1'
       ,'Clothing types'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,NULL
       ,'1'
       ,NULL
       ,'False')
ALTER TABLE serviceattributecategory WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE serviceattributecategory ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'