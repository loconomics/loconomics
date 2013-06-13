/** UPSERT serviceattribute **/
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