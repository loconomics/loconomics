update CalendarEventType
set
 DisplayName = 'Offline booking (App’t scheduled outside of Loconomics)'
where EventTypeId = 5
GO
update CalendarEventType
set
 DisplayName = 'Appointment'
where EventTypeId = 3