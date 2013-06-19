
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM positionbackgroundcheck 
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('39'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'2/27/2013 12:00:00 AM'
   ,'2/27/2013 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('106'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'6/21/2012 12:00:00 AM'
   ,'6/21/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('185'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('106'
   ,'2'
   ,'1'
   ,'1'
   ,'False'
   ,'6/21/2012 12:00:00 AM'
   ,'6/21/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('16'
   ,'4'
   ,'1'
   ,'1'
   ,'False'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('17'
   ,'4'
   ,'1'
   ,'1'
   ,'False'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('18'
   ,'4'
   ,'1'
   ,'1'
   ,'False'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('27'
   ,'4'
   ,'1'
   ,'1'
   ,'False'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionbackgroundcheck]
   ([PositionID]
   ,[BackgroundCheckID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('28'
   ,'4'
   ,'1'
   ,'1'
   ,'False'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
