/****** Object:  Table [dbo].[OwnerUserFeePayments]    Script Date: 01/08/2016 13:26:30 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[OwnerUserFeePayments](
	[UserID] [int] NOT NULL,
	[PaymentDate] [datetime] NULL,
	[PaymentAmount] [money] NULL,
	[PaymentMethod] [varchar](25) NULL,
	[OwnerPaymentPlan] [varchar](50) NULL,
	[PaymentTransactionID] [int] NULL,
	[PaymentStatus] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


