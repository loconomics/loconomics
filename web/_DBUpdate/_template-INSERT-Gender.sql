INSERT INTO [Gender]
           ([GenderID]
           ,[LanguageID]
           ,[CountryID]
           ,[GenderSingular]
           ,[GenderPlural]
           ,[SubjectPronoun]
           ,[ObjectPronoun]
           ,[PossesivePronoun])
     VALUES
           (@GenderID
           ,@LanguageID
           ,@CountryID
           ,@GenderSingular
           ,@GenderPlural
           ,@SubjectPronoun
           ,@ObjectPronoun
           ,@PossesivePronoun)
