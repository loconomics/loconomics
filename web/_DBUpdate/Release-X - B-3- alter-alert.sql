/*
  Remove unused Alert columns
*/
ALTER TABLE [dbo].[alert]
DROP COLUMN
      [AlertHeadlineDisplay]
      ,[AlertTextDisplay]
      ,[AlertDescription]
      ,[AlertEmailText]
      ,[ProviderProfileCompletePoints]
      ,[CustomerProfileCompletePoints]
      ,[AlertPageURL]
GO
