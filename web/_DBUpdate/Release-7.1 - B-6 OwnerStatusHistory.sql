/****** Object:  Table [dbo].[OwnerStatusHistory]    Script Date: 01/11/2016 22:07:27 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[OwnerStatusHistory](
	[UserID] [int] NOT NULL,
	[OwnerStatusID] [int] NOT NULL,
	[OwnerStatusChangedDate] [date] NOT NULL,
	[OwnerStatusChangedBy] [varchar](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


