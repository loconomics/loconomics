
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM CalendarAvailabilityType 
INSERT INTO [CalendarAvailabilityType]
   ([CalendarAvailabilityTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[CalendarAvailabilityTypeName]
   ,[CalendarAvailabilityTypeDescription]
   ,[UserDescription]
   ,[AddAppointmentType]
   ,[SelectableAs])
VALUES
   ('0'
   ,'1'
   ,'1'
   ,'Unavailable'
   ,'At this date-time range can not be scheduled events. No working hours.'
   ,'I can''t work at this time'
   ,'True'
   ,'Unavailable')

INSERT INTO [CalendarAvailabilityType]
   ([CalendarAvailabilityTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[CalendarAvailabilityTypeName]
   ,[CalendarAvailabilityTypeDescription]
   ,[UserDescription]
   ,[AddAppointmentType]
   ,[SelectableAs])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Free'
   ,'No events (I ask myself if this type is needed, will never be assigned)'
   ,NULL
   ,'False'
   ,'Free (available to be booked)')

INSERT INTO [CalendarAvailabilityType]
   ([CalendarAvailabilityTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[CalendarAvailabilityTypeName]
   ,[CalendarAvailabilityTypeDescription]
   ,[UserDescription]
   ,[AddAppointmentType]
   ,[SelectableAs])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Busy'
   ,'No events can overlap this'
   ,NULL
   ,'False'
   ,'Busy')

INSERT INTO [CalendarAvailabilityType]
   ([CalendarAvailabilityTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[CalendarAvailabilityTypeName]
   ,[CalendarAvailabilityTypeDescription]
   ,[UserDescription]
   ,[AddAppointmentType]
   ,[SelectableAs])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Tentative'
   ,'There is a not confirmed event'
   ,NULL
   ,'False'
   ,'Tentative')

INSERT INTO [CalendarAvailabilityType]
   ([CalendarAvailabilityTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[CalendarAvailabilityTypeName]
   ,[CalendarAvailabilityTypeDescription]
   ,[UserDescription]
   ,[AddAppointmentType]
   ,[SelectableAs])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Offline booking'
   ,'No events can overlap this'
   ,'An app''t scheduled outside of Loconomics'
   ,'True'
   ,NULL)


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
