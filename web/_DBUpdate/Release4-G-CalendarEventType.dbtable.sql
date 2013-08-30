
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM CalendarEventType 
INSERT INTO [CalendarEventType]
   ([EventTypeId]
   ,[EventType]
   ,[Description]
   ,[DisplayName])
VALUES
   ('1'
   ,'booking'
   ,''
   ,NULL)

INSERT INTO [CalendarEventType]
   ([EventTypeId]
   ,[EventType]
   ,[Description]
   ,[DisplayName])
VALUES
   ('2'
   ,'work hours'
   ,'General availability'
   ,NULL)

INSERT INTO [CalendarEventType]
   ([EventTypeId]
   ,[EventType]
   ,[Description]
   ,[DisplayName])
VALUES
   ('3'
   ,'availability events'
   ,'Specific dates with a different provider availability'
   ,'Appointment')

INSERT INTO [CalendarEventType]
   ([EventTypeId]
   ,[EventType]
   ,[Description]
   ,[DisplayName])
VALUES
   ('4'
   ,'imported'
   ,'For VFREEBUSY imported from ical'
   ,NULL)

INSERT INTO [CalendarEventType]
   ([EventTypeId]
   ,[EventType]
   ,[Description]
   ,[DisplayName])
VALUES
   ('5'
   ,'other'
   ,'or any other thing we can have inclasificable'
   ,'Offline booking (App’t scheduled outside of Loconomics)')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
