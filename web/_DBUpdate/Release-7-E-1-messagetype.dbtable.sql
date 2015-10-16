
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM messagetype 
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('1'
    ,'1'
    ,'1'
    ,'Customer inquiry'
    ,'Inquiry from a customer to a provider'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('2'
    ,'1'
    ,'1'
    ,'Copy of customer inquiry'
    ,'Copy of customer''s message sent to customer'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('3'
    ,'1'
    ,'1'
    ,'Provider response to inquiry'
    ,'Provider sends a response to the customer'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('4'
    ,'1'
    ,'1'
    ,'Customer booking request'
    ,'Booking request from a customer sent to a provider'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('5'
    ,'1'
    ,'1'
    ,'Copy of customer booking request'
    ,'copy sent to customer'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('6'
    ,'1'
    ,'1'
    ,'Booking Request Customer Confirmation'
    ,'confirmation sent by customer to provider'
    ,'4/25/2012 12:00:00 AM'
    ,'5/18/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('7'
    ,'1'
    ,'1'
    ,'Booking Request Provider Confirmation'
    ,'confirmation sent by provider to customer'
    ,'4/25/2012 12:00:00 AM'
    ,'5/18/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('8'
    ,'1'
    ,'1'
    ,'Customer marketing'
    ,'marketing e-mail'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('9'
    ,'1'
    ,'1'
    ,'Customer dispute'
    ,'dispute from customer'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('10'
    ,'1'
    ,'1'
    ,'Provider resolution'
    ,'resolution from provider'
    ,'4/25/2012 12:00:00 AM'
    ,'4/25/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('12'
    ,'1'
    ,'1'
    ,'Pricing adjustment to provider'
    ,'Adjustment needed to price'
    ,'4/26/2012 12:00:00 AM'
    ,'4/26/2012 12:00:00 AM'
    ,'jd'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('13'
    ,'1'
    ,'1'
    ,'Booking Request Provider Declined'
    ,'Declined by provider'
    ,'5/16/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('14'
    ,'1'
    ,'1'
    ,'Booking Request Customer Cancelled'
    ,'Cancelled by customer'
    ,'5/16/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('15'
    ,'1'
    ,'1'
    ,'Booking Provider Update'
    ,'By provider'
    ,'5/16/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('16'
    ,'1'
    ,'1'
    ,'Booking Customer Update'
    ,'By customer'
    ,'5/16/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('17'
    ,'1'
    ,'1'
    ,'Provider booking review'
    ,'Booking review by provider sent to customer'
    ,'4/25/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('18'
    ,'1'
    ,'1'
    ,'Customer booking review'
    ,'Booking review by customer about provider service'
    ,'5/16/2012 12:00:00 AM'
    ,'5/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('19'
    ,'1'
    ,'1'
    ,'Booking Update'
    ,'By sys-admins'
    ,'7/16/2012 12:00:00 AM'
    ,'7/16/2012 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('20'
    ,'1'
    ,'1'
    ,'Service performed'
    ,'Service performed'
    ,'7/7/2014 12:00:00 AM'
    ,'7/7/2014 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('21'
    ,'1'
    ,'1'
    ,'Booking complete'
    ,'Service performed and payed, closed'
    ,'7/7/2014 12:00:00 AM'
    ,'7/7/2014 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('22'
    ,'1'
    ,'1'
    ,'Freelancer inquiry'
    ,'Inquiry from a freelancerr to a customer'
    ,'3/6/2015 12:00:00 AM'
    ,'3/6/2015 12:00:00 AM'
    ,'iago'
    ,'True')
INSERT INTO [dbo].[messagetype]
    ([MessageTypeID]
    ,[LanguageID]
    ,[CountryID]
    ,[MessageTypeName]
    ,[MessageTypeDescription]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('23'
    ,'1'
    ,'1'
    ,'Customer response to inquiry'
    ,'Customer sends a response to the freelancer'
    ,'3/6/2015 12:00:00 AM'
    ,'3/6/2015 12:00:00 AM'
    ,'iago'
    ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
