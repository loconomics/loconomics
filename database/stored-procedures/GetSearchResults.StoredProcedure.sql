/****** Object:  StoredProcedure [dbo].[GetSearchResults]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[GetSearchResults]
@LanguageID int, @CountryID int, @SearchTerm varchar(300), @SubCategory varchar(300)
 WITH EXEC AS CALLER
AS

--EXEC dbo.GetSearchResults 1,1,'%',''

IF @SubCategory <> ''
BEGIN
	DECLARE @ServiceCategoryID AS INT

	SELECT @ServiceCategoryID = ServiceCategoryID 
	FROM servicecategory 
	WHERE Name = @SubCategory 
		AND LanguageID = @LanguageID 
		AND CountryID = @CountryID

	SELECT 
		d.UserID
		,d.FirstName
		,d.LastName
		,a.PositionID
		,c.PositionSingular
		,a.UpdatedDate
		,Positions=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID FOR XML PATH('')) , 1 , 1 , '' )
		,S.Name as ServiceName 
	FROM dbo.users d 
	JOIN dbo.userprofilepositions a 
		ON d.UserID = a.UserID 
	JOIN  positions c 
		ON a.PositionID = c.PositionID
		AND a.LanguageID = c.LanguageID
		AND a.CountryID = c.CountryID
	JOIN dbo.servicecategoryposition SCP
		ON C.PositionID = SCP.PositionID
		AND a.LanguageID = SCP.LanguageID
		AND a.CountryID = SCP.CountryID
	JOIN dbo.servicecategory S
		ON SCP.ServiceCategoryID = S.ServiceCategoryID
		AND a.LanguageID = S.LanguageID
		AND a.CountryID = S.CountryID
	WHERE S.ServiceCategoryID = @ServiceCategoryID
		AND a.LanguageID = @LanguageID and a.CountryID = @CountryID
		AND d.Active = 1
		AND a.Active = 1
		AND a.StatusID = 1
		AND c.Active = 1
		AND s.Active = 1
		AND scp.Active = 1
		AND (
			@SearchTerm like ''
			 OR
			c.PositionSingular like @SearchTerm
			 OR
			c.PositionPlural like @SearchTerm
			 OR
			c.PositionDescription like @SearchTerm
			 OR
			c.Aliases like @SearchTerm
			 OR
			c.GovPosition like @SearchTerm
			 OR
			c.GovPositionDescription like @SearchTerm
		)
END

ELSE --IF @SearchTerm <> '%'
BEGIN
	SELECT 
		d.UserID
		,d.FirstName
		,d.LastName
		,a.PositionID
		,c.PositionSingular
		,a.UpdatedDate
		,Positions=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID FOR XML PATH('')) , 1 , 1 , '' )
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
		AND c.Active = 1
		AND (
			c.PositionSingular like @SearchTerm
			 OR
			c.PositionPlural like @SearchTerm
			 OR
			c.PositionDescription like @SearchTerm
			 OR
			c.Aliases like @SearchTerm
			 OR
			c.GovPosition like @SearchTerm
			 OR
			c.GovPositionDescription like @SearchTerm
			 OR
			a.PositionIntro like @SearchTerm
			 OR
			EXISTS (
				SELECT *
				FROM	UserProfileServiceAttributes As UA
						 INNER JOIN
						ServiceAttribute As SA
						  ON UA.ServiceAttributeID = SA.ServiceAttributeID
							AND UA.Active = 1
							AND SA.Active = 1
							AND SA.LanguageID = UA.LanguageID
							AND SA.CountryID = UA.CountryID
				WHERE
						UA.UserID = a.UserID
						AND UA.PositionID = a.PositionID
						AND UA.LanguageID = @LanguageID
						AND UA.CountryID = @CountryID
						AND (
						 SA.Name like @SearchTerm
						  OR
						 SA.ServiceAttributeDescription like @SearchTerm
						)
			)
		)
END
GO
