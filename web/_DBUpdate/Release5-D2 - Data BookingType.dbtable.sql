
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM BookingType 
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
   ('1'
   ,'First-time booking'
   ,'A one-time booking made by a customer that has never used the booked provider.'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'0.00'
   ,'10.00'
   ,'2.90'
   ,'0.30')
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
   ('2'
   ,'Repeat booking'
   ,'A one-time booking made by a customer that has previously used the provider.'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'0.00'
   ,'5.00'
   ,'2.90'
   ,'0.30')
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
   ('3'
   ,'First-time recurring/multiple booking'
   ,'A booking with more than one occurance made by a customer that has never used the booked provider.'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'0.00'
   ,'7.00'
   ,'2.90'
   ,'0.30')
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
   ('4'
   ,'Estimate booking'
   ,'A booking made by a customer to have a provider make a visit to determine a price.'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5.00'
   ,'0.00'
   ,'2.90'
   ,'0.30')
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
   ('5'
   ,'Exchange booking'
   ,'A booking made using the Loconomics Exchange Program'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'False'
   ,'0.00'
   ,'0.00'
   ,'0.00'
   ,'0.00')
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
   ('6'
   ,'Repeat recurring/multiple booking'
   ,'A booking with more than one occurance made by a customer that has previously used the provider.'
   ,'4/30/2012 12:00:00 AM'
   ,'10/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'0.00'
   ,'5.00'
   ,'2.90'
   ,'0.30')
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
   ('7'
   ,'Booking from book-me button'
   ,'A booking done from the book-me button identified by the provider-position BookCode'
   ,'6/28/2013 5:50:00 PM'
   ,'6/28/2013 5:50:00 PM'
   ,'ils'
   ,'True'
   ,'0.00'
   ,'0.00'
   ,'2.90'
   ,'0.30')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
