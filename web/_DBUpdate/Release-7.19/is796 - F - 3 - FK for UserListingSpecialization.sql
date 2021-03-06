/*
   viernes, 09 de marzo de 201814:09:41
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
ALTER TABLE dbo.users SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.users', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.userprofilepositions SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.Specialization SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserListingSpecialization ADD CONSTRAINT
	FK_UserListingSpecialization_Specialization FOREIGN KEY
	(
	SpecializationID,
	LanguageID,
	CountryID
	) REFERENCES dbo.Specialization
	(
	SpecializationID,
	LanguageID,
	CountryID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserListingSpecialization ADD CONSTRAINT
	FK_UserListingSpecialization_userprofilepositions FOREIGN KEY
	(
	UserListingID
	) REFERENCES dbo.userprofilepositions
	(
	UserListingID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserListingSpecialization ADD CONSTRAINT
	FK_UserListingSpecialization_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserListingSpecialization SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserListingSpecialization', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserListingSpecialization', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserListingSpecialization', 'Object', 'CONTROL') as Contr_Per 