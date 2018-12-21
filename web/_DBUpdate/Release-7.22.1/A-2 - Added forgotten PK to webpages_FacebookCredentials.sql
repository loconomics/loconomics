ALTER TABLE webpages_FacebookCredentials
ADD [id]         INT    NOT NULL IDENTITY (1, 1)

GO
ALTER TABLE webpages_FacebookCredentials
ADD CONSTRAINT [PK_webpages_FacebookCredentials] PRIMARY KEY CLUSTERED ([id] ASC)
GO
