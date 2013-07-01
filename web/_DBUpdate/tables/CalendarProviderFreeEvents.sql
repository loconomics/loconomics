/****** Object:  Table [dbo].[CALENDARProviderFreeEvents]    Script Date: 07/01/2013 12:36:29 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[CalendarProviderFreeEvents](
	[UserID] [int] NOT NULL,
	[CalendarAvailabilityTypeID] [int] NOT NULL,
	[DayofWeek] [int] NOT NULL,
	[TimeBlock] [time](7) NOT NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[ModifiedBy] [varchar](25) NULL,
 CONSTRAINT [PK_CalendarProviderFreeEvents] PRIMARY KEY CLUSTERED 
(
	[UserID] ASC,
	[CalendarAvailabilityTypeID] ASC,
	[DayofWeek] ASC,
	[TimeBlock] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


