
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM VOCExperienceCategory 
INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Feedback'
   ,'Ideas solicited in-app/site from users on how to improve the product and services'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Support Request'
   ,'A request from users for support'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Loconomics Freelancer NPS Survey'
   ,'Loconomics NPS feedback solicited from Freelancers'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Loconomics Freelancer CSAT Survey'
   ,'Loconomics Customer Satisfaction feedback solicited from Freelancers'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Loconomics Client NPS Survey'
   ,'Loconomics NPS feedback solicited from Clients'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Loconomics Client CSAT Survey'
   ,'Loconomics Customer Satisfaction feedback solicited from Clients'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCExperienceCategory]
   ([VOCExperienceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCExperienceCategoryName]
   ,[VOCExperienceCategoryDescription]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Freelancer NPS Survey'
   ,'Freelancer NPS feedback solicited from Clients (about specific freelancers)'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
