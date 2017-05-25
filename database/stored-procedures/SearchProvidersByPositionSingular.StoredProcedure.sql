/****** Object:  StoredProcedure [dbo].[SearchProvidersByPositionSingular]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SearchProvidersByPositionSingular]
@LanguageID int,
@CountryID int,
@PositionSingular varchar(300),
@City nvarchar(400)
 WITH EXEC AS CALLER
AS

--EXEC dbo.SearchProvidersByPositionSingular 1,1,'Cleaner', 'San Francisco'

	SELECT 
		d.userID
		,d.firstName
		,d.lastName
		,d.secondLastName
		,d.businessName
		,a.PositionID As jobTitleID
		--,c.PositionSingular
		--,a.UpdatedDate
		,jobTitles=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID AND UP0.StatusID = 1 AND UP0.Active = 1 AND P0.Active = 1 AND P0.Approved <> 0 FOR XML PATH('')) , 1 , 1 , '' )
		--,rs.Rating1
		--,rs.Rating2
		--,rs.Rating3
		--,rs.Rating4 
	FROM dbo.users d 
	JOIN dbo.userprofilepositions a 
		ON d.UserID = a.UserID 
	JOIN  positions c 
		ON a.PositionID = c.PositionID 
		AND a.LanguageID = c.LanguageID
		AND a.CountryID = c.CountryID
	--LEFT JOIN dbo.UserReviewScores rs ON (d.UserID = rs.UserID)
	WHERE
		a.LanguageID = @LanguageID
		AND a.CountryID = @CountryID
		AND d.Active = 1
		AND a.Active = 1
		AND a.StatusID = 1
		AND c.Active = 1
		AND c.PositionSingular like @PositionSingular
GO
