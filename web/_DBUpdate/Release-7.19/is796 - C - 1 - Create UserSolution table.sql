CREATE TABLE dbo.UserSolution
(
UserSolutionID int NOT NULL IDENTITY (1, 1),
UserID int NOT NULL,
UserListingID int NOT NULL,
SolutionID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
ModifiedBy nvarchar(4) DEFAULT 'sys' NOT NULL,
Active bit DEFAULT 1 NOT NULL,
CONSTRAINT PK_UserSolution PRIMARY KEY (UserSolutionID),
CONSTRAINT
	FK_UserSolution_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION,
CONSTRAINT
	FK_UserSolution_Solution FOREIGN KEY
	(
	SolutionID,
	LanguageID,
	CountryID
	) REFERENCES dbo.Solution
	(
	SolutionID,
	LanguageID,
	CountryID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION,
CONSTRAINT
	FK_UserSolution_userprofilepositions FOREIGN KEY
	(
	UserListingID
	) REFERENCES dbo.userprofilepositions
	(
	UserListingID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
);
