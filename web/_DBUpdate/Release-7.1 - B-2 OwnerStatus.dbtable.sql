
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM OwnerStatus 
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('1'
           ,'1'
           ,'1'
           ,'In trial'
           ,'Owner has completed two bookings and activated their marketplace profile but is still in trial so has not paid their first payment.'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('2'
           ,'1'
           ,'1'
           ,'Active'
           ,'Owner has completed two bookings, marketplace profile active, and payment being collected'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('3'
           ,'1'
           ,'1'
           ,'Inactive'
           ,'Owner has at one time completed all required steps to becoming an owner but has turned off their marketplace profile'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('4'
           ,'1'
           ,'1'
           ,'In default'
           ,'Owner is past due on their payment.'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('5'
           ,'1'
           ,'1'
           ,'Cancelled'
           ,'Owner has cancelled their account'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')
INSERT INTO [OwnerStatus]
           ([OwnserStatusID]
           ,[LanguageID]
           ,[CountryID]
           ,[OwnerStatusName]
           ,[OwnerStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[Active]
           ,[UpdatedBy])
     VALUES
           ('6'
           ,'1'
           ,'1'
           ,'Suspended'
           ,'Owner has been suspended'
           ,'12/1/2015 12:00:00 AM'
           ,'12/1/2015 12:00:00 AM'
           ,'True'
           ,'jd')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
