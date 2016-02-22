
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM backgroundcheck 
INSERT INTO [backgroundcheck]
   ([BackgroundCheckID]
   ,[LanguageID]
   ,[CountryID]
   ,[BackgroundCheckName]
   ,[BackgroundCheckDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[BackGroundCheckPrice])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Database Search	 '
   ,'- Widescreen Plus National Criminal Search (g)		 - National Sex Offender Search	'
   ,'7/2/2012 12:00:00 AM'
   ,'7/2/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'14.90')

INSERT INTO [backgroundcheck]
   ([BackgroundCheckID]
   ,[LanguageID]
   ,[CountryID]
   ,[BackgroundCheckName]
   ,[BackgroundCheckDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[BackGroundCheckPrice])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Basic Criminal	'
   ,'- Criminal Felony & Misdemeanor - 7 Years, all counties as revealed by SSN Trace (a)			 - Widescreen Plus National Criminal Search (g)				 - SSN Trace - per applicant				 - SSN Validation	'
   ,'7/2/2012 12:00:00 AM'
   ,'7/2/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'35.00')

INSERT INTO [backgroundcheck]
   ([BackgroundCheckID]
   ,[LanguageID]
   ,[CountryID]
   ,[BackgroundCheckName]
   ,[BackgroundCheckDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[BackGroundCheckPrice])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Risk Adverse '
   ,'- Criminal Felony & Misdemeanor - 7 years (a) - Unlimited # of counties as revealed by SSN Trace - Widescreen Plus (g) - National Sex Offender Search - SSN Trace  - SSN Validation '
   ,'7/2/2012 12:00:00 AM'
   ,'7/2/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'41.42')

INSERT INTO [backgroundcheck]
   ([BackgroundCheckID]
   ,[LanguageID]
   ,[CountryID]
   ,[BackgroundCheckName]
   ,[BackgroundCheckDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[BackGroundCheckPrice])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Healthcare Check   '
   ,'- Criminal Felony & Misdemeanor - 7 years (a) - Unlimited # of counties as revealed by SSN Trace - Widescreen Plus (g) - National Sex Offender Search - SSN Trace  - SSN Validation - Healthcare Sanctions Check - Federal plus All States (FACIS Level 3)		'
   ,'7/2/2012 12:00:00 AM'
   ,'7/2/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'51.42')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
