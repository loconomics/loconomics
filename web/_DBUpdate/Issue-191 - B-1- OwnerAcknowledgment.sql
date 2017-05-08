SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[OwnerAcknowledgment](
	[UserID] [int] NOT NULL,
	[DateAcknowledged] [datetimeoffset](7) NOT NULL,
	[AcknowledgedFromIP] [varchar](25) NOT NULL,
	[CreatedDate] [datetimeoffset](7) NOT NULL,
	[UpdatedDate] [datetimeoffset](7) NOT NULL,
	[DetectedIPs] [varchar](200) NOT NULL,
 CONSTRAINT [PK_OwnerAcknowledgment] PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[OwnerAcknowledgment]  WITH CHECK ADD  CONSTRAINT [FK_OwnerAcknowledgment_users] FOREIGN KEY([UserID])
REFERENCES [dbo].[users] ([UserID])
GO

ALTER TABLE [dbo].[OwnerAcknowledgment] CHECK CONSTRAINT [FK_OwnerAcknowledgment_users]
GO


