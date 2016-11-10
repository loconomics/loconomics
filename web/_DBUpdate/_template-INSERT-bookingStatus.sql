INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   (@BookingStatusID
   ,@BookingStatusName
   ,@BookingStatusDescription
   ,@CreatedDate
   ,@UpdatedDate
   ,@ModifiedBy
   ,@Active)
