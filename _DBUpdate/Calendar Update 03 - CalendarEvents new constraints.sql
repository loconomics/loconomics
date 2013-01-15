BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarAvailabilityType
	DROP CONSTRAINT PK_CalendarAvailabilityType
GO
ALTER TABLE dbo.CalendarAvailabilityType ADD CONSTRAINT
	PK_CalendarAvailabilityType_1 PRIMARY KEY CLUSTERED 
	(
	CalendarAvailabilityTypeID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.CalendarAvailabilityType SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarAvailabilityType', 'Object', 'CONTROL') as Contr_Per 

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

-- change data that breaks next constraint
update calendarevents set userid = 141 where userid not in (select userid from users)

ALTER TABLE [dbo].[CalendarEvents]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEvents_users] FOREIGN KEY([UserId])
REFERENCES [dbo].[users] ([UserID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEvents] CHECK CONSTRAINT [FK_CalendarEvents_users]
GO

ALTER TABLE [dbo].[CalendarEvents] DROP CONSTRAINT [FK_CalendarEvents_users]
