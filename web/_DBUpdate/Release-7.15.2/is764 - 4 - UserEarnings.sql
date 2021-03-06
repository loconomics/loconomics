/*
   viernes, 02 de febrero de 201818:47:55
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
ALTER TABLE dbo.Platform SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.Platform', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.Platform', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.Platform', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.users SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.users', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.UserEarnings
	(
	UserEarningsID int NOT NULL IDENTITY (1, 1),
	UserID int NOT NULL,
	PlatformID int NOT NULL,
	ClientID int NOT NULL,
	JobTitleID int NOT NULL,
	Amount decimal(10, 2) NOT NULL,
	Minutes int NOT NULL,
	PaidDate datetimeoffset(0) NOT NULL,
	Notes text NOT NULL,
	CreatedDate datetimeoffset(0) NOT NULL,
	UpdatedDate datetimeoffset(0) NOT NULL,
	ModifiedBy nvarchar(4) NOT NULL,
	Active bit NOT NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	DF_UserEarnings_Active DEFAULT 1 FOR Active
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	PK_UserEarnings PRIMARY KEY CLUSTERED 
	(
	UserEarningsID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_Platform FOREIGN KEY
	(
	PlatformID
	) REFERENCES dbo.Platform
	(
	PlatformID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_users1 FOREIGN KEY
	(
	ClientID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_UserEarnings FOREIGN KEY
	(
	UserEarningsID
	) REFERENCES dbo.UserEarnings
	(
	UserEarningsID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'CONTROL') as Contr_Per 