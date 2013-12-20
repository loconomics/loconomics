
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM verificationcategory 
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Personal information'
   ,'Loconomics uses the latest technologies to do everything we can to verify identities of service providers.'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'10')
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Professional credentials'
   ,'Loconomics makes every effort to verify licenses and certifications of service providers.'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'40')
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Social media presence'
   ,'Connecting to existing social media sites lets us know that service providers are real people. '
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'30')
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Education'
   ,'Verifying education credentials is difficult and expensive.  We are working to add this feature in the future.  In the meantime, feel free to ask providers for documentation.'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'100')
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Background information'
   ,''
   ,'7/13/2012 12:00:00 AM'
   ,'7/13/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'20')
INSERT INTO [verificationcategory]
   ([VerificationCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationCategoryName]
   ,[VerificationCategoryDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[RankPosition])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Other'
   ,'We do not verify this information at this time.'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'110')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
