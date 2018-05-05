CREATE TABLE dbo.UserListingSpecialization
(UserID int NOT NULL,
UserListingID int NOT NULL,
SpecializationID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
ModifiedBy nvarchar(4) DEFAULT 'sys' NOT NULL,
Active bit DEFAULT 1 NOT NULL,
PRIMARY KEY (UserID,UserListingID,SpecializationID,LanguageID, CountryID));