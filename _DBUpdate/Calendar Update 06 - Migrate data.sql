/* Major data was migrated already when applying changes on existing tables (CalendarEvents) but
	there is tables to be removed that need explicity migration because the data scheme is so 
	different that cannot be done automatically by an 'alter table'.
	
	Is the case for CalendarProviderFreeEvents, that now must be CalendarEvents of Type 'work hours':2
 */
 
-- First, to allow multiple executions of the script (on testing) without duplicate
--	data, remove current events of type:2
DELETE FROM CalendarEvents
WHERE EventType = 2 /* work hours */
 
-- Create an event per CalendarProviderFreeEvents DayOfWeek (no repeat for the same date) with fake
-- days (forever!) and real hours (limits from the start and end hours).
INSERT INTO CalendarEvents ([DayofWeek], UserId, EventType, CalendarAvailabilityTypeID, Transparency, 
	StartTime, EndTime, IsAllDay,
	CreatedDate, UpdatedDate, ModifyBy)
SELECT 
	-- DayofWeek is saved as base-1, we need now base-0 to that we substract 1 to the current value
	([DayofWeek] - 1),
	UserID,
	2 /* work hours */, 1 /*CalendarAvailabilityTypeID:Free*/, Cast(0 as bit),
	-- Start is the first block in the list (the minimum)
	( Cast('20000101' As DateTime) + Cast(MIN(TimeBlock) As DateTime) ),
	-- End is the last block in the list (the maximum) PLUS a quarter (because TimeBlock defines the start
	-- of the block, not the end time)
	( Cast('30000101' As DateTime) + Cast(MAX(TimeBlock) As DateTime) + Cast('00:15:00' As DateTime) ),
	Cast(1 as bit),
	getdate(), getdate(),
	/* IMPORTANT: Using ModifyBy to track what records are being updated in this script
		that will be changed before finish */
	'importer-step1'
FROM
	CalendarProviderFreeEvents
GROUP BY DayofWeek, UserID

-- Create Recurrence rule per each EventType:2, each 1 Weekly the DayofWeek specified in the Event
INSERT INTO CalendarReccurrence (EventID, Frequency, Interval, [Count], Until, FirstDayOfWeek)
SELECT
		ID,
		5 /* Weekly */,
		1 /* each week */
		, null /* there is no a limit of ocurrences */
		, null /* Until: never ends */
		, 0 /* Sunday */
FROM	CalendarEvents
WHERE	EventType = 2 /* work hours */
		 AND ModifyBy = 'importer-step1'
-- Recurrence Frequency (what day)
INSERT INTO CalendarReccurrenceFrequency (CalendarReccursiveID, ByDay, [DayOfWeek], ExtraValue, FrequencyDay)
SELECT
	R.ID, 
	Cast(1 as bit), /* ByDay:true */
	E.[DayOfWeek] /* DayOfWeek */
	,E.[DayOfWeek] /* ExtraValue */
	, null
FROM
		CalendarReccurrence As R
		 INNER JOIN
		CalendarEvents As E
		  ON R.EventId = E.Id
WHERE	E.EventType = 2 /* work hours */
		 AND E.ModifyBy = 'importer-step1'
		 
/* Change ModifyBy from 'importer-step1' to 'importer' */
UPDATE CalendarEvents
SET ModifyBy = 'importer'
WHERE ModifyBy like 'importer-step1'

/*** REMOVING OLD CALENDAR-FREEEVENTS DATA ALREADY IMPORTED ***/
DELETE FROM CalendarProviderFreeEvents