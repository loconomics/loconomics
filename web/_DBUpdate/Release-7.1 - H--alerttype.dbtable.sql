
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM alerttype 
INSERT INTO [alerttype]
   ([AlertTypeID]
   ,[AlertTypeName]
   ,[AlertTypeDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID]
   ,[CountryID]
   ,[DisplayRank])
VALUES
   ('1'
   ,'Announcements'
   ,'We want you in the know on all that''s happening.'
   ,'8/11/2012 12:00:00 AM'
   ,'8/11/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'1'
   ,'4')

INSERT INTO [alerttype]
   ([AlertTypeID]
   ,[AlertTypeName]
   ,[AlertTypeDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID]
   ,[CountryID]
   ,[DisplayRank])
VALUES
   ('2'
   ,'Activate'
   ,'Start things off right! You''ll need to complete these alerts before your profile is active and viewable to others.'
   ,'8/11/2012 12:00:00 AM'
   ,'8/11/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'1'
   ,'1')

INSERT INTO [alerttype]
   ([AlertTypeID]
   ,[AlertTypeName]
   ,[AlertTypeDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID]
   ,[CountryID]
   ,[DisplayRank])
VALUES
   ('3'
   ,'Enhance'
   ,'Show ‘em what you’ve got. These are optional but highly encouraged.'
   ,'8/11/2012 12:00:00 AM'
   ,'8/11/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'1'
   ,'2')

INSERT INTO [alerttype]
   ([AlertTypeID]
   ,[AlertTypeName]
   ,[AlertTypeDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID]
   ,[CountryID]
   ,[DisplayRank])
VALUES
   ('4'
   ,'Get paid'
   ,'Very necessary. You''ll need to complete these before you can accept a booking.'
   ,'8/11/2012 12:00:00 AM'
   ,'8/11/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'1'
   ,'3')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
