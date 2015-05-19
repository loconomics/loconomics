SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[VOCExperienceCategory](
	[VOCExperienceCategoryID] [int] NOT NULL,
	[LanguageID] [int] NOT NULL,
	[CountryID] [int] NOT NULL,
	[VOCExperienceCategoryName] [varchar](50) NULL,
	[VOCExperienceCategoryDescription] [varchar](200) NULL,
	[CreateDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[ModifiedBy] [varchar](3) NOT NULL,
	[Active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VOCExperienceCategoryID] ASC,
	[LanguageID] ASC,
	[CountryID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


