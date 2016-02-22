
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM accountstatus 
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('0'
   ,'Cancelled'
   ,'User cancelled account'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'Active'
   ,'User''s account is active'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'Inactive'
   ,'User''s account is inactive'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'Suspended'
   ,'Loconomics suspended user''s account'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'Unauthorized'
   ,'User''s account has been reported unauthorized'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'Revoked'
   ,'User''s account has been revoked'
   ,'8/14/2012 12:00:00 AM'
   ,'8/14/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'Freelancer''s Client'
   ,'User created by a Freelancer as a client while the client has not enabled its account for the marketplace (no TOU accepted)'
   ,'4/11/2015 12:00:00 AM'
   ,'4/11/2015 12:00:00 AM'
   ,'il'
   ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
