/****** Object:  StoredProcedure [dbo].[SearchTopProvidersByPosition]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro	
-- Create date: 2013-01-07
-- Description:	Get a short list of providers
-- in the specific position for the search page
-- results. List is limited to the top most
-- rated providers.
-- Minimum information is returned, not full
-- user information.
-- =============================================
CREATE PROCEDURE [dbo].[SearchTopProvidersByPosition]
	@LanguageID int,
	@CountryID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	SELECT TOP 8 UserID
		,FirstName
		--, Rating -- returning Rating for testing only
	FROM (

		SELECT	UP.UserID
				,U.FirstName
				,((coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0)) / 3) As Rating
		FROM	Users As U
				 INNER JOIN
				UserProfilePositions As UP
				  ON UP.UserID = U.UserID
				 LEFT JOIN
				UserReviewScores AS UR
				  ON UR.UserID = UP.UserID
					AND UR.PositionID = UP.PositionID
		WHERE
				U.Active = 1
				 AND
				UP.PositionID = @PositionID
				 AND
				UP.Active = 1
				 AND
				UP.StatusID = 1
				 AND
				UP.LanguageID = @LanguageID
				 AND
				UP.CountryID = @CountryID
	) As T
	-- The top best rated providers:
	ORDER BY Rating DESC 

END
GO
