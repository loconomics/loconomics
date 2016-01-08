/****** Object:  Table [dbo].[OwnerStatus]    Script Date: 01/08/2016 11:42:45 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[OwnerStatus](
	[OwnserStatusID] [int] NOT NULL,
	[LanguageID] [varchar](25) NOT NULL,
	[CountryID] [varchar](25) NOT NULL,
	[OwnerStatusName] [varchar](50) NOT NULL,
	[OwnerStatusDescription] [varchar](200) NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[Active] [bit] NOT NULL,
	[UpdatedBy] [varchar](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[OwnserStatusID] ASC,
	[LanguageID] ASC,
	[CountryID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


