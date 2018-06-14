SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[UserPostingReaction](
	[userPostingID] [int] NOT NULL,
	[serviceProfessionalUserID] [int] NOT NULL,
	[reactionTypeID] [int] NOT NULL,
	[createdDate] [datetimeoffset](0) NOT NULL,
	[updatedDate] [datetimeoffset](0) NOT NULL,
	[message] [text] NULL,
 CONSTRAINT [PK_UserPostingReaction] PRIMARY KEY CLUSTERED 
(
	[userPostingID] ASC,
	[serviceProfessionalUserID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[UserPostingReaction]  WITH CHECK ADD  CONSTRAINT [FK_UserPostingReaction_UserPosting] FOREIGN KEY([userPostingID])
REFERENCES [dbo].[UserPosting] ([userPostingID])
GO

ALTER TABLE [dbo].[UserPostingReaction] CHECK CONSTRAINT [FK_UserPostingReaction_UserPosting]
GO

ALTER TABLE [dbo].[UserPostingReaction]  WITH CHECK ADD  CONSTRAINT [FK_UserPostingReaction_users] FOREIGN KEY([serviceProfessionalUserID])
REFERENCES [dbo].[users] ([UserID])
GO

ALTER TABLE [dbo].[UserPostingReaction] CHECK CONSTRAINT [FK_UserPostingReaction_users]
GO


