
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM positionlicense 
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('14'
   ,'2'
   ,'1'
   ,'1'
   ,'True'
   ,'6/25/2012 12:00:00 AM'
   ,'6/25/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'6/25/2012 12:00:00 AM'
   ,'6/25/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('19'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('19'
   ,'2'
   ,'1'
   ,'1'
   ,'True'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('185'
   ,'3'
   ,'1'
   ,'1'
   ,'True'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('193'
   ,'15'
   ,'1'
   ,'1'
   ,'True'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [positionlicense]
   ([PositionID]
   ,[LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[Required]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('194'
   ,'15'
   ,'1'
   ,'1'
   ,'True'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
ALTER TABLE positionlicense WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE positionlicense ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'