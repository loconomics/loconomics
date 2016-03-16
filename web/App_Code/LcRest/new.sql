DECLARE @jobTitleID AS int
SET @jobTitleID = 106
DECLARE @origLat DECIMAL(12, 9)
SET @origLat=37.788479
DECLARE @origLong DECIMAL(12, 9)
SET @origLong=-122.40297199999998
DECLARE @SearchDistance int
SET @SearchDistance = 30
DECLARE @LanguageID int                    
SET @LanguageID = 1
DECLARE @CountryID int
SET @CountryID = 1
DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)

;WITH CTE AS
(SELECT	
    P.PositionID as jobTitleID
    ,P.PositionPlural as pluralName
    ,P.PositionSingular as singularName
    ,P.PositionDescription as description
    ,P.PositionSearchDescription as searchDescription
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
        ), 0) As averageRating
    ,coalesce(sum(ur.TotalRatings), 0) As totalRatings
    ,avg(US.ResponseTimeMinutes) As averageResponseTimeMinutes
    ,count (distinct SPC.UserID) As serviceProfessionalsCount
    ,min(MSP.minServicePrice)
    ,sum(MSP.servicesCount)
    ,MUP.PriceRateUnit
    ,MUP.minUnitRate
    ,CASE WHEN MUP.rn > 0 THEN MUP.rn ELSE 1 END as rn
    ,P.DisplayRank
FROM	
    Positions As P
    LEFT JOIN
        ServiceCategoryPosition As SCP
    ON 
        P.PositionID = SCP.PositionID
        AND P.LanguageID = SCP.LanguageID
        AND P.CountryID = SCP.CountryID
    LEFT JOIN
        UserProfilePositions As UP
    ON 
        UP.PositionID = P.PositionID
        AND UP.LanguageID = P.LanguageID
        AND UP.CountryID = P.CountryID
        AND UP.Active = 1
        AND UP.StatusID = 1
    LEFT JOIN
        (SELECT up.PositionID, up.UserID
        FROM address a
        INNER JOIN
        serviceaddress sa
        ON a.addressID=sa.addressID
        INNER JOIN UserProfilePositions up
        ON sa.userID = up.UserID
        AND sa.PositionID = up.PositionID
        WHERE 
        a.Latitude IS NOT NULL
        AND a.Longitude IS NOT NULL
        AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000*0.621371 <=
        (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
        CONVERT(FLOAT, ServiceRadiusFromLocation)
        ELSE 
        @SearchDistance
        END)
        AND up.StatusID=1
        AND up.Active=1
        ) As SPC
    ON
        UP.PositionID = SPC.PositionID
    LEFT JOIN
        UserReviewScores AS UR
    ON 
        UR.UserID = UP.UserID
        AND UR.PositionID = UP.PositionID
    LEFT JOIN
        UserStats As US
    ON 
        US.UserID = UP.UserID
    LEFT JOIN
        (SELECT 
        ProviderUserID
        ,PositionID
        ,LanguageID
        ,CountryID
        ,min(ProviderPackagePrice) as minServicePrice
        ,count(*) as servicesCount
        FROM
        ProviderPackage
        WHERE 
        ProviderPackage.Active = 1 
        AND LanguageID = @LanguageID
        AND CountryID = @CountryID
        AND ProviderPackage.PricingTypeID != 7
        GROUP BY ProviderUserID, PositionID, LanguageID, CountryID) MSP
    LEFT JOIN
        (SELECT 
        ProviderUserID
        ,PositionID
        ,LanguageID
        ,CountryID
        ,PriceRateUnit
        ,min(PriceRate) as minUnitRate
        ,count(distinct ProviderPackageID) as UnitPackages
        ,ROW_NUMBER() OVER (PARTITION BY ProviderUserID, PositionID, LanguageID, CountryID 
        ORDER BY 
        count(distinct ProviderPackageID)
        DESC) AS rn                     
        FROM
        ProviderPackage
        WHERE 
        ProviderPackage.Active = 1 
        AND PriceRate is not null
        GROUP BY ProviderUserID, PositionID, LanguageID, CountryID, PriceRateUnit) as MUP
    ON
        MSP.ProviderUserID = MUP.ProviderUserID
        AND MSP.PositionID = MUP.PositionID
        AND MSP.LanguageID = MUP.LanguageID
        AND MSP.CountryID = MUP.CountryID
        AND MSP.ProviderUserID = UP.UserID
        AND MSP.PositionID = UP.PositionID
        AND MSP.LanguageID = P.LanguageID
        AND MSP.CountryID = P.CountryID
        AND P.PositionID = @jobTitleID
        AND SCP.Active = 1
        AND P.Active = 1
        AND P.LanguageID = @LanguageID
        AND P.CountryID = @CountryID
        AND (p.Approved = 1) 
        AND dbo.fx_IfNW(p.PositionSingular, null) is not null                    
GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, MUP.PriceRateUnit, MUP.minUnitRate, P.DisplayRank
)
SELECT
ProviderUserID as userID
,PositionID as jobTitleID
,pluralName
,singularName
,description
,searchDescription
,averageRating
,totalRatings
,averageResponseTimeMinutes
,servicesCount
,minServicePrice
,minUnitRate
,priceRateUnit
,CASE WHEN (minUnitRate > 0 AND minServicePrice > 0) AND minServicePrice <= minUnitRate THEN '$' + convert(varchar,  minServicePrice)
WHEN (minUnitRate > 0 AND minServicePrice > 0) AND minUnitRate < minServicePrice THEN '$' + convert(varchar,  minUnitRate) + '/' + PriceRateUnit
WHEN (minServicePrice > 0 AND minUnitRate is null) THEN '$' + convert(varchar,  minServicePrice)
WHEN (minUnitRate > 0 AND minServicePrice <=0 ) THEN '$' + convert(varchar,  minUnitRate) + '/' + PriceRateUnit ELSE NULL END as minServiceValue
FROM CTE
WHERE rn = 1 
ORDER BY serviceProfessionalsCount DESC, DisplayRank, pluralName  






DECLARE @jobTitleID AS int
SET @jobTitleID = 14
DECLARE @origLat DECIMAL(12, 9)
SET @origLat=37.788479
DECLARE @origLong DECIMAL(12, 9)
SET @origLong=-122.40297199999998
DECLARE @searchDistance int
SET @searchDistance = 30
DECLARE @languageID int                    
SET @languageID = 1
DECLARE @countryID int
SET @countryID = 1
DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)


SELECT
	P.PositionID as jobTitleID
    ,P.PositionPlural as pluralName
    ,P.PositionSingular as singularName
    ,P.PositionDescription as description
    ,P.PositionSearchDescription as searchDescription
    ,P.DisplayRank
    ,count(distinct spc.userID) as serviceProfessionalsCount
    ,CASE WHEN sum(coalesce(URS.TotalRatings,0)) > 0 THEN sum(coalesce(URS.ratingAvg,0)*coalesce(URS.TotalRatings,0))/sum(coalesce(URS.TotalRatings,0)) ELSE NULL END  As averageRating
    ,sum(coalesce(URS.TotalRatings,0)) as totalRatings
FROM	
    Positions As P
    LEFT JOIN
        UserProfilePositions As UP
    ON 
        UP.PositionID = P.PositionID
        AND UP.LanguageID = P.LanguageID
        AND UP.CountryID = P.CountryID
        AND UP.Active = 1
        AND UP.StatusID = 1
    LEFT JOIN
        (SELECT 
		up.UserID
		,up.PositionID
		,MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000*0.621371,1)) as distance
        FROM address a
        INNER JOIN
        serviceaddress sa
        ON a.addressID=sa.addressID
        INNER JOIN UserProfilePositions up
        ON sa.userID = up.UserID
        AND sa.PositionID = up.PositionID
        WHERE 
        a.Latitude IS NOT NULL
        AND a.Longitude IS NOT NULL
        AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000*0.621371 <=
        (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
        CONVERT(FLOAT, ServiceRadiusFromLocation)
        ELSE 
        @searchDistance
        END)
        AND up.StatusID=1
        AND up.Active=1
        GROUP BY up.PositionID, up.UserID) As SPC
    ON
        UP.PositionID = SPC.PositionID
        AND UP.UserID = SPC.UserID       		
    LEFT JOIN
       	(SELECT	
		UserID
		,PositionID
		,TotalRatings
		,sum(coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0))/3 as ratingAvg
        FROM UserReviewScores
        GROUP BY UserID, PositionID, TotalRatings) As URS
    ON 
        SPC.UserID = URS.UserID
        AND SPC.PositionID = URS.PositionID
        
WHERE
	P.PositionID = @jobTitleID
	AND P.Active = 1
    AND P.LanguageID = @languageID
    AND P.CountryID = @countryID
    AND p.Approved = 1 
    AND dbo.fx_IfNW(p.PositionSingular, null) is not null    
GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank

ORDER BY count(distinct spc.userID) DESC, P.DisplayRank
