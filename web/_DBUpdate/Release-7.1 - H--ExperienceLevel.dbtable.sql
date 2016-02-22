
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM ExperienceLevel 
INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('1'
           ,'1'
           ,'1'
           ,'I''m new to this!'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('2'
           ,'1'
           ,'1'
           ,'Less than 1 year'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('3'
           ,'1'
           ,'1'
           ,'1-2 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('4'
           ,'1'
           ,'1'
           ,'2-3 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('5'
           ,'1'
           ,'1'
           ,'3-4 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('6'
           ,'1'
           ,'1'
           ,'4-5 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('7'
           ,'1'
           ,'1'
           ,'5-6 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('8'
           ,'1'
           ,'1'
           ,'6-7 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('9'
           ,'1'
           ,'1'
           ,'8-10 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('10'
           ,'1'
           ,'1'
           ,'11-15 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('11'
           ,'1'
           ,'1'
           ,'16-20 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('12'
           ,'1'
           ,'1'
           ,'21-25 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('13'
           ,'1'
           ,'1'
           ,'26-30 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('14'
           ,'1'
           ,'1'
           ,'31-35 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('15'
           ,'1'
           ,'1'
           ,'36-40 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('16'
           ,'1'
           ,'1'
           ,'41-45 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')

INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           ('17'
           ,'1'
           ,'1'
           ,'46-50 years'
           ,NULL
           ,'6/10/2012 10:27:50 AM'
           ,'6/10/2012 10:27:50 AM'
           ,'sys')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
