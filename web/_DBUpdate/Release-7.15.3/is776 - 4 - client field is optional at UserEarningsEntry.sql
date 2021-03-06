/*
   lunes, 12 de febrero de 201821:20:58
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
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT FK_UserEarningsEntry_ServiceProfessionalClient
GO
ALTER TABLE dbo.ServiceProfessionalClient SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT FK_UserEarningsEntry_UserExternalListing
GO
ALTER TABLE dbo.UserExternalListing SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT FK_UserEarningsEntry_users
GO
ALTER TABLE dbo.users SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.users', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT DF_UserEarningsEntry_Amount
GO
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT DF_UserEarningsEntry_Active
GO
CREATE TABLE dbo.Tmp_UserEarningsEntry
	(
	UserID int NOT NULL,
	EarningsEntryID int NOT NULL,
	Amount decimal(10, 2) NOT NULL,
	PaidDate datetimeoffset(0) NOT NULL,
	DurationMinutes int NOT NULL,
	UserExternalListingID int NOT NULL,
	JobTitleID int NOT NULL,
	ClientUserID int NULL,
	CreatedDate datetimeoffset(0) NOT NULL,
	UpdatedDate datetimeoffset(7) NOT NULL,
	ModifiedBy nvarchar(4) NOT NULL,
	Active bit NOT NULL,
	Notes text NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_UserEarningsEntry SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_UserEarningsEntry ADD CONSTRAINT
	DF_UserEarningsEntry_Amount DEFAULT ((0)) FOR Amount
GO
ALTER TABLE dbo.Tmp_UserEarningsEntry ADD CONSTRAINT
	DF_UserEarningsEntry_Active DEFAULT ((1)) FOR Active
GO
IF EXISTS(SELECT * FROM dbo.UserEarningsEntry)
	 EXEC('INSERT INTO dbo.Tmp_UserEarningsEntry (UserID, EarningsEntryID, Amount, PaidDate, DurationMinutes, UserExternalListingID, JobTitleID, ClientUserID, CreatedDate, UpdatedDate, ModifiedBy, Active, Notes)
		SELECT UserID, EarningsEntryID, Amount, PaidDate, DurationMinutes, UserExternalListingID, JobTitleID, ClientUserID, CreatedDate, UpdatedDate, ModifiedBy, Active, Notes FROM dbo.UserEarningsEntry WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.UserEarningsEntry
GO
EXECUTE sp_rename N'dbo.Tmp_UserEarningsEntry', N'UserEarningsEntry', 'OBJECT' 
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	PK_UserEarningsEntry PRIMARY KEY CLUSTERED 
	(
	UserID,
	EarningsEntryID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_UserExternalListing FOREIGN KEY
	(
	UserExternalListingID
	) REFERENCES dbo.UserExternalListing
	(
	UserExternalListingID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_ServiceProfessionalClient FOREIGN KEY
	(
	UserID,
	ClientUserID
	) REFERENCES dbo.ServiceProfessionalClient
	(
	ServiceProfessionalUserID,
	ClientUserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'CONTROL') as Contr_Per 