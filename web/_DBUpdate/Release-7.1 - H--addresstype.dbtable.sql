
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM addresstype 
INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Home'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'True'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Office'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Studio'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Gym'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'School'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'College'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Apartment'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Dorm'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('9'
   ,'1'
   ,'1'
   ,'Coffee shop'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('10'
   ,'1'
   ,'1'
   ,'Meeting point'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('11'
   ,'1'
   ,'1'
   ,'Salon'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('12'
   ,'1'
   ,'1'
   ,'Other'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'False'
   ,'True')

INSERT INTO [addresstype]
   ([AddressTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AddressType]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[UniquePerUser]
   ,[Selectable])
VALUES
   ('13'
   ,'1'
   ,'1'
   ,'Billing'
   ,'8/1/2012 12:00:00 AM'
   ,'8/1/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'True'
   ,'False')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
