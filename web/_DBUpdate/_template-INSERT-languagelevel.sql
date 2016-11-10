INSERT INTO [languagelevel]
           ([LanguageLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[LanguageLevelName]
           ,[LanguageLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           (@LanguageLevelID
           ,@LanguageID
           ,@CountryID
           ,@LanguageLevelName
           ,@LanguageLevelDescription
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy)
