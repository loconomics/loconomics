using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class JobTitleSearchResult
    {
        #region Fields
        public int jobTitleID;
        public string singularName;
        public string pluralName;
        public string description;
        public string searchDescription;
        public decimal averageRating;
        public long totalRatings;
        public decimal? averageResponseTimeMinutes;
        public decimal? averageHourlyRate;
        public long serviceProfessionalsCount;
        #endregion

        #region Instances
        public static JobTitleSearchResult FromDB(dynamic record)
        {
            if (record == null) return record;
            return new JobTitleSearchResult
            {
                jobTitleID = record.jobTitleID,
                singularName = record.singularName,
                pluralName = record.pluralName,
                description = record.description,
                searchDescription = record.searchDescription,
                averageRating = record.averageRating,
                totalRatings = record.totalRatings,
                averageResponseTimeMinutes = record.averageResponseTimeMinutes,
                averageHourlyRate = record.averageHourlyRate,
                serviceProfessionalsCount = record.serviceProfessionalsCount
            };
        }
        #endregion

        #region Fetch
        public static IEnumerable<JobTitleSearchResult> SearchByCategoryID(int categoryID, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                    DECLARE @categoryID AS int
                    SET @categoryID = @0
                    DECLARE @origLat DECIMAL(12, 9)
                    SET @origLat=@1
                    DECLARE @origLong DECIMAL(12, 9)
                    SET @origLong=@2
                    DECLARE @SearchDistance int
                    SET @SearchDistance = @3
                    DECLARE @LanguageID int                    
                    SET @LanguageID = @4
                    DECLARE @CountryID int
                    SET @CountryID = @5
                    DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)
                    SELECT	
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
                            ,avg(PHR.HourlyRate) As averageHourlyRate
                            ,count (distinct SPC.UserID) As serviceProfessionalsCount

                    FROM	Positions As P
                             LEFT JOIN
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
                            SCP.ServiceCategoryID = @categoryID
                             AND
                            SCP.Active = 1
                             AND
                            P.Active = 1
                             AND
                            P.LanguageID = @LanguageID
                             AND
                            P.CountryID = @CountryID
                        AND (p.Approved = 1 Or p.Approved is null) 
							AND dbo.fx_IfNW(p.PositionSingular, null) is not null                    
                    GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
                    ORDER BY serviceProfessionalsCount DESC, P.DisplayRank, P.PositionPlural  
                                ", categoryID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }
/* TODO Create ServiceSubCategoryPosition table in db and map positions and double-check query
        
        public static IEnumerable<JobTitleSearchResult> SearchBySubCategoryID(int ServiceSubCategoryID, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                    DECLARE @ServiceSubCategoryID AS int
                    SET @ServiceSubCategoryID = @0
                    DECLARE @origLat DECIMAL(12, 9)
                    SET @origLat=@1
                    DECLARE @origLong DECIMAL(12, 9)
                    SET @origLong=@2
                    DECLARE @SearchDistance int
                    SET @SearchDistance = @3
                    DECLARE @LanguageID int                    
                    SET @LanguageID = @4
                    DECLARE @CountryID int
                    SET @CountryID = @5
                    DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)
                    SELECT	
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
                            ,avg(PHR.HourlyRate) As averageHourlyRate
                            ,count (distinct SPC.UserID) As serviceProfessionalsCount

                    FROM	Positions As P
                             INNER JOIN
                            ServiceSubCategoryPosition As SSCP
                              ON P.PositionID = SSCP.PositionID
                                AND P.LanguageID = SSCP.LanguageID
                                AND P.CountryID = SSCP.CountryID
                             INNER JOIN
                            ServiceSubCategory As SSC
                              ON SSCP.ServiceCategoryID = SSC.ServiceCategoryID
                                AND SSCP.LanguageID = SSC.LanguageID
                                AND SSCP.CountryID = SSC.CountryID
                             LEFT JOIN
                            UserProfilePositions As UP
                              ON UP.PositionID = P.PositionID
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
                            SSC.ServiceSubCategoryID = @ServiceSubCategoryID
                             AND
                            SSCP.Active = 1
                             AND
                            P.Active = 1
                             AND
                            P.LanguageID = @LanguageID
                             AND
                            P.CountryID = @CountryID
                            AND (p.Approved = 1 Or p.Approved is null) 
							AND dbo.fx_IfNW(p.PositionSingular, null) is not null           
                    GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
                    ORDER BY serviceProfessionalsCount DESC, P.DisplayRank, P.PositionPlural  
                                ", ServiceSubCategoryID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }*/
        public static IEnumerable<JobTitleSearchResult> SearchBySearchTerm(string SearchTerm, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                    DECLARE @SearchTerm varchar(150)
                    SET @SearchTerm = @0
                    DECLARE @origLat DECIMAL(12, 9)
                    SET @origLat=@1
                    DECLARE @origLong DECIMAL(12, 9)
                    SET @origLong=@2
                    DECLARE @SearchDistance int
                    SET @SearchDistance = @3
                    DECLARE @LanguageID int                    
                    SET @LanguageID = @4
                    DECLARE @CountryID int
                    SET @CountryID = @5
                    DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)
                       SELECT	
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
                            ,avg(PHR.HourlyRate) As averageHourlyRate
                            ,count (distinct SPC.UserID) As serviceProfessionalsCount

                    FROM	Positions As P
                             LEFT JOIN
                            UserProfilePositions As UP
                              ON UP.PositionID = P.PositionID
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
                            P.Active = 1
                             AND
                            P.LanguageID = @LanguageID
                             AND
                            P.CountryID = @CountryID
                            AND (p.Approved = 1 Or p.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
							AND dbo.fx_IfNW(p.PositionSingular, null) is not null
							AND (
								p.PositionSingular like @SearchTerm
								 OR
								p.PositionPlural like @SearchTerm
								 OR
								p.PositionDescription like @SearchTerm
								 OR
								p.Aliases like @SearchTerm
								 OR
								p.GovPosition like @SearchTerm
								 OR
								p.GovPositionDescription like @SearchTerm
								 OR
								EXISTS (
									SELECT *
									FROM	UserProfileServiceAttributes As SP
											 INNER JOIN
											ServiceAttribute As SA
											  ON SP.ServiceAttributeID = SA.ServiceAttributeID
												AND SP.Active = 1
												AND SA.Active = 1
												AND SA.LanguageID = SP.LanguageID
												AND SA.CountryID = SP.CountryID
									WHERE
											SP.PositionID = p.PositionID
											AND SA.LanguageID = @LanguageID
											AND SA.CountryID = @CountryID
											AND (
											 SA.Name like @SearchTerm
											  OR
											 SA.ServiceAttributeDescription like @SearchTerm
											)
								)
								)
                    GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
                    ORDER BY serviceProfessionalsCount DESC, P.DisplayRank, P.PositionPlural    
                                ", "%" + SearchTerm + "%", origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }
        #endregion
    }
}