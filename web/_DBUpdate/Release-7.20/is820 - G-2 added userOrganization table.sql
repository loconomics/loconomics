CREATE TABLE [dbo].[userOrganization](
	[userID] [int] NOT NULL,
	[orgName] [nvarchar](200) NOT NULL,
	[orgDescription] [nvarchar](400) NULL,
	[orgWebsite] [nvarchar](255) NULL,
	[updatedDate] [datetimeoffset](0) NULL,
 CONSTRAINT [PK_userOrganization] PRIMARY KEY CLUSTERED 
(
	[userID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[userOrganization]  WITH CHECK ADD  CONSTRAINT [FK_userOrganization_users] FOREIGN KEY([userID])
REFERENCES [dbo].[users] ([UserID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[userOrganization] CHECK CONSTRAINT [FK_userOrganization_users]
GO


