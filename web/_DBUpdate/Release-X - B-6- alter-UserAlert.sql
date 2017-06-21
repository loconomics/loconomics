/*
  Remove unused UserAlert columns
*/
ALTER TABLE [dbo].[UserAlert] DROP CONSTRAINT [DF_UserAlert_Dismissed]
GO

ALTER TABLE [dbo].[UserAlert]
DROP COLUMN
  [CompletedDate]
  ,[Active]
  ,[AlertQuery]
  ,[Dismissed]
GO
