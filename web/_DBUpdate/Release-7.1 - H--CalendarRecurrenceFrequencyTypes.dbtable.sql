
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM CalendarRecurrenceFrequencyTypes 
INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('0'
   ,'none'
   ,NULL

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('1'
   ,'Secondly'
   ,'Seconds'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('2'
   ,'Minutely'
   ,'Minutes'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('3'
   ,'Hourly'
   ,'Hours'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('4'
   ,'Daily'
   ,'Days'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('5'
   ,'Weekly'
   ,'Weeks'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('6'
   ,'Monthly'
   ,'Months'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('7'
   ,'Yearly'
   ,'Years'

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('205'
   ,'Bi-Weekly'
   ,NULL

INSERT INTO [CalendarRecurrenceFrequencyTypes]
   ([ID]
   ,[FrequencyType]
   ,[UnitPlural]
VALUES
   ('206'
   ,'Bi-Montly'
   ,NULL


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
