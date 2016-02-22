INSERT INTO [PricingGroups]
           ([PricingGroupID]
           ,[InternalGroupName]
           ,[SelectionTitle]
           ,[SummaryTitle]
           ,[DynamicSummaryTitle]
           ,[LanguageID]
           ,[CountryID])
     VALUES
           (@PricingGroupID
           ,@InternalGroupName
           ,@SelectionTitle
           ,@SummaryTitle
           ,@DynamicSummaryTitle
           ,@LanguageID
           ,@CountryID)
