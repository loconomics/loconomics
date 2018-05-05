delete from searchsubcategorySolution
where
searchsubcategoryid = 38;

delete from searchsubcategory where
searchsubcategoryid = 38;

delete from solution where
solutionid in (258,
259,
260,
262,
263,
264,
265,
268,
270,
267);

UPDATE dbo.Solution SET Name = N'Floral Arrangements and Design' WHERE SolutionID = 102 AND LanguageID = 1 AND CountryID = 1;
UPDATE dbo.Solution SET Name = N'Invitations' WHERE SolutionID = 261 AND LanguageID = 1 AND CountryID = 1;
UPDATE dbo.Solution SET Name = N'Dance Lessons' WHERE SolutionID = 266 AND LanguageID = 1 AND CountryID = 1;

INSERT INTO dbo.SearchSubCategorySolution (SearchSubCategoryID, SolutionID, LanguageID, CountryID, DisplayRank, CreatedDate, UpdatedDate, ModifiedBy) VALUES (36, 261, 1, 1, 550, '3/19/2018', '3/19/2018', N'jd');
INSERT INTO dbo.SearchSubCategorySolution (SearchSubCategoryID, SolutionID, LanguageID, CountryID, DisplayRank, CreatedDate, UpdatedDate, ModifiedBy) VALUES (36, 266, 1, 1, 500, '3/19/2018', '3/19/2018', N'jd');
INSERT INTO dbo.SearchSubCategorySolution (SearchSubCategoryID, SolutionID, LanguageID, CountryID, DisplayRank, CreatedDate, UpdatedDate, ModifiedBy) VALUES (36, 269, 1, 1, 450, '3/19/2018', '3/19/2018', N'jd');
INSERT INTO dbo.SearchSubCategorySolution (SearchSubCategoryID, SolutionID, LanguageID, CountryID, DisplayRank, CreatedDate, UpdatedDate, ModifiedBy) VALUES (36, 271, 1, 1, 400, '3/19/2018', '3/19/2018', N'jd');
INSERT INTO dbo.SearchSubCategorySolution (SearchSubCategoryID, SolutionID, LanguageID, CountryID, DisplayRank, CreatedDate, UpdatedDate, ModifiedBy) VALUES (8, 266, 1, 1, 50, '3/19/2018', '3/19/2018', N'jd');



