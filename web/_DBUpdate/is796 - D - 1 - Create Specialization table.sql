CREATE TABLE dbo.Specialization
(SpecializationID int NOT NULL,
SolutionID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
Name nvarchar(100) NOT NULL,
Description nvarchar(2000),
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
CreatedBy nvarchar(12) DEFAULT 'staff' NOT NULL,
Approved bit DEFAULT 0 NOT NULL,
Active bit DEFAULT 1 NOT NULL,
PRIMARY KEY (SpecializationID,LanguageID, CountryID));