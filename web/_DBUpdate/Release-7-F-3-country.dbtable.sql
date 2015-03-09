
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM country 
INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('1'
    ,'1'
    ,'United States'
    ,'USA'
    ,'US'
    ,'1'
    ,'4/14/2012 12:00:00 AM'
    ,'4/14/2012 12:00:00 AM'
    ,'jd'
    ,'True')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('1'
    ,'2'
    ,'Estados Unidos'
    ,'USA'
    ,'US'
    ,'1'
    ,'4/14/2012 12:00:00 AM'
    ,'4/14/2012 12:00:00 AM'
    ,'jd'
    ,'True')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('2'
    ,'1'
    ,'Spain'
    ,'ESP'
    ,'ES'
    ,'34'
    ,'4/14/2012 12:00:00 AM'
    ,'4/14/2012 12:00:00 AM'
    ,'jd'
    ,'True')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active])
VALUES
    ('2'
    ,'2'
    ,'España'
    ,'ESP'
    ,'ES'
    ,'34'
    ,'4/14/2012 12:00:00 AM'
    ,'4/14/2012 12:00:00 AM'
    ,'jd'
    ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
