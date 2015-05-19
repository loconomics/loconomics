SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[VOCFeedback](
	[VOCFeedbackID] [int] NOT NULL,
	[VOCElementID] [int] NOT NULL,
	[VOCExperienceCategoryID] [int] NOT NULL,
	[UserID] [int] NOT NULL,
	[Feedback] [varchar](5000) NOT NULL,
	[VOCFlag1] [varchar](50) NULL,
	[VOCFlag2] [varchar](50) NULL,
	[VOCFlag3] [varchar](50) NULL,
	[VOCFlag4] [varchar](50) NULL,
	[UserDevice] [varchar](100) NULL,
	[ZenDeskTicketNumber] [int] NULL,
	[ProviderUserID] [int] NULL,
	[ProviderPositionID] [int] NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[ModifiedBy] [varchar](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VOCFeedbackID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


