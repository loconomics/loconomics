INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           (@CountyID
           ,@CountyName
           ,@FIPSCode
           ,@StateProvinceID
           ,@CreatedDate
           ,@UpdatedDate
           ,@ModifiedBy
           ,@Active)
