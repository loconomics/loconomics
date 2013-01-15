/* system data
*/

INSERT INTO [CalendarEventType]
           ([EventType]
           ,[Description])
     VALUES
           ('booking'
           ,'')
GO

INSERT INTO [CalendarEventType]
           ([EventType]
           ,[Description])
     VALUES
           ('work hours'
           ,'General availability')
GO

INSERT INTO [CalendarEventType]
           ([EventType]
           ,[Description])
     VALUES
           ('availability events'
           ,'Specific dates with a different provider availability')
GO

INSERT INTO [CalendarEventType]
           ([EventType]
           ,[Description])
     VALUES
           ('imported'
           ,'For VFREEBUSY imported from ical')
GO

INSERT INTO [CalendarEventType]
           ([EventType]
           ,[Description])
     VALUES
           ('other'
           ,'or any other thing we can have inclasificable')
GO