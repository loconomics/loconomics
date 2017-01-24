using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// PublicUserStats
    /// </summary>
    public class PublicUserJobStats
    {
        #region Fields
        private int userID;
        private int jobTitleID;
        public long servicesCount;
        public decimal? minServicePrice;
        public decimal? minUnitRate;
        public string priceRateUnit;
        public string minServiceValue;
        #endregion

        #region Instances
        public static PublicUserJobStats FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserJobStats
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                servicesCount = record.servicesCount,
                minServicePrice = record.minServicePrice,
                minUnitRate = record.minUnitRate,
                priceRateUnit = record.priceRateUnit,
                minServiceValue = record.minServiceValue
            };
        }
        #endregion

        #region Fetch
        public static PublicUserJobStats Get(int userID, int jobTitleID, LcRest.ServiceProfessionalService.Visibility visibility)
        {
            const string sqlVariableDeclaration = @"
                DECLARE @userID AS int
                SET @userID = @0
                DECLARE @jobTitleID AS int
                SET @jobTitleID = @1
                DECLARE @LanguageID int
                SET @LanguageID = 1
                DECLARE @CountryID int
                SET @CountryID = 1
                    
                ;";

            const string sqlProviderPackageForClient = @"
                WITH ProviderPackageForClient AS
                (
                      SELECT *
                      FROM ProviderPackage
                      WHERE ProviderPackage.Active = 1
                          AND ProviderUserID = @userID
                          AND PositionID = @jobTitleID
                          AND LanguageID = @LanguageID
                          AND CountryID = @CountryID
                          AND VisibleToClientID IN ({0}) -- placeholder for format
                    ) -- END ProviderPackageForClient
                ,";

            const string sqlRemainder = @"
                CTE AS
                    (
 					SELECT 
 							MSP.ProviderUserID
                            ,MSP.PositionID 
                            ,MSP.LanguageID
                            ,MSP.CountryID
                            ,MSP.minServicePrice
                            ,MSP.servicesCount
                            ,MUP.PriceRateUnit
                            ,MUP.minUnitRate
                            ,MUP.UnitPackages
                            ,CASE WHEN MUP.rn > 0 THEN MUP.rn ELSE 1 END as rn
                            FROM 
                        (SELECT 
                            ProviderUserID
                            ,PositionID
                            ,LanguageID
                            ,CountryID
                            ,min(ProviderPackagePrice) as minServicePrice
                            ,servicesCount=
                            (SELECT count(*) FROM ProviderPackageForClient)
                     FROM
                            ProviderPackageForClient
                            WHERE ProviderPackageForClient.PricingTypeID != 7

                         GROUP BY
                            ProviderUserID, PositionID, LanguageID, CountryID) MSP
                            LEFT JOIN
                            (
  							SELECT 
	                            ProviderUserID
	                            ,PositionID
	                            ,LanguageID
	                            ,CountryID
	                            ,PriceRateUnit
	                            ,min(PriceRate) as minUnitRate
	                            ,count(distinct ProviderPackageID) as UnitPackages
	                            ,ROW_NUMBER() OVER (PARTITION BY ProviderUserID, PositionID, LanguageID, CountryID 
                                  ORDER BY count(distinct ProviderPackageID) DESC)
                                  AS rn -- lowest RN means highest number of packages for a PriceRateUnit
                            FROM ProviderPackageForClient
                            WHERE PriceRate is not null

                         GROUP BY
                            ProviderUserID, PositionID, LanguageID, CountryID, PriceRateUnit) as MUP
                            ON
                            MSP.ProviderUserID=MUP.ProviderUserID
                            AND MSP.PositionID=MUP.PositionID
                            AND MSP.LanguageID=MUP.LanguageID
                            AND MSP.CountryID=MUP.CountryID
                    )
                    SELECT
                    ProviderUserID as userID
                    ,PositionID as jobTitleID
                    ,servicesCount
                    ,minServicePrice
                    ,minUnitRate
                    ,priceRateUnit
                    ,CASE WHEN (minUnitRate > 0 AND minServicePrice > 0) AND minServicePrice <= minUnitRate THEN '$' + convert(varchar,  minServicePrice)
                    WHEN (minUnitRate > 0 AND minServicePrice > 0) AND minUnitRate < minServicePrice THEN '$' + convert(varchar,  minUnitRate) + '/' + PriceRateUnit
                    WHEN (minServicePrice > 0 AND minUnitRate is null) THEN '$' + convert(varchar,  minServicePrice)
                    WHEN (minUnitRate > 0 AND minServicePrice <=0 ) THEN '$' + convert(varchar,  minUnitRate) + '/' + PriceRateUnit ELSE NULL END as minServiceValue
                    FROM CTE
                    WHERE rn = 1 -- select the stats at the price rate unit with the most packages
                ";

            using (var db = new LcDatabase())
            {
                // Database.Query does not natively expand SQL IN clause list, so do it manually
                string sqlProviderPackageForClientExpanded = String.Format(sqlProviderPackageForClient, String.Join(",", visibility.VisibleToClientIDs()));

                return FromDB(db.QuerySingle(sqlVariableDeclaration 
                                               + sqlProviderPackageForClientExpanded
                                               + sqlRemainder, 
                                               userID, jobTitleID));
            }
        }
        #endregion
    }
}