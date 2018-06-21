SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[UserPostingQuestionResponse](
	[userPostingID] [int] NOT NULL,
	[questionID] [int] NOT NULL,
	[questionTypeID] [int] NOT NULL,
	[question] [nvarchar](120) NOT NULL,
	[helpBlock] [nvarchar](300) NULL,
	[options] [text] NOT NULL,
	[responses] [text] NOT NULL,
	[legend] [nvarchar](60) NOT NULL,
	[branchLogic] [text] NULL,
 CONSTRAINT [PK_UserPostingQuestionResponse_1] PRIMARY KEY CLUSTERED 
(
	[userPostingID] ASC,
	[questionID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[UserPostingQuestionResponse]  WITH CHECK ADD  CONSTRAINT [FK_UserPostingQuestionResponse_question] FOREIGN KEY([questionID])
REFERENCES [dbo].[question] ([questionID])
GO

ALTER TABLE [dbo].[UserPostingQuestionResponse] CHECK CONSTRAINT [FK_UserPostingQuestionResponse_question]
GO

ALTER TABLE [dbo].[UserPostingQuestionResponse]  WITH CHECK ADD  CONSTRAINT [FK_UserPostingQuestionResponse_questionType] FOREIGN KEY([questionTypeID])
REFERENCES [dbo].[questionType] ([questionTypeID])
GO

ALTER TABLE [dbo].[UserPostingQuestionResponse] CHECK CONSTRAINT [FK_UserPostingQuestionResponse_questionType]
GO

ALTER TABLE [dbo].[UserPostingQuestionResponse]  WITH CHECK ADD  CONSTRAINT [FK_UserPostingQuestionResponse_UserPosting] FOREIGN KEY([userPostingID])
REFERENCES [dbo].[UserPosting] ([userPostingID])
GO

ALTER TABLE [dbo].[UserPostingQuestionResponse] CHECK CONSTRAINT [FK_UserPostingQuestionResponse_UserPosting]
GO


