CREATE TABLE dbo.SearchCategorySearchSubCategory
(SearchCategoryID int NOT NULL,
SearchSubCategoryID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
ModifiedBy nvarchar(4) DEFAULT 'sys' NOT NULL,
PRIMARY KEY (SearchCategoryID,SearchSubCategoryID,LanguageID,CountryID));