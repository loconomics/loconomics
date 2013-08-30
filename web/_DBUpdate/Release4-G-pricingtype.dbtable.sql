
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM pricingtype 
SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Hourly'
   ,'11/16/2011 12:00:00 AM'
   ,'11/16/2011 12:00:00 AM'
   ,'mfontan'
   ,'True'
   ,'70')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Custom'
   ,'11/16/2011 12:00:00 AM'
   ,'11/16/2011 12:00:00 AM'
   ,'mfontan'
   ,'False'
   ,'100')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Package'
   ,'11/16/2011 12:00:00 AM'
   ,'11/16/2011 12:00:00 AM'
   ,'mfontan'
   ,'True'
   ,'30')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Estimate'
   ,'3/26/2012 12:00:00 AM'
   ,'3/26/2012 12:00:00 AM'
   ,'jdanielson'
   ,'True'
   ,'40')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Consultation'
   ,'3/12/2013 12:00:00 AM'
   ,'3/12/2013 12:00:00 AM'
   ,'jdanielson'
   ,'True'
   ,'10')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Service'
   ,'3/12/2013 12:00:00 AM'
   ,'3/12/2013 12:00:00 AM'
   ,'jdanielson'
   ,'True'
   ,'20')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Add-on Service'
   ,'3/12/2013 12:00:00 AM'
   ,'3/12/2013 12:00:00 AM'
   ,'jdanielson'
   ,'True'
   ,'90')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Class'
   ,'3/12/2013 12:00:00 AM'
   ,'3/12/2013 12:00:00 AM'
   ,'jdanielson'
   ,'False'
   ,'60')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('9'
   ,'1'
   ,'1'
   ,'Light Cleaning Service'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('10'
   ,'1'
   ,'1'
   ,'Routine Cleaning Service'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('11'
   ,'1'
   ,'1'
   ,'Deep Cleaning Service'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('12'
   ,'1'
   ,'1'
   ,'Package With Frequency - Visits'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('13'
   ,'1'
   ,'1'
   ,'Package With Frequency - Walks'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO

SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   ('15'
   ,'1'
   ,'1'
   ,'Interview'
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'80')
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
