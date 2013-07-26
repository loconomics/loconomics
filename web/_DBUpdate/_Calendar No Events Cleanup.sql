delete from CalendarEventsAttendees where IdEvent not in (select distinct ID from CalendarEvents)

delete from CalendarEventExceptionsPeriodsList where IdEvent not in (select distinct ID from CalendarEvents)
delete from CalendarEventExceptionsPeriod where IdException not in (select distinct Id from CalendarEventExceptionsPeriodsList)

delete from CalendarEventRecurrencesPeriodList where IdEvent not in (select distinct ID from CalendarEvents)
delete from CalendarEventRecurrencesPeriod where IdRecurrence not in (select distinct Id from CalendarEventRecurrencesPeriodList)

delete from CalendarReccurrence where eventid not in (select distinct ID from CalendarEvents)
delete from CalendarReccurrenceFrequency where calendarreccursiveid not in (select distinct id from calendarreccurrence)
