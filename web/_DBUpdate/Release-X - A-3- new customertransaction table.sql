
/****** Object:  Table [dbo].[customertransaction]    Script Date: 11/05/2015 13:27:38 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[customertransaction](
	[CustomerTransactionID] [int] NOT NULL,
	[CustomerUserID] [int] NOT NULL,
	[BookingID] [int] NOT NULL,
	[Amount] [decimal](5, 0) NOT NULL,
	[CustomerTransactionTypeID] [int] NOT NULL,
	[PaymentProcessorTransactionID] [int] NULL,
	[PaymentProcessorStatus] [varchar](50) NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[Modifiedby] [varchar](25) NOT NULL,
	[PaymentProcessorFees] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CustomerTransactionID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[customertransaction]  WITH CHECK ADD  CONSTRAINT [FK__customert__Booki__125EB334] FOREIGN KEY([BookingID])
REFERENCES [dbo].[booking] ([BookingID])
GO

ALTER TABLE [dbo].[customertransaction] CHECK CONSTRAINT [FK__customert__Booki__125EB334]
GO

ALTER TABLE [dbo].[customertransaction]  WITH CHECK ADD  CONSTRAINT [FK__customert__Custo__116A8EFB] FOREIGN KEY([CustomerUserID])
REFERENCES [dbo].[users] ([UserID])
GO

ALTER TABLE [dbo].[customertransaction] CHECK CONSTRAINT [FK__customert__Custo__116A8EFB]
GO

ALTER TABLE [dbo].[customertransaction]  WITH CHECK ADD FOREIGN KEY([CustomerTransactionTypeID])
REFERENCES [dbo].[customertransactiontype] ([CustomerTransactionTypeID])
GO


