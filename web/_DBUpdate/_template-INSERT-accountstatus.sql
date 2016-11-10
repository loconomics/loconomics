INSERT INTO [accountstatus]
   ([AccountStatusID]
   ,[AccountStatusName]
   ,[AccountStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   (@AccountStatusID
   ,@AccountStatusName
   ,@AccountStatusDescription
   ,@CreatedDate
   ,@UpdatedDate
   ,@ModifiedBy
   ,@Active)