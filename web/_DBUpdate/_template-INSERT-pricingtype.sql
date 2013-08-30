SET IDENTITY_INSERT [pricingtype] ON
GO
INSERT INTO [pricingtype]
   ([PricingTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[DisplayRank])
VALUES
   (@PricingTypeID
   ,@LanguageID
   ,@CountryID
   ,@Description
   ,@CreatedDate
   ,@UpdatedDate
   ,@ModifiedBy
   ,@Active
   ,@DisplayRank)
GO
SET IDENTITY_INSERT [pricingtype] OFF
GO
