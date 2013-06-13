
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM positionpricingtype 
INSERT INTO [positionpricingtype]
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
   ('106'
   ,'3'
   ,'1'
   ,'1'
   ,'1'
   ,'7/19/2012 12:00:00 AM'
   ,'7/19/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('106'
   ,'7'
   ,'1'
   ,'1'
   ,'1'
   ,'3/20/2013 12:00:00 AM'
   ,'3/20/2013 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('106'
   ,'4'
   ,'1'
   ,'1'
   ,'1'
   ,'3/21/2013 12:00:00 AM'
   ,'3/21/2013 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('106'
   ,'5'
   ,'1'
   ,'1'
   ,'1'
   ,'3/21/2013 12:00:00 AM'
   ,'3/21/2013 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('106'
   ,'6'
   ,'1'
   ,'1'
   ,'1'
   ,'3/21/2013 12:00:00 AM'
   ,'3/21/2013 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('15'
   ,'9'
   ,'1'
   ,'1'
   ,'1'
   ,'6/5/2013 12:00:00 AM'
   ,'6/5/2013 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('14'
   ,'2'
   ,'1'
   ,'1'
   ,'1'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('32'
   ,'1'
   ,'1'
   ,'1'
   ,'1'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionpricingtype]
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
   ('36'
   ,'3'
   ,'1'
   ,'1'
   ,'1'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True')
ALTER TABLE positionpricingtype WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE positionpricingtype ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'