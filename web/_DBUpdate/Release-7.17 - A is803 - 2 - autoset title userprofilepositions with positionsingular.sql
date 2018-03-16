UPDATE userprofilepositions
SET title = (
	SELECT TOP 1 PositionSingular 
	FROM positions as p
	WHERE p.PositionID = userprofilepositions.PositionID
	and p.LanguageID = userprofilepositions.LanguageID
	and p.CountryID = userprofilepositions.CountryID )
