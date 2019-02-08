ALTER TABLE [licensecertification]                           ADD [language] NVARCHAR (42) DEFAULT ('en-US') NOT NULL
GO

IF  EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID(N'[DF__licensece__Langu__5BF880E2]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[licensecertification] DROP CONSTRAINT [DF__licensece__Langu__5BF880E2]
END
GO

ALTER TABLE [licensecertification]                           DROP COLUMN [LanguageID]
