BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.providerpackage ADD
	SolutionID int NOT NULL CONSTRAINT DF_providerpackage_SolutionID DEFAULT 0
GO
ALTER TABLE dbo.providerpackage SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.providerpackage', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.providerpackage', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.providerpackage', 'Object', 'CONTROL') as Contr_Per 