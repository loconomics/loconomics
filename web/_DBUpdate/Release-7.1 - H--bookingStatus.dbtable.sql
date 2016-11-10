
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM bookingStatus 
INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'incomplete'
   ,'A booking has been started (usually by a customer) but not completed and still saved for later completion'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'request'
   ,'A booking request has been completed and awaiting service professional or customer response'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'cancelled'
   ,'A booking has been cancelled by either customer or service professional (the creator of the booking on each case) per the edit booking rules and cancellation policy has been enforced'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'denied'
   ,'A booking request has been denied by a service professional or customer (is done by the opposite user to the one that created the booking).'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'requestExpired'
   ,'A booking request has expired due to service professional or customer inaction.'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'confirmed'
   ,'Booking has been confirmed and awaiting service to be performed.'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'servicePerformed'
   ,'Service performed.'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('8'
   ,'completed'
   ,'Customer has paid in full and service professional has been paid in full.'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')

INSERT INTO [bookingStatus]
   ([BookingStatusID]
   ,[BookingStatusName]
   ,[BookingStatusDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('9'
   ,'dispute'
   ,'Booking is in dispute-dispute created.'
   ,'8/29/2015 1:09:00 PM'
   ,'8/29/2015 1:09:00 PM'
   ,'jd'
   ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
