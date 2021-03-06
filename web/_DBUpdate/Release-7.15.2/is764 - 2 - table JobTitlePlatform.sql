/*
   viernes, 02 de febrero de 201818:38:22
   User: 
   Server: ESTUDIO-I3\SQLEXPRESS
   Database: loconomics
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
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
CREATE TABLE dbo.JobTitlePlatform
	(
	JobTitleID int NOT NULL,
	PlatformID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetimeoffset(0) NOT NULL,
	UpdatedDate datetimeoffset(0) NOT NULL,
	ModifiedBy nvarchar(4) NOT NULL,
	Active bit NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.JobTitlePlatform ADD CONSTRAINT
	DF_JobTitlePlatform_Active DEFAULT 1 FOR Active
GO
ALTER TABLE dbo.JobTitlePlatform ADD CONSTRAINT
	PK_JobTitlePlatform PRIMARY KEY CLUSTERED 
	(
	JobTitleID,
	PlatformID,
	LanguageID,
	CountryID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.JobTitlePlatform SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.JobTitlePlatform', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.JobTitlePlatform', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.JobTitlePlatform', 'Object', 'CONTROL') as Contr_Per 