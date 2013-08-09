/*
   viernes, 09 de agosto de 201316:52:58
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
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_IsProviderVariable
GO
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_IsCustomerVariable
GO
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_Active
GO
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_CreatedDate
GO
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_UpdatedDate
GO
ALTER TABLE dbo.PricingVariableDefinition
	DROP CONSTRAINT DF_PricingVariableDefinition_ModifiedBy
GO
CREATE TABLE dbo.Tmp_PricingVariableDefinition
	(
	PricingVariableID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	PositionID int NOT NULL,
	PricingTypeID int NOT NULL,
	InternalName varchar(60) NOT NULL,
	IsProviderVariable bit NOT NULL,
	IsCustomerVariable bit NOT NULL,
	DataType varchar(50) NOT NULL,
	VariableLabel nvarchar(100) NULL,
	VariableLabelPopUp nvarchar(200) NULL,
	VariableNameSingular nvarchar(60) NULL,
	VariableNamePlural nvarchar(60) NULL,
	NumberIncludedLabel nvarchar(100) NULL,
	NumberIncludedLabelPopUp nvarchar(200) NULL,
	HourlySurchargeLabel nvarchar(100) NULL,
	HourlySurchargeLabelPopUp nvarchar(200) NULL,
	MinNumberAllowedLabel nvarchar(100) NULL,
	MinNumberAllowedLabelPopUp nvarchar(200) NULL,
	MaxNumberAllowedLabel nvarchar(100) NULL,
	MaxNumberAllowedLabelPopUp nvarchar(200) NULL,
	CalculateWithVariableID int NULL,
	Active bit NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_IsProviderVariable DEFAULT ((0)) FOR IsProviderVariable
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_IsCustomerVariable DEFAULT ((0)) FOR IsCustomerVariable
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_Active DEFAULT ((1)) FOR Active
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_CreatedDate DEFAULT (getdate()) FOR CreatedDate
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_UpdatedDate DEFAULT (getdate()) FOR UpdatedDate
GO
ALTER TABLE dbo.Tmp_PricingVariableDefinition ADD CONSTRAINT
	DF_PricingVariableDefinition_ModifiedBy DEFAULT ('sys') FOR ModifiedBy
GO
IF EXISTS(SELECT * FROM dbo.PricingVariableDefinition)
	 EXEC('INSERT INTO dbo.Tmp_PricingVariableDefinition (PricingVariableID, LanguageID, CountryID, PositionID, PricingTypeID, InternalName, IsProviderVariable, IsCustomerVariable, DataType, VariableLabel, VariableLabelPopUp, VariableNameSingular, VariableNamePlural, NumberIncludedLabel, NumberIncludedLabelPopUp, CalculateWithVariableID, Active, CreatedDate, UpdatedDate, ModifiedBy)
		SELECT PricingVariableID, LanguageID, CountryID, PositionID, PricingTypeID, InternalName, IsProviderVariable, IsCustomerVariable, DataType, VariableLabel, VariableLabelPopUp, VariableNameSingular, VariableNamePlural, NumberIncludedLabel, NumberIncludedLabelPopup, CalculateWithVariableID, Active, CreatedDate, UpdatedDate, ModifiedBy FROM dbo.PricingVariableDefinition WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.PricingVariableDefinition
GO
EXECUTE sp_rename N'dbo.Tmp_PricingVariableDefinition', N'PricingVariableDefinition', 'OBJECT' 
GO
ALTER TABLE dbo.PricingVariableDefinition ADD CONSTRAINT
	PK_PricingVariableDefinition PRIMARY KEY CLUSTERED 
	(
	PricingVariableID,
	LanguageID,
	CountryID,
	PositionID,
	PricingTypeID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.PricingVariableDefinition', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.PricingVariableDefinition', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.PricingVariableDefinition', 'Object', 'CONTROL') as Contr_Per 