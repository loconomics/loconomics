IF OBJECT_ID('dbo.authorizations', 'U') IS NOT NULL
  DROP TABLE dbo.authorizations
GO

CREATE TABLE dbo.authorizations
(
	Token varchar(216) PRIMARY KEY,
	UserID int NOT NULL,
	Scope varchar(100),
	CreatedDate datetimeoffset(0),
	ClientAddress varchar(64),
	UserAgent text
)
GO
