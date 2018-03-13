INSERT INTO [positions]
           ([PositionID]
           ,[LanguageID]
           ,[CountryID]
           ,[PositionSingular]
           ,[PositionPlural]
           ,[Aliases]
           ,[PositionDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[GovID]
           ,[GovPosition]
           ,[GovPositionDescription]
           ,[Active]
           ,[DisplayRank]
           ,[PositionSearchDescription]
           ,[AttributesComplete]
           ,[StarRatingsComplete]
           ,[PricingTypeComplete]
           ,[EnteredByUserID]
           ,[Approved]
           ,[AddGratuity]
           ,[HIPAA]
           ,[SendReviewReminderToClient]
           ,[CanBeRemote]
           ,[SuppressReviewOfClient])
     VALUES
           (-2
           ,1
           ,1
           ,'User Generated'
           ,'User Generated'
           ,''
           ,''
           ,'2018-03-02 20:36:00'
           ,'2018-03-02 20:36:00'
           ,'il'
           ,null
           ,null
           ,null
           ,0
           ,null
           ,null
           ,0
           ,0
           ,0
           ,null
           ,1
           ,0
           ,1
           ,0
           ,1
           ,0)
;
INSERT INTO dbo.positionpricingtype (PositionID,PricingTypeID,ClientTypeID,LanguageID,CountryID,CreatedDate,UpdatedDate,ModifiedBy,Active) VALUES (-2,5,1,1,1,'2018-03-05 11:05:00.000','2018-03-05 11:05:00.000','jd',1);
INSERT INTO dbo.positionpricingtype (PositionID,PricingTypeID,ClientTypeID,LanguageID,CountryID,CreatedDate,UpdatedDate,ModifiedBy,Active) VALUES (-2,6,1,1,1,'2018-03-05 11:05:00.000','2018-03-05 11:05:00.000','jd',1);
