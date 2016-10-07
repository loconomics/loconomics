INSERT INTO [ExperienceLevel]
           ([ExperienceLevelID]
           ,[LanguageID]
           ,[CountryID]
           ,[ExperienceLevelName]
           ,[ExperienceLevelDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy])
     VALUES
           (@ExperienceLevelID
           ,@LanguageID
           ,@CountryID
           ,@ExperienceLevelName
           ,@ExperienceLevelDescription
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy)
