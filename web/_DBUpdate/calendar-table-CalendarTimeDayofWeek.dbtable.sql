
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM CalendarTimeDayofWeek 
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('1',
    'Sunday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('2',
    'Monday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('3',
    'Tuesday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('4',
    'Wednesday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('5',
    'Thursday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('6',
    'Friday')
INSERT INTO [CalendarTimeDayofWeek]
   ([DayofWeek],
    [DayofWeekName])
VALUES
   ('7',
    'Saturday')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
