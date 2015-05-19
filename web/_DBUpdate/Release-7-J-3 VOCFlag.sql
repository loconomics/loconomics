SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[VOCFlag](
	[VOCFlagID] [int] NOT NULL,
	[LanguageID] [int] NOT NULL,
	[CountryID] [int] NOT NULL,
	[VOCFlagName] [varchar](50) NOT NULL,
	[VOCFlagNDescription] [varchar](500) NULL,
	[CreateDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[ModifiedBy] [varchar](3) NOT NULL,
	[Active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VOCFlagID] ASC,
	[LanguageID] ASC,
	[CountryID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


