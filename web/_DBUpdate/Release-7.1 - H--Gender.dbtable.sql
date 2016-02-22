
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM Gender 
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
           ('-1'
           ,'1'
           ,'1'
           ,'Default'
           ,'Default'
           ,'they'
           ,'them'
           ,'their')

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
           ('-1'
           ,'1'
           ,'2'
           ,'Default'
           ,'Default'
           ,'they'
           ,'them'
           ,'their')

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
           ('1'
           ,'1'
           ,'1'
           ,'Female'
           ,'Women'
           ,'she'
           ,'her'
           ,'her')

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
           ('1'
           ,'1'
           ,'2'
           ,'Female'
           ,'Women'
           ,'she'
           ,'her'
           ,'her')

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
           ('1'
           ,'2'
           ,'1'
           ,'Mujer'
           ,'Mujeres'
           ,NULL
           ,NULL
           ,NULL)

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
           ('1'
           ,'2'
           ,'2'
           ,'Mujer'
           ,'Mujeres'
           ,NULL
           ,NULL
           ,NULL)

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
           ('2'
           ,'1'
           ,'1'
           ,'Male'
           ,'Men'
           ,'he'
           ,'him'
           ,'his')

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
           ('2'
           ,'1'
           ,'2'
           ,'Male'
           ,'Men'
           ,'he'
           ,'him'
           ,'his')

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
           ('2'
           ,'2'
           ,'1'
           ,'Hombre'
           ,'Hombres'
           ,NULL
           ,NULL
           ,NULL)

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
           ('2'
           ,'2'
           ,'2'
           ,'Hombre'
           ,'Hombres'
           ,NULL
           ,NULL
           ,NULL)


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
