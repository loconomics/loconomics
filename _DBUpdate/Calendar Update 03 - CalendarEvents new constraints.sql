
SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[CalendarEvents]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEvents_CalendarAvailabilityType] FOREIGN KEY([CalendarAvailabilityTypeID])
REFERENCES [dbo].[CalendarAvailabilityType] ([CalendarAvailabilityTypeID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEvents] CHECK CONSTRAINT [FK_CalendarEvents_CalendarAvailabilityType]
GO

ALTER TABLE [dbo].[CalendarEvents]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEvents_CalendarEventType] FOREIGN KEY([EventType])
REFERENCES [dbo].[CalendarEventType] ([EventTypeId])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEvents] CHECK CONSTRAINT [FK_CalendarEvents_CalendarEventType]
GO

ALTER TABLE [dbo].[CalendarEvents]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEvents_users] FOREIGN KEY([UserId])
REFERENCES [dbo].[users] ([UserID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEvents] CHECK CONSTRAINT [FK_CalendarEvents_users]
GO