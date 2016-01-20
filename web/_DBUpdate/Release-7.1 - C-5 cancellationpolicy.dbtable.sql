
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM cancellationpolicy 
INSERT INTO [cancellationpolicy]
           ([CancellationPolicyID]
           ,[LanguageID]
           ,[CountryID]
           ,[CancellationPolicyName]
           ,[CancellationPolicyDescription]
           ,[HoursRequired]
           ,[CancellationFeeAfter]
           ,[CancellationFeeBefore]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('1'
           ,'1'
           ,'1'
           ,'Strict'
           ,'50% refund up to 5 days before booking, except fees'
           ,'120'
           ,'1.00'
           ,'0.50'
           ,'10/12/2012 12:00:00 AM'
           ,'10/12/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [cancellationpolicy]
           ([CancellationPolicyID]
           ,[LanguageID]
           ,[CountryID]
           ,[CancellationPolicyName]
           ,[CancellationPolicyDescription]
           ,[HoursRequired]
           ,[CancellationFeeAfter]
           ,[CancellationFeeBefore]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('2'
           ,'1'
           ,'1'
           ,'Moderate'
           ,'100% refund up to 24 hours before booking, except fees.  No refund for under 24 hours and no-shows.'
           ,'24'
           ,'1.00'
           ,'0.00'
           ,'10/12/2012 12:00:00 AM'
           ,'10/12/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [cancellationpolicy]
           ([CancellationPolicyID]
           ,[LanguageID]
           ,[CountryID]
           ,[CancellationPolicyName]
           ,[CancellationPolicyDescription]
           ,[HoursRequired]
           ,[CancellationFeeAfter]
           ,[CancellationFeeBefore]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('3'
           ,'1'
           ,'1'
           ,'Flexible'
           ,'100% refund up to 24 hours before booking, except fees.  50% refund for under 24 hours and no-shows.'
           ,'24'
           ,'0.50'
           ,'0.00'
           ,'10/12/2012 12:00:00 AM'
           ,'10/12/2012 12:00:00 AM'
           ,'jd'
           ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
