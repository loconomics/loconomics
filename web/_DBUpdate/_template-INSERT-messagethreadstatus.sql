INSERT INTO [messagethreadstatus]
           ([MessageThreadStatusID]
           ,[MessageThreadStatusName]
           ,[MessageThreadStatusDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active]
           ,[MessageStatusColor])
     VALUES
           (@MessageThreadStatusID
           ,@MessageThreadStatusName
           ,@MessageThreadStatusDescription
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy
           ,@Active
           ,@MessageStatusColor)
