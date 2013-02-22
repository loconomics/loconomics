UPDATE CalendarAvailabilityType
SET SelectableAs = 'Unavailable'
WHERE CalendarAvailabilityTypeID = 0
GO
UPDATE CalendarAvailabilityType
SET SelectableAs = 'Free (available to be booked)'
WHERE CalendarAvailabilityTypeID = 1
GO
UPDATE CalendarAvailabilityType
SET SelectableAs = 'Busy'
WHERE CalendarAvailabilityTypeID = 2
GO
UPDATE CalendarAvailabilityType
SET SelectableAs = 'Tentative'
WHERE CalendarAvailabilityTypeID = 3
GO