INSERT INTO [language]
           ([LanguageID]
           ,[CountryID]
           ,[LanguageName]
           ,[Active]
           ,[LanguageCode]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           (@LanguageID
           ,@CountryID
           ,@LanguageName
           ,@Active
           ,@LanguageCode
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy)
