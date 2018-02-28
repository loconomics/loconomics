IF OBJECT_ID('dbo.authorizations', 'U') IS NOT NULL
  DROP TABLE dbo.authorizations
GO

CREATE TABLE dbo.authorizations
(
	AuthorizationID int NOT NULL IDENTITY (1, 1) PRIMARY KEY,
	Token varchar(216) ,
	UserID int NOT NULL,
	Scope varchar(100),
	CreatedDate datetimeoffset(0),
	ClientAddress varchar(64),
	UserAgent text
)
GO

CREATE UNIQUE NONCLUSTERED INDEX IX_authorizations_token ON dbo.authorizations
	(
	Token
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
