/*
   miércoles, 06 de noviembre de 201312:47:52
   User: 
   Server: localhost\SQLEXPRESS
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
CREATE TABLE dbo.ProviderPaymentAccount
	(
	ProviderUserID int NOT NULL,
	MerchantAccountID nvarchar(100) NOT NULL,
	Status nvarchar(50) NOT NULL,
	Message nvarchar(400) NULL,
	bt_signature nvarchar(MAX) NULL,
	bt_payload nvarchar(MAX) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.ProviderPaymentAccount ADD CONSTRAINT
	PK_ProviderPaymentAccount PRIMARY KEY CLUSTERED 
	(
	ProviderUserID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.ProviderPaymentAccount SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.ProviderPaymentAccount', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.ProviderPaymentAccount', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.ProviderPaymentAccount', 'Object', 'CONTROL') as Contr_Per 