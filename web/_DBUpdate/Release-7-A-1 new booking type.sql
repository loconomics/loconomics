INSERT INTO [bookingtype]
           ([BookingTypeID]
           ,[BookingTypeName]
           ,[BookingTypeDescription]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active]
           ,[ServiceFeeFixed]
           ,[ServiceFeePercentage]
           ,[PaymentProcessingFeePercentage]
           ,[PaymentProcessingFeeFixed])
     VALUES
           (8
           ,'Scheduling Provider Booking'
           ,'A booking created by the provider on the App using only the scheduling, so no payment processing, no fees'
           ,'2015-01-19 18:30:00.000'
           ,'2015-01-19 18:30:00.000'
           ,'ils'
           ,1
           ,0
           ,0
           ,0
           ,0)
