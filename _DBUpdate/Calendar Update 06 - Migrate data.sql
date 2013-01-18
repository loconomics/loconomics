/* Major data was migrated already when applying changes on existing tables (CalendarEvents) but
	there is tables to be removed that need explicity migration because the data scheme is so 
	different that cannot be done automatically by an 'alter table'.
	
	Is the case for CalendarProviderFreeEvents, that now must be CalendarEvents of Type 'work hours':2
 */
 
-- Create an event per CalendarProviderFreeEvents DayOfWeek (no repeat for the same date) with fake
-- days (forever!) and real hours (limits from the start and end hours).
INSERT INTO CalendarEvents ([DayofWeek], UserId, EventType, CalendarAvailabilityTypeID, Transparency, 
	StartTime, EndTime, IsAllDay,
	CreatedDate, UpdatedDate, ModifyBy)
SELECT 
	-- DayofWeek is saved as base-1, we need now base-0 to that we substract 1 to the current value
	([DayofWeek] - 1),
	UserID, 2 /* work hours */, 1 /*CalendarAvailabilityTypeID:Free*/, Cast(0 as bit),
	( Cast('20000101' As DateTime) + Cast(MIN(TimeBlock) As DateTime) ),
	( Cast('30000101' As DateTime) + Cast(MAX(TimeBlock) As DateTime) ),
	Cast(1 as bit),
	getdate(), getdate(), 'sys'
FROM
	CalendarProviderFreeEvents
GROUP BY DayofWeek, UserID

-- Create Recurrence rule per each EventType:2, each 1 Weekly the DayofWeek specified in the Event
INSERT INTO CalendarReccurrence (EventID, Frequency, Interval, Count)
SELECT
		ID, 5 /* Weekly */, 1 /* each week */
		, -2147483648 /* I don't know, every imported event adds this minimum value */
FROM	CalendarEvents
WHERE	EventType = 2 /* work hours */
-- Recurrence Frequency (what day)
INSERT INTO CalendarReccurrenceFrequency (CalendarReccursiveID, ByDay, [DayOfWeek], FrequencyDay)
SELECT
	R.ID, 1, E.[DayOfWeek]
	, -2147483648 /* I don't know, every imported event adds this minimum value */
FROM
		CalendarReccurrence As R
		 INNER JOIN
		CalendarEvents As E
		  ON R.EventId = E.Id
WHERE	E.EventType = 2 /* work hours */
