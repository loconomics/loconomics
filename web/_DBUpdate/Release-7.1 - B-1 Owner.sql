/****** Object:  Table [dbo].[Owner]    Script Date: 01/08/2016 11:41:20 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[Owner](
	[UserID] [int] NOT NULL,
	[OwnerStatusID] [int] NOT NULL,
	[OwnerPaymentPlan] [varchar](25) NULL,
	[OwnerPaymentMethod] [varchar](25) NULL,
	[OwnerPaymentPLanLastChangedDate] [datetime] NULL,
	[NextPaymentDueDate] [datetime] NULL,
	[NextPaymentAmount] [money] NULL,
	[LastPaymentDate] [datetime] NULL,
	[LastPaymentAmount] [money] NULL,
	[TotalPastDueAmount] [money] NULL,
	[OwnerAnniversaryDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


