SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[VOCScores](
	[VOCScoresID] [int] NOT NULL,
	[UserID] [int] NOT NULL,
	[VOCElementID] [int] NOT NULL,
	[Score] [int] NOT NULL,
	[Date] [datetime] NOT NULL,
	[ProviderUserID] [int] NULL,
	[ProviderPositionID] [int] NULL,
	[UserDevice] [varchar](100) NULL,
	[VOCExperienceCategoryID] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VOCScoresID] ASC,
	[UserID] ASC,
	[VOCElementID] ASC,
	[Score] ASC,
	[Date] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


