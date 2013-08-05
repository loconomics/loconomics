
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM serviceattributecategory 
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
       ,'Clinical Orientation'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'2'
       ,NULL
       ,NULL
       ,'False'
       ,'True'
       ,'False'
       ,'1'
       ,'193'
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
       ,'Services offered'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'True'
       ,'3'
       ,'14'
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
       ('3'
       ,'1'
       ,'1'
       ,'Haircut and styling services offered'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,'True'
       ,NULL
       ,'False'
       ,'False'
       ,'True'
       ,'1'
       ,'36'
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
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'0'
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
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'0'
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
       ,'Color services offered'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'True'
       ,'2'
       ,'36'
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
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'14'
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
       ,'Subjects I tutor'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'32'
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
       ,'Treatments offered'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'True'
       ,'3'
       ,'36'
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
       ,'Sport specific training'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'4'
       ,'61'
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
       ,'False'
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
       ,'Services I offer'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'22'
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
       ,'False'
       ,'1'
       ,'17'
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
       ,'Services I offer'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'23'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'Techniques I offer'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,'This provider is experienced in offering the following techniques.  You may request what techniques you''d like your provider to perform.'
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'106'
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
       ,'Languages I tutor'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'32'
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
       ,'False'
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
       ,'False'
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
       ,'Activites I specialize in'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'61'
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
       ,'False'
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
       ,'Training goals I specialize in'
       ,'11/2/2011 12:00:00 AM'
       ,'11/2/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'61'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ,'False'
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
       ('33'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'True'
       ,'1'
       ,'16'
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
       ('34'
       ,'1'
       ,'1'
       ,'Other information'
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'16'
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
       ('35'
       ,'1'
       ,'1'
       ,'Test preparation for'
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'32'
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
       ('36'
       ,'1'
       ,'1'
       ,'Availability'
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'27'
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
       ('37'
       ,'1'
       ,'1'
       ,'Consultative services I offer'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'True'
       ,'1'
       ,'61'
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
       ('38'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'32'
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
       ('40'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'28'
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
       ('41'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'186'
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
       ('42'
       ,'1'
       ,'1'
       ,'Area of specialization'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'193'
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
       ('43'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'179'
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
       ('44'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'9/19/2012 12:00:00 AM'
       ,'9/19/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'2'
       ,'179'
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
       ('45'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'True'
       ,'2'
       ,'76'
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
       ('46'
       ,'1'
       ,'1'
       ,'Sizes'
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'76'
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
       ('47'
       ,'1'
       ,'1'
       ,'I''ll bring with me'
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'True'
       ,'3'
       ,'76'
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
       ('48'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'106'
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
       ('49'
       ,'1'
       ,'1'
       ,'Client types'
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'True'
       ,'1'
       ,'106'
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
       ('50'
       ,'1'
       ,'1'
       ,'Materials I provide'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,'True'
       ,''
       ,'False'
       ,'False'
       ,'True'
       ,'1'
       ,'32'
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
       ('51'
       ,'1'
       ,'1'
       ,'Materials you''ll need'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,'True'
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'32'
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
       ('52'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'27'
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
       ('53'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'27'
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
       ('54'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'28'
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
       ('55'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'17'
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
       ('56'
       ,'1'
       ,'1'
       ,'Availability'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'28'
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
       ('57'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'17'
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
       ('58'
       ,'1'
       ,'1'
       ,'Age groups'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'je'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'16'
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
       ('59'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'16'
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
       ('60'
       ,'1'
       ,'1'
       ,'Age groups'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'je'
       ,'True'
       ,NULL
       ,NULL
       ,NULL
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'18'
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
       ('61'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'18'
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
       ('62'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'18'
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
       ('63'
       ,'1'
       ,'1'
       ,'Other information'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'18'
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
       ('64'
       ,'1'
       ,'1'
       ,'Other information'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'17'
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
       ('65'
       ,'1'
       ,'1'
       ,'Availability'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'17'
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
       ('66'
       ,'1'
       ,'1'
       ,'Tasks I perform'
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'267'
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
       ('67'
       ,'1'
       ,'1'
       ,'Client types'
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'32'
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
       ('68'
       ,'1'
       ,'1'
       ,'Client types'
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'61'
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
       ('69'
       ,'1'
       ,'1'
       ,'Client types'
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'193'
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
       ('70'
       ,'1'
       ,'1'
       ,'Client types'
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'True'
       ,'False'
       ,'1'
       ,'267'
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
       ('71'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'True'
       ,'2'
       ,'78'
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
       ('72'
       ,'1'
       ,'1'
       ,'Pet types'
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'True'
       ,'1'
       ,'78'
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
       ('73'
       ,'1'
       ,'1'
       ,'I''ll bring with me'
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'True'
       ,'3'
       ,'78'
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
       ('74'
       ,'1'
       ,'1'
       ,'Training methods used'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'271'
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
       ('75'
       ,'1'
       ,'1'
       ,'I specialize in'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'271'
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
       ('76'
       ,'1'
       ,'1'
       ,'Age groups'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'271'
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
       ('77'
       ,'1'
       ,'1'
       ,'Sizes'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'4'
       ,'271'
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
       ('78'
       ,'1'
       ,'1'
       ,'Photo shoot I specialize in'
       ,'1/7/2013 12:00:00 AM'
       ,'1/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'90'
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
       ('79'
       ,'1'
       ,'1'
       ,'Photo delivery options'
       ,'1/7/2013 12:00:00 AM'
       ,'1/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'90'
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
       ('80'
       ,'1'
       ,'1'
       ,'Videos I specialize in'
       ,'1/7/2013 12:00:00 AM'
       ,'1/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'198'
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
       ('81'
       ,'1'
       ,'1'
       ,'Services I specialize in'
       ,'1/7/2013 12:00:00 AM'
       ,'1/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'198'
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
       ('82'
       ,'1'
       ,'1'
       ,'Operating systems I specialize in'
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'257'
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
       ('83'
       ,'1'
       ,'1'
       ,'Devices I specialize in'
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'257'
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
       ('84'
       ,'1'
       ,'1'
       ,'Software programs I specialize in'
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'257'
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
       ('85'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'4'
       ,'257'
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
       ('86'
       ,'1'
       ,'1'
       ,'Medical conditions I specialize in'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'146'
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
       ('87'
       ,'1'
       ,'1'
       ,'Behavioral issues I specialize in'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'146'
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
       ('88'
       ,'1'
       ,'1'
       ,'Self improvement goals I specialize in'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'146'
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
       ('89'
       ,'1'
       ,'1'
       ,'Health benefits I specialize in'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'279'
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
       ('90'
       ,'1'
       ,'1'
       ,'Reiki traditions I teach '
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'279'
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
       ('91'
       ,'1'
       ,'1'
       ,'Event types'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'39'
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
       ('92'
       ,'1'
       ,'1'
       ,'Drinks I make'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'False'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'39'
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
       ('93'
       ,'1'
       ,'1'
       ,'Additional services'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'39'
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
       ('94'
       ,'1'
       ,'1'
       ,'Event types'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'151'
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
       ('95'
       ,'1'
       ,'1'
       ,'Services I offer'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'151'
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
       ('96'
       ,'1'
       ,'1'
       ,'Event types'
       ,'1/25/2013 12:00:00 AM'
       ,'1/25/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'251'
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
       ('97'
       ,'1'
       ,'1'
       ,'Music genres'
       ,'1/25/2013 12:00:00 AM'
       ,'1/25/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'251'
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
       ('98'
       ,'1'
       ,'1'
       ,'Equipment I can provide (additional fees may apply)'
       ,'1/25/2013 12:00:00 AM'
       ,'1/25/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'3'
       ,'251'
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
       ('99'
       ,'1'
       ,'1'
       ,'Health benefits I specialize in'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'283'
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
       ('100'
       ,'1'
       ,'1'
       ,'Reiki traditions I practice '
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'283'
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
       ('101'
       ,'1'
       ,'1'
       ,'Routine cleaning includes'
       ,'1/31/2013 12:00:00 AM'
       ,'1/31/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'2'
       ,'14'
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
       ('102'
       ,'1'
       ,'1'
       ,'Light cleaning includes'
       ,'1/31/2013 12:00:00 AM'
       ,'1/31/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'14'
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
       ('103'
       ,'1'
       ,'1'
       ,'Supplies I''ll provide'
       ,'1/31/2013 12:00:00 AM'
       ,'1/31/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'4'
       ,'14'
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
       ('104'
       ,'1'
       ,'1'
       ,'Yoga styles taught'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'278'
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
       ('105'
       ,'1'
       ,'1'
       ,'Event types'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'284'
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
       ('106'
       ,'1'
       ,'1'
       ,'Demographics I specialize in'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'284'
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
       ('107'
       ,'1'
       ,'1'
       ,'Disciplines I practice'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'185'
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
       ('108'
       ,'1'
       ,'1'
       ,'Specialized in treating'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'185'
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
       ('109'
       ,'1'
       ,'1'
       ,'Event types'
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'245'
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
       ('110'
       ,'1'
       ,'1'
       ,'Cuisine specialties'
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'245'
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
       ('111'
       ,'1'
       ,'1'
       ,'Upon request'
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'245'
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
       ('112'
       ,'1'
       ,'1'
       ,'Services included'
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'245'
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
       ('113'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'132'
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
       ('114'
       ,'1'
       ,'1'
       ,'Design styles'
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'132'
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
       ('115'
       ,'1'
       ,'1'
       ,'Modalities practiced'
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'287'
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
       ('116'
       ,'1'
       ,'1'
       ,'Specialized in treating'
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'False'
       ,'False'
       ,'False'
       ,'1'
       ,'287'
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
       ('117'
       ,'1'
       ,'1'
       ,'Coaching services offered'
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'288'
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
       ('118'
       ,'1'
       ,'1'
       ,'Consulting services offered'
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'289'
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
       ('119'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'82'
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
       ('120'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'40'
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
       ('121'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'44'
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
       ('122'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'290'
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
       ('123'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'291'
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
       ('124'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'53'
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
       ('125'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'210'
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
       ('126'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'281'
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
       ('127'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'282'
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
       ('128'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'92'
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
       ('129'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'285'
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
       ('130'
       ,'1'
       ,'1'
       ,'Event types'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'72'
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
       ('131'
       ,'1'
       ,'1'
       ,'Cuisine types'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'72'
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
       ('132'
       ,'1'
       ,'1'
       ,'Services offered'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'222'
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
       ('133'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'275'
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
       ('134'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'128'
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
       ('135'
       ,'1'
       ,'1'
       ,'Specialized in'
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,NULL
       ,NULL
       ,''
       ,'True'
       ,'False'
       ,'False'
       ,'1'
       ,'286'
       ,'False')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
