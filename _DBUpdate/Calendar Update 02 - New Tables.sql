/****** Object:  Table [dbo].[CalendarEventComments]    Script Date: 01/15/2013 13:18:09 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventComments](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[IdEvent] [int] NOT NULL,
	[Comment] [nvarchar](max) NULL,
 CONSTRAINT [PK_Comments] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventComments]  WITH CHECK ADD  CONSTRAINT [FK_Comments_CalendarEvents] FOREIGN KEY([IdEvent])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventComments] CHECK CONSTRAINT [FK_Comments_CalendarEvents]
GO


/****** Object:  Table [dbo].[CalendarEventExceptionsPeriod]    Script Date: 01/15/2013 13:18:19 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventExceptionsPeriod](
	[IdException] [int] NOT NULL,
	[DateStart] [datetime] NOT NULL,
	[DateEnd] [datetime] NOT NULL,
 CONSTRAINT [PK_CalendarEventExceptionsPeriods] PRIMARY KEY CLUSTERED 
(
	[IdException] ASC,
	[DateStart] ASC,
	[DateEnd] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventExceptionsPeriod]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventExceptionsPeriods_CalendarEventExceptionsDates] FOREIGN KEY([IdException])
REFERENCES [dbo].[CalendarEventExceptionsPeriodsList] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventExceptionsPeriod] CHECK CONSTRAINT [FK_CalendarEventExceptionsPeriods_CalendarEventExceptionsDates]
GO

/****** Object:  Table [dbo].[CalendarEventExceptionsPeriodsList]    Script Date: 01/15/2013 13:18:27 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventExceptionsPeriodsList](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[IdEvent] [int] NOT NULL,
 CONSTRAINT [PK_CalendarEventExceptions] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventExceptionsPeriodsList]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventExceptions_CalendarEvents] FOREIGN KEY([IdEvent])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventExceptionsPeriodsList] CHECK CONSTRAINT [FK_CalendarEventExceptions_CalendarEvents]
GO

/****** Object:  Table [dbo].[CalendarEventRecurrencesPeriod]    Script Date: 01/15/2013 13:18:36 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventRecurrencesPeriod](
	[IdRecurrence] [int] NOT NULL,
	[DateStart] [datetime] NOT NULL,
	[DateEnd] [datetime] NOT NULL,
 CONSTRAINT [PK_CalendarEventRecurrencesPeriod] PRIMARY KEY CLUSTERED 
(
	[IdRecurrence] ASC,
	[DateStart] ASC,
	[DateEnd] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventRecurrencesPeriod]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventRecurrencesPeriod_CalendarEventRecurrencesPeriodList] FOREIGN KEY([IdRecurrence])
REFERENCES [dbo].[CalendarEventRecurrencesPeriodList] ([Id])
GO

ALTER TABLE [dbo].[CalendarEventRecurrencesPeriod] CHECK CONSTRAINT [FK_CalendarEventRecurrencesPeriod_CalendarEventRecurrencesPeriodList]
GO

/****** Object:  Table [dbo].[CalendarEventRecurrencesPeriodList]    Script Date: 01/15/2013 13:18:43 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventRecurrencesPeriodList](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[IdEvent] [int] NOT NULL,
 CONSTRAINT [PK_CalendarEventRecurrenceDates] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventRecurrencesPeriodList]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventRecurrencesPeriodList_CalendarEvents] FOREIGN KEY([IdEvent])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventRecurrencesPeriodList] CHECK CONSTRAINT [FK_CalendarEventRecurrencesPeriodList_CalendarEvents]
GO


/****** Object:  Table [dbo].[CalendarEventsAttendees]    Script Date: 01/15/2013 13:30:44 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventsAttendees](
	[Id] [int] NOT NULL,
	[IdEvent] [int] NOT NULL,
	[Attendee] [nvarchar](max) NULL,
 CONSTRAINT [PK_CalendarEventsAttendees] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventsAttendees]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventsAttendees_CalendarEvents] FOREIGN KEY([IdEvent])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventsAttendees] CHECK CONSTRAINT [FK_CalendarEventsAttendees_CalendarEvents]
GO


/****** Object:  Table [dbo].[CalendarEventsContacts]    Script Date: 01/15/2013 13:30:47 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventsContacts](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[IdEvent] [int] NOT NULL,
	[Contact] [nvarchar](500) NULL,
 CONSTRAINT [PK_CalendarEventsContacts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarEventsContacts]  WITH CHECK ADD  CONSTRAINT [FK_CalendarEventsContacts_CalendarEvents] FOREIGN KEY([IdEvent])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarEventsContacts] CHECK CONSTRAINT [FK_CalendarEventsContacts_CalendarEvents]
GO

/****** Object:  Table [dbo].[CalendarEventType]    Script Date: 01/15/2013 13:31:30 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarEventType](
	[EventTypeId] [int] IDENTITY(1,1) NOT NULL,
	[EventType] [nvarchar](100) NULL,
	[Description] [nvarchar](max) NULL,
 CONSTRAINT [PK_EventType] PRIMARY KEY CLUSTERED 
(
	[EventTypeId] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO


/****** Object:  Table [dbo].[CalendarReccurrence]    Script Date: 01/15/2013 13:33:23 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarReccurrence](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[EventID] [int] NULL,
	[Count] [int] NULL,
	[EvaluationMode] [nvarchar](50) NULL,
	[Frequency] [int] NULL,
	[Interval] [int] NULL,
	[RestristionType] [int] NULL,
	[Until] [datetime] NULL,
	[FirstDayOfWeek] [int] NULL,
 CONSTRAINT [PK_CalendarReccursive] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarReccurrence]  WITH CHECK ADD  CONSTRAINT [FK_CalendarReccursive_CalendarEvents] FOREIGN KEY([EventID])
REFERENCES [dbo].[CalendarEvents] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarReccurrence] CHECK CONSTRAINT [FK_CalendarReccursive_CalendarEvents]
GO

/****** Object:  Table [dbo].[CalendarReccurrenceFrequency]    Script Date: 01/15/2013 13:33:39 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CalendarReccurrenceFrequency](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[CalendarReccursiveID] [int] NULL,
	[ByDay] [bit] NULL,
	[ByHour] [bit] NULL,
	[ByMinute] [bit] NULL,
	[ByMonth] [bit] NULL,
	[ByMonthDay] [bit] NULL,
	[BySecond] [bit] NULL,
	[BySetPosition] [bit] NULL,
	[ByWeekNo] [bit] NULL,
	[ByYearDay] [bit] NULL,
	[ExtraValue] [int] NULL,
	[FrequencyDay] [int] NULL,
	[DayOfWeek] [int] NULL,
 CONSTRAINT [PK_CalendarRecurrence] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[CalendarReccurrenceFrequency]  WITH CHECK ADD  CONSTRAINT [FK_CalendarFrecuency_CalendarReccursive] FOREIGN KEY([CalendarReccursiveID])
REFERENCES [dbo].[CalendarReccurrence] ([ID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[CalendarReccurrenceFrequency] CHECK CONSTRAINT [FK_CalendarFrecuency_CalendarReccursive]
GO

