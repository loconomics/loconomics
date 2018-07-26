/*
   lunes, 17 de abril de 201716:38:33
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
ALTER TABLE dbo.UserPaymentPlan
	DROP CONSTRAINT DF_UserPaymentPlan_TotalPastDueAmount
GO
ALTER TABLE dbo.UserPaymentPlan
	DROP CONSTRAINT DF_UserPaymentPlan_DaysPastDue
GO
CREATE TABLE dbo.Tmp_UserPaymentPlan
	(
	UserPaymentPlanID int NOT NULL IDENTITY (1, 1),
	UserID int NOT NULL,
	SubscriptionID varchar(250) NOT NULL,
	PaymentPlan varchar(25) NOT NULL,
	PaymentMethod varchar(50) NOT NULL,
	PaymentPlanLastChangedDate datetimeoffset(0) NOT NULL,
	NextPaymentDueDate datetimeoffset(0) NULL,
	NextPaymentAmount money NULL,
	LastPaymentDate datetimeoffset(0) NOT NULL,
	LastPaymentAmount money NOT NULL,
	FirstBillingDate datetimeoffset(0) NOT NULL,
	SubscriptionEndDate datetimeoffset(0) NULL,
	PaymentMethodToken varchar(250) NOT NULL,
	PaymentExpiryDate datetimeoffset(0) NOT NULL,
	PlanStatus varchar(50) NOT NULL,
	DaysPastDue int NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_UserPaymentPlan SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_UserPaymentPlan ADD CONSTRAINT
	DF_UserPaymentPlan_DaysPastDue DEFAULT ((0)) FOR DaysPastDue
GO
SET IDENTITY_INSERT dbo.Tmp_UserPaymentPlan OFF
GO
IF EXISTS(SELECT * FROM dbo.UserPaymentPlan)
	 EXEC('INSERT INTO dbo.Tmp_UserPaymentPlan (UserID, SubscriptionID, PaymentPlan, PaymentMethod, PaymentPlanLastChangedDate, NextPaymentDueDate, NextPaymentAmount, LastPaymentDate, LastPaymentAmount, FirstBillingDate, SubscriptionEndDate, PaymentMethodToken, PaymentExpiryDate, PlanStatus, DaysPastDue)
		SELECT UserID, SubscriptionID, PaymentPlan, PaymentMethod, PaymentPlanLastChangedDate, NextPaymentDueDate, NextPaymentAmount, LastPaymentDate, LastPaymentAmount, FirstBillingDate, SubscriptionEndDate, PaymentMethodToken, PaymentExpiryDate, PlanStatus, DaysPastDue FROM dbo.UserPaymentPlan WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.UserPaymentPlan
GO
EXECUTE sp_rename N'dbo.Tmp_UserPaymentPlan', N'UserPaymentPlan', 'OBJECT' 
GO
ALTER TABLE dbo.UserPaymentPlan ADD CONSTRAINT
	PK__Owner__1788CCAC6A7BAA63 PRIMARY KEY CLUSTERED 
	(
	UserPaymentPlanID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserPaymentPlan', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserPaymentPlan', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserPaymentPlan', 'Object', 'CONTROL') as Contr_Per 