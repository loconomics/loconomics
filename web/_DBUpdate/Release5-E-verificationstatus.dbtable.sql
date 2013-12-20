
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM verificationstatus 
INSERT INTO [verificationstatus]
   ([VerificationStatusID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationStatusName]
   ,[VerificationStatusDisplayDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Confirmed'
   ,'Verification confirmed and up to date'
   ,'5/29/2012 12:00:00 AM'
   ,'5/29/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [verificationstatus]
   ([VerificationStatusID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationStatusName]
   ,[VerificationStatusDisplayDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Pending'
   ,'Verification requested or in course'
   ,'5/29/2012 12:00:00 AM'
   ,'5/29/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [verificationstatus]
   ([VerificationStatusID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationStatusName]
   ,[VerificationStatusDisplayDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Revoked'
   ,'Verification previusly confirmed but currently revoked (user changes some verified data that needs reconfirmation...)'
   ,'5/29/2012 12:00:00 AM'
   ,'5/29/2012 12:00:00 AM'
   ,'il'
   ,'True')
INSERT INTO [verificationstatus]
   ([VerificationStatusID]
   ,[LanguageID]
   ,[CountryID]
   ,[VerificationStatusName]
   ,[VerificationStatusDisplayDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Obsolete'
   ,'Verification previously confirmed but need to be re-confirmed after some time or because changes in verification process'
   ,'5/29/2012 12:00:00 AM'
   ,'5/29/2012 12:00:00 AM'
   ,'il'
   ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
