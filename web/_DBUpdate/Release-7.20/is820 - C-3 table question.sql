SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[question](
	[questionID] [int] NOT NULL,
	[questionTypeID] [int] NOT NULL,
	[question] [nvarchar](120) NOT NULL,
	[helpBlock] [nvarchar](300) NULL,
	[options] [text] NOT NULL,
	[languageID] [int] NOT NULL,
	[countryID] [int] NOT NULL,
	[createdDate] [datetimeoffset](0) NOT NULL,
	[updatedDate] [datetimeoffset](0) NOT NULL,
	[modifiedBy] [nvarchar](10) NOT NULL,
 CONSTRAINT [PK_question] PRIMARY KEY CLUSTERED 
(
	[questionID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[question]  WITH CHECK ADD  CONSTRAINT [FK_question_questionType] FOREIGN KEY([questionTypeID])
REFERENCES [dbo].[questionType] ([questionTypeID])
GO

ALTER TABLE [dbo].[question] CHECK CONSTRAINT [FK_question_questionType]
GO


