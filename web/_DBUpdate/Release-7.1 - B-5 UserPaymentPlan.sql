
/****** Object:  Table [dbo].[UserPaymentPlan]    Script Date: 01/11/2016 22:05:51 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[UserPaymentPlan](
	[UserID] [int] NOT NULL,
	[PaymentPlan] [varchar](25) NULL,
	[PaymentMethod] [varchar](25) NULL,
	[PaymentPlanLastChangedDate] [datetime] NULL,
	[NextPaymentDueDate] [datetime] NULL,
	[NextPaymentAmount] [money] NULL,
	[LastPaymentDate] [datetime] NULL,
	[LastPaymentAmount] [money] NULL,
	[TotalPastDueAmount] [money] NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


