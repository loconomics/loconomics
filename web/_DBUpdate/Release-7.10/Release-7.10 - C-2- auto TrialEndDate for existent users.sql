-- Set a TrialEndDate for existent users, from now 14 days
UPDATE Users SET TrialEndDate = DATEADD(DAY, 14, SYSDATETIMEOFFSET())
