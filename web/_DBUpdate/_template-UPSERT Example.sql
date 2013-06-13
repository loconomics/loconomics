/** UPSERT Example using serviceattribute table, please adapt to other tables **/

/**
  Helpful ressources for single table and multi table changes,
  Identity reseed and temporarly disable contraints (foreign keys, triggers).
    http://stackoverflow.com/questions/159038/can-foreign-key-constraints-be-temporarily-disabled-using-t-sql
    http://stackoverflow.com/questions/155246/how-do-you-truncate-all-tables-in-a-database-using-tsql#156813
 **/

UPDATE [serviceattribute] WITH (serializable) SET
	[SourceID] = @SourceID
	,[Name] = @Name
	,[ServiceAttributeDescription] = @ServiceAttributeDescription
	,[CreateDate] = @CreateDate
	,[UpdatedDate] = @UpdatedDate
	,[ModifiedBy] = @ModifiedBy
	,[Active] = @Active
	,[DisplayRank] = @DisplayRank
	,[PositionReference] = @PositionReference
WHERE
	[ServiceAttributeID] = @ServiceAttributeID
     AND
    [CountryID] = @CountryID
     AND
	[SourceID] = @SourceID
IF @@rowcount = 0
BEGIN
	INSERT INTO [serviceattribute]
           ([ServiceAttributeID]
           ,[LanguageID]
           ,[CountryID]
           ,[SourceID]
           ,[Name]
           ,[ServiceAttributeDescription]
           ,[CreateDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active]
           ,[DisplayRank]
           ,[PositionReference])
     VALUES
           (@ServiceAttributeID
           ,@LanguageID
           ,@CountryID
           ,@SourceID
           ,@Name
           ,@ServiceAttributeDescription
           ,@CreateDate
           ,@UpdatedDate
           ,@ModifiedBy
           ,@Active
           ,@DisplayRank
           ,@PositionReference)
END
GO