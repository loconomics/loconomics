/*
   martes, 15 de enero de 201313:27:18
   User: 
   Server: localhost\SQLEXPRESS
   Database: loconomics
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
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
CREATE TABLE dbo.Tmp_CalendarEvents
	(
	Id int NOT NULL IDENTITY (1, 1),
	UserId int NOT NULL,
	EventType int NOT NULL,
	Summary varchar(500) NULL,
	UID varchar(150) NULL,
	CalendarAvailabilityTypeID int NOT NULL,
	Transparency bit NOT NULL,
	StartTime datetime NOT NULL,
	EndTime datetime NOT NULL,
	IsAllDay bit NOT NULL,
	StampTime datetime NULL,
	TimeZone nvarchar(100) NULL,
	Priority int NULL,
	Location nvarchar(100) NULL,
	UpdatedDate datetime NULL,
	CreatedDate datetime NULL,
	ModifyBy nvarchar(50) NULL,
	Class nvarchar(50) NULL,
	Organizer nvarchar(MAX) NULL,
	Sequence int NULL,
	Geo nvarchar(100) NULL,
	RecurrenceId datetime NULL,
	TimeBlock time(7) NULL,
	DayofWeek int NULL,
	Description nvarchar(MAX) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_CalendarEvents SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_Transparency DEFAULT 0 FOR Transparency
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_EventType DEFAULT 1 FOR EventType
GO
ALTER TABLE dbo.Tmp_CalendarEvents ADD CONSTRAINT
	DF_CalendarEvents_IsAllDay DEFAULT 0 FOR IsAllDay
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEvents ON
GO
IF EXISTS(SELECT * FROM dbo.CalendarEvents)
	 EXEC('INSERT INTO dbo.Tmp_CalendarEvents (Id, UserId, UID, CalendarAvailabilityTypeID, StartTime, EndTime, TimeZone)
		SELECT CONVERT(int, Id), CONVERT(int, UserId), UID, CalendarAvailabilityTypeID, StartTime, EndTime, TimeZone FROM dbo.CalendarEvents WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_CalendarEvents OFF
GO
DROP TABLE dbo.CalendarEvents
GO
EXECUTE sp_rename N'dbo.Tmp_CalendarEvents', N'CalendarEvents', 'OBJECT' 
GO
ALTER TABLE dbo.CalendarEvents ADD CONSTRAINT
	PK_CalendarEvents PRIMARY KEY CLUSTERED 
	(
	Id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarEvents', 'Object', 'CONTROL') as Contr_Per 