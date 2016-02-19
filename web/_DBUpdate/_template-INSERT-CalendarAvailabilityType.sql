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
   (@CalendarAvailabilityTypeID
   ,@LanguageID
   ,@CountryID
   ,@CalendarAvailabilityTypeName
   ,@CalendarAvailabilityTypeDescription
   ,@UserDescription
   ,@AddAppointmentType
   ,@SelectableAs)
