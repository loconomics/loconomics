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
   (@AlertTypeID
   ,@AlertTypeName
   ,@AlertTypeDescription
   ,@CreatedDate
   ,@UpdatedDate
   ,@ModifiedBy
   ,@Active
   ,@LanguageID
   ,@CountryID
   ,@DisplayRank)