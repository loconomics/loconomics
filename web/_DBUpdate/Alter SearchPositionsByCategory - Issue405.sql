ALTER PROCEDURE [dbo].[SearchPositionsByCategory]
	@LanguageID int
	,@CountryID int
	,@Category nvarchar(400)
	,@City nvarchar(400)
AS
BEGIN
	
	
	SET NOCOUNT ON;
	
	DECLARE @ServiceCategoryID AS INT
	SELECT @ServiceCategoryID = ServiceCategoryID 
	FROM servicecategory 
	WHERE Name = @Category
		AND LanguageID = @LanguageID 
		AND CountryID = @CountryID

    SELECT	P.PositionID
			,P.PositionPlural
			,P.PositionSingular
			,P.PositionDescription
			,P.PositionSearchDescription
			
			
			
			,coalesce((SELECT
				avg( (coalesce(UR2.Rating1, 0) + coalesce(UR2.Rating2, 0) + coalesce(UR2.Rating3, 0)) / 3) As AVR
			  FROM UserReviews As UR2
				INNER JOIN
				  UserProfilePositions As UP2
				  ON UP2.PositionID = UR2.PositionID
				    AND UR2.ProviderUserID = UP2.UserID
					AND UP2.LanguageID = @LanguageID
					AND UP2.CountryID = @CountryID
					AND UP2.Active = 1
					AND UP2.StatusID = 1
			  WHERE UR2.PositionID = P.PositionID
			), 0) As AverageRating
			
			
			,sum(ur.TotalRatings) As TotalRatings
			,avg(US.ResponseTimeMinutes) As AverageResponseTimeMinutes
			,avg(PHR.HourlyRate) As AverageHourlyRate
			,count(UP.UserID) As ProvidersCount
			
	FROM	Positions As P
			 INNER JOIN
			ServiceCategoryPosition As SCP
			  ON P.PositionID = SCP.PositionID
				AND P.LanguageID = SCP.LanguageID
				AND P.CountryID = SCP.CountryID
				
			 LEFT JOIN
			UserProfilePositions As UP
			  ON UP.PositionID = P.PositionID
			    AND UP.LanguageID = P.LanguageID
			    AND UP.CountryID = P.CountryID
			    AND UP.Active = 1
			    AND UP.StatusID = 1
			 LEFT JOIN
			UserReviewScores AS UR
			  ON UR.UserID = UP.UserID
				AND UR.PositionID = UP.PositionID
			 LEFT JOIN
			UserStats As US
			  ON US.UserID = UP.UserID
			 LEFT JOIN
			(SELECT	ProviderPackage.ProviderUserID As UserID
					,ProviderPackage.PositionID
					,min(PriceRate) As HourlyRate
					,LanguageID
					,CountryID
			 FROM	ProviderPackage
			 WHERE	ProviderPackage.Active = 1
					AND ProviderPackage.PriceRateUnit like 'HOUR' 
					AND ProviderPackage.PriceRate > 0
			 GROUP BY	ProviderPackage.ProviderUserID, ProviderPackage.PositionID
						,LanguageID, CountryID
			) As PHR
			  ON PHR.UserID = UP.UserID
			    AND PHR.PositionID = UP.PositionID
				AND PHR.LanguageID = P.LanguageID
				AND PHR.CountryID = P.CountryID
	WHERE
			SCP.ServiceCategoryID = @ServiceCategoryID
			 AND
			SCP.Active = 1
			 AND
			P.Active = 1
			 AND
			P.LanguageID = @LanguageID
			 AND
			P.CountryID = @CountryID
	GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
	ORDER BY ProvidersCount DESC, P.DisplayRank, P.PositionPlural
END
