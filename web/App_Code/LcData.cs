using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Static class simplifying data access
/// </summary>
public static partial class LcData
{
    #region Service Attributes and Categories
    public static Dictionary<int, Dictionary<string, object>> GetServiceCatsAndItsAttributes(int positionId, string filters = null, int userId = 0)
    {
        var rcats = new Dictionary<int, Dictionary<string, object>>();
        var catsFilter = new List<int>();
        // Set if the catsFilter is the list of cats to be excluded from the total (value: true)
        // or is a list of unique cats to be returned (value: false)
        bool excludeCats = false;
        // This bool config set that only attributes related to the userId must be returned (query field 'UserChecked' == True)
        bool onlyUserChecked = false;
        bool onlyBookingServices = false;

        List<string> filterList = new List<string>();
        // Reading filters:
        if (filters != null)
            filterList.AddRange(filters.Split(new char[] {' '}, StringSplitOptions.RemoveEmptyEntries));

        foreach(string filter in filterList)
            switch (filter) {
                case "provider-services-without-virtual-cats":
                case "provider-services":
                    //catsFilter.AddRange(new int[]{1, 2, 3, 4, 5, 7});
                    //catsFilter.AddRange(new int[]{1, 2, 4, 5, 7});
                    excludeCats = false;
                    break;
                case "without-special-cats":
                    catsFilter = SpecialServicesAttCats;
                    excludeCats = true;
                    break;
                case "only-special-cats":
                    catsFilter = SpecialServicesAttCats;
                    excludeCats = false;
                    break;
                case "only-user-checked":
                    onlyUserChecked = true;
                    break;
                case "booking-services":
                    onlyBookingServices = true;
                    break;
            }

        var sqlcat = "exec GetServiceAttributeCategories @0, @1, @2, @3";
        var sqlattribute = "exec GetServiceAttributes @0, @1, @2, @3, @4, @5";

        using (var db = Database.Open("sqlloco"))
        {
            var catrow = db.Query(sqlcat, positionId, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), onlyBookingServices);

            // Iterate the categories
            foreach (var cat in catrow)
            {
                // Apply filtering, if there are
                if (catsFilter.Count > 0 && 
                    (excludeCats && catsFilter.Contains(cat.ServiceAttributeCategoryID)
                     ||
                     !excludeCats && !catsFilter.Contains(cat.ServiceAttributeCategoryID)
                    ))
                {
                    continue;
                }
                // Copy data to a new structure
                var rcat = new Dictionary<string, object>(){
                    { "ServiceAttributeCategoryID", cat.ServiceAttributeCategoryID },
                    { "ServiceAttributeCategoryName", cat.ServiceCat },
                    { "ServiceAttributeCategoryDescription", cat.ServiceAttributeCategoryDescription },
                    { "RequiredInput", cat.RequiredInput },
                    { "SideBarCategory", cat.SideBarCategory }
                };
                // Getting attributes of the category
                rcat["ServiceAttributes"] = db.Query(sqlattribute, 
                    positionId, 
                    cat.ServiceAttributeCategoryID,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID(),
                    (userId == 0 ? null : (object)userId),
                    onlyUserChecked);
                rcats.Add(cat.ServiceAttributeCategoryID, rcat);
            }
            

            /* SPECIAL CASES */
            if (filterList.Contains("provider-services") || filterList.Contains("only-special-cats"))
            {
                // Adding the extra tables Language Levels and Experience Levels as 'virtual' categories, using the same
                // fields name to be easy to implement
                // Returning a 'virtual' language levels category
                var rcat = new Dictionary<string, object>(){
                    { "ServiceAttributeCategoryID", ServiceAttCatIDLanguageLevel },
                    { "ServiceAttributeCategoryName", LcRessources.GetText("Language Level") },
                    { "ServiceAttributeCategoryDescription", LcRessources.GetText("Language Level Description") },
                    { "RequiredInput", false },
                    { "SideBarCategory", true }
                };
                var levelsIndex = new Dictionary<int, int>();
                var langlevels = new List<object>();
                foreach(var level in LcData.GetLanguageLevels()) {
                    langlevels.Add(new Dictionary<string, object>{
                        { "ServiceAttributeDescription", level.LanguageLevelDescription },
                        { "ServiceAttributeID", level.LanguageLevelID },
                        { "ServiceAttribute", level.LanguageLevelName },
                        { "UserChecked", false }
                    });
                    levelsIndex.Add(level.LanguageLevelID, langlevels.Count - 1);
                }
                rcat["ServiceAttributes"] = langlevels;
                if (userId > 0){
                    rcat["LevelsIndex"] = levelsIndex;
                    rcat["UserSelectedLevels"] = LcData.GetUserLanguageLevels(userId, positionId);
                }
                rcats[ServiceAttCatIDLanguageLevel] = rcat;

                // Returning a 'virtual' experience levels category
                rcat = new Dictionary<string, object>(){
                    { "ServiceAttributeCategoryID", ServiceAttCatIDExperienceLevel },
                    { "ServiceAttributeCategoryName", LcRessources.GetText("Experience Level") },
                    { "ServiceAttributeCategoryDescription", LcRessources.GetText("Experience Level Description") },
                    { "RequiredInput", false },
                    { "SideBarCategory", true }
                };
                var explevels = new List<object>();
                foreach (var level in GetExperienceLevels(userId, positionId))
                {
                    if (!onlyUserChecked || level.UserChecked)
                        explevels.Add(new Dictionary<string, object>{
                            { "ServiceAttributeDescription", level.ExperienceLevelDescription },
                            { "ServiceAttributeID", level.ExperienceLevelID },
                            { "ServiceAttribute", level.ExperienceLevelName },
                            { "UserChecked", level.UserChecked }
                        });
                }
                rcat["ServiceAttributes"] = explevels;
                rcats[ServiceAttCatIDExperienceLevel] = rcat;
            }
        }
        return rcats;
    }
    /// <summary>
    /// List of special service attribute categories IDs, with a special
    /// treatment (languages, experience, ...)
    /// </summary>
    public static List<int> SpecialServicesAttCats = new List<int> { 
        ServiceAttCatIDExperienceLevel
        ,ServiceAttCatIDLanguages
        ,ServiceAttCatIDLanguageLevel
    };
    //public const int ServiceAttCatIDExperience = 1;
    public const int ServiceAttCatIDExperienceLevel = 4;
    public const int ServiceAttCatIDLanguages = 5;
    public const int ServiceAttCatIDLanguageLevel = -5; // Virtual cat, doesn't exist
    //public const int ServiceAttCatIDClientTypes = 7;

    #region Extra tables for Service attributes (Languages&Experience Levels)
    public static dynamic GetExperienceLevels(int UserID = 0, int PositionID = 0)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                DECLARE @UserID int, @PositionID int
                SET @UserID = @2
                SET @PositionID = @3

                SELECT  L.ExperienceLevelID, L.ExperienceLevelName, L.ExperienceLevelDescription,
		                  (case when @UserID <= 0 OR US.UserID is null then cast(0 as bit)
				                else cast(1 as bit)
		                  end) as UserChecked
                FROM    ExperienceLevel As L
                         LEFT JOIN
                        ServiceAttributeExperienceLevel As US
                          ON L.ExperienceLevelID = US.ExperienceLevelID
                            AND L.LanguageID = US.LanguageID AND L.CountryID = US.CountryID
                            AND US.UserID = @UserID AND US.PositionID = @PositionID
                WHERE   L.LanguageID = @0 AND L.CountryID = @1
            ", GetCurrentLanguageID(), GetCurrentCountryID(),
             UserID, PositionID);
        }
    }
    public static dynamic GetLanguageLevels()
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT  LanguageLevelID, LanguageLevelName, LanguageLevelDescription
                FROM    LanguageLevel
                WHERE   LanguageID = @0 AND CountryID = @1
            ", GetCurrentLanguageID(), GetCurrentCountryID());
        }
    }
    /// <summary>
    /// Get a dictionary list of Language Levels (LanguageLevelID on Value)
    /// selected by the user per Language (ServiceAttributeID matching a Language attribute,
    /// on the dictionary Key).
    /// </summary>
    /// <param name="UserID"></param>
    /// <param name="PositionID"></param>
    /// <returns></returns>
    public static Dictionary<int, int> GetUserLanguageLevels(int UserID, int PositionID)
    {
        var userLangLevels = new Dictionary<int, int>();
        using (var db = Database.Open("sqlloco"))
        {
            foreach (var ulanglevel in db.Query(@"
                SELECT  LanguageLevelID, ServiceAttributeID
                FROM    ServiceAttributeLanguageLevel
                WHERE   UserID = @0 AND
                        PositionID = @1 AND
                        LanguageID = @2 AND
                        CountryID = @3
            ", UserID, PositionID, GetCurrentLanguageID(), GetCurrentCountryID()))
            {
                userLangLevels.Add(ulanglevel.ServiceAttributeID, ulanglevel.LanguageLevelID);
            };
        }
        return userLangLevels;
    }
    #endregion
    #endregion

    #region l18n
    /// <summary>
    /// Based on LcUrl.LangId (string with format en-US, es-ES,..)
    /// returns the integer ID on database for the language part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentLanguageID()
    {
        switch (LcUrl.LangId.Substring(0, 2).ToUpper())
        {
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                return 0;
        }
    }
    /// <summary>
    /// Based on LcUrl.LangId (string with format en-US, es-ES,..)
    /// returns the integer ID on database for the country part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentCountryID()
    {
        switch (LcUrl.LangId.Substring(3, 2).ToUpper())
        {
            case "US":
            case "GB":
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                return 0;
        }
    }
    #endregion

    #region Locations
    public static int GetStateFromZipCode(string zipcode)
    {
        var sqlGetStateIDFromZipCode = @"
            SELECT TOP 1 StateProvinceID
            FROM    PostalCode As PC
            WHERE   PC.PostalCode = @0
                        AND
                    CountryID = @1
        ";
        using (var db = Database.Open("sqlloco"))
        {
            var stateID = db.QueryValue(sqlGetStateIDFromZipCode, zipcode, LcData.GetCurrentCountryID());
            return stateID == null ? 0 : (int)stateID;
        }
    }
    public static int GetPostalCodeID(string zipcode, int provinceStateID)
    {
        // Validate that Zip Postal Code is valid, and get the matching ID to be used later
        var sqlGetPostalCodeID = @"
            SELECT  PostalCodeID
            FROM    PostalCode As PC
            WHERE   PC.PostalCode = @0
                        AND
                    CountryID = @1
                        AND
                    StateProvinceID = @2
        ";
        using (var db = Database.Open("sqlloco"))
        {
            var postalCodeID = db.QueryValue(sqlGetPostalCodeID, zipcode, 1, provinceStateID);
            return postalCodeID == null ? 0 : (int)postalCodeID;
        }
    }
    public static string GetStateProvinceCode(int stateProvinceID)
    {
        var sqlGetStateCode = @"
            SELECT  StateProvinceCode
            FROM    StateProvince
            WHERE   StateProvinceID = @0
        ";
        using (var db = Database.Open("sqlloco"))
        {
            return db.QueryValue(sqlGetStateCode, stateProvinceID);
        }
    }
    /// <summary>
    /// Parameters in order: @UserID, @AddressLine1, @AddressLine2, @City, @StateProvinceID, @PostalCodeID, @CountryID, @LanguageID
    /// </summary>
    public const string sqlSetHomeAddress = @"EXEC SetHomeAddress @0, @1, @2, @3, @4, @5, @6, @7";
    public static void SetHomeAddress(int userID, string addressLine1, string addressLine2, string city, int stateProvinceID, int postalCodeID, int countryID, int languageID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(sqlSetHomeAddress, userID, addressLine1, addressLine2, city, stateProvinceID, postalCodeID, countryID, languageID);
        }
    }
    public const string sqlGetAddresses = @"
        SELECT  L.AddressID
                ,L.UserID
  
                ,L.AddressTypeID
                ,L.AddressName
                ,L.AddressLine1
                ,L.AddressLine2
                ,L.City
                ,L.StateProvinceID
                ,L.PostalCodeID
                ,L.CountryID
                ,L.Latitude
                ,L.Longitude
                ,L.GoogleMapsURL
                ,L.SpecialInstructions
                ,L.Active

                ,PC.PostalCode
                ,SP.StateProvinceCode
                ,SP.StateProvinceName

                ,AT.AddressType
                ,AT.UniquePerUser
        FROM    Address As L
                 INNER JOIN
                StateProvince As SP
                  ON L.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                PostalCode As PC
                  ON PC.PostalCodeID = L.PostalCodeID
                 INNER JOIN
                AddressType As AT
                  ON AT.AddressTypeID = L.AddressTypeID
        WHERE   L.UserID = @0
    ";

    public const string sqlGetServiceAddresses = @"
        SELECT  L.AddressID
                ,L.UserID
                ,coalesce(SA.PositionID, 0) As PositionID
                ,L.AddressTypeID
                ,L.AddressName
                ,L.AddressLine1
                ,L.AddressLine2
                ,L.City
                ,L.StateProvinceID
                ,L.PostalCodeID
                ,L.CountryID
                ,L.Latitude
                ,L.Longitude
                ,L.GoogleMapsURL
                ,L.SpecialInstructions

                ,(CASE WHEN @1 = -1 THEN (SELECT TOP 1 PositionSingular FROM Positions As PZ WHERE PZ.PositionID = SA.PositionID AND PZ.LanguageID = @2 AND PZ.CountryID = @3) ELSE null END) As PositionSingular
                ,CAST((CASE WHEN SA.AddressID is null THEN 0 ELSE 1 END) As bit) As IsServiceAddress

                ,SA.ServicesPerformedAtLocation
                ,SA.TravelFromLocation
                ,SA.ServiceRadiusFromLocation
                ,SA.PreferredAddress

                ,PC.PostalCode
                ,SP.StateProvinceCode
                ,SP.StateProvinceName
                ,TT.TransportTypeID
                ,TT.TransportTypeName
                ,L.Active

                ,AT.AddressType
                ,AT.UniquePerUser
        FROM    Address As L
                 LEFT JOIN
                ServiceAddress As SA
                  ON L.AddressID = SA.AddressID
                      AND L.UserID = SA.UserID
                      AND (@1 = -1 OR SA.PositionID = @1)
                 INNER JOIN
                StateProvince As SP
                  ON L.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                PostalCode As PC
                  ON PC.PostalCodeID = L.PostalCodeID
                 LEFT JOIN
                TransportType As TT
                  ON TT.TransportTypeID = SA.TransportType
                 INNER JOIN
                AddressType As AT
                  ON AT.AddressTypeID = L.AddressTypeID
                    AND AT.LanguageID = @2 AND AT.CountryID = @3
        WHERE   L.UserID = @0
                 -- We get all location, not only active: -- AND L.Active = 1
                 AND L.AddressName is not null AND L.AddressName not like ''
    ";
    /// <summary>
    /// Contains conditions to put in the 'where' that checks
    /// that 'L' addresses are complete (contains address
    /// details and name).
    /// </summary>
    public const string sqlCompleteAddressesFilter = @"
		AND dbo.fx_IfNW(L.AddressName, null) is not null
		AND dbo.fx_IfNW(L.AddressLine1, null) is not null
        AND dbo.fx_IfNW(L.City, null) is not null
        AND L.StateProvinceID > 0
        AND L.PostalCodeID > 0
    ";
    public const string sqlSetAddress = @"
        DECLARE @AddressID int
        SET @AddressID = @0

        IF @AddressID = 0 BEGIN
            INSERT INTO [Address] (
                [UserID]
                ,[AddressTypeID]
                ,[AddressName]
                ,[AddressLine1]
                ,[AddressLine2]
                ,[City]
                ,[StateProvinceID]
                ,[PostalCodeID]
                ,[CountryID]
                ,[SpecialInstructions]
                ,[Latitude]
                ,[Longitude]
                ,[GoogleMapsURL]
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
            ) VALUES (
                @1, @9,
                @8, @2, @3, @4, @5, @6, @7, 
                @10,
                @11, @12, @13,
                getdate(), getdate(), 'sys', 1
            )

            SET @AddressID = @@Identity

        END ELSE BEGIN
            /* Two steps update: normal fields first and then conditional update for the AddressTypeID field */
            UPDATE Address SET
                --AddressTypeId = @9
                AddressName = @8
                ,AddressLine1 = @2
                ,AddressLine2 = @3
                ,City = @4
                ,StateProvinceID = @5
                ,PostalCodeID = @6
                ,CountryID = @7
                ,SpecialInstructions = coalesce(@10, SpecialInstructions)
                ,Latitude = coalesce(@11, Latitude)
                ,Longitude = coalesce(@12, Longitude)
                ,GoogleMapsURL = coalesce(@13, GoogleMapsURL)
                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
                ,Active = 1
            WHERE
                AddressID = @AddressID AND UserID = @1

            /* Update AddressTypeID: only if previous AddressTypeID assigned is not one of the types 'UniquePerUser', that can be write on on insert -our rules- */
            IF (SELECT TOP 1 UniquePerUser FROM AddressType WHERE 
                AddressTypeID = (SELECT B.AddressTypeID FROM Address As B WHERE B.AddressID = @AddressID)
               ) = 0
                UPDATE Address SET
                    AddressTypeID = @9
                WHERE
                    AddressID = @AddressID AND UserID = @1
        END
    ";
    public const string sqlSetServiceAddress = @"
        BEGIN TRAN
    " + sqlSetAddress +
    @"

        -- If '@PreferredAddress' was set to true, first we set to false that field in all user service addresses
        IF @18 = 1
            UPDATE ServiceAddress SET
                PreferredAddress = 0
            WHERE
                UserID = @1 AND PositionID = @14

        -- First, try to update, if nothing updated (rowcount=0), try to insert
        UPDATE ServiceAddress SET
            ServicesPerformedAtLocation = @15
            ,TravelFromLocation = @16
            ,ServiceRadiusFromLocation = @17
            ,TransportType = @18
            ,PreferredAddress = @19
            ,UpdatedDate = getdate()
            ,ModifiedBy = 'sys'
            ,Active = 1
        WHERE
            AddressID = @AddressID
             AND
            UserID = @1 AND PositionID = @14

        IF @@rowcount = 0
            INSERT INTO [ServiceAddress] (
                [UserID]
                ,[AddressID]
                ,[PositionID]
                ,[ServicesPerformedAtLocation]
                ,[TravelFromLocation]
                ,[ServiceRadiusFromLocation]
                ,[TransportType]
                ,[PreferredAddress]
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
            ) VALUES (
                @1, @AddressId, @14,
                @15, @16, @17, @18, @19, getdate(), getdate(), 'sys', 1
            )

        COMMIT TRAN

        -- Test Alert
        EXEC TestAlertLocation @1, @14

        SELECT @AddressID As AddressID
    ";
    /// <summary>
    /// Delete an address as service address, but depending on context can only remove the [ServiceAddress] record, uncheck its
    /// 'address used as work or travel from', or remove both [ServiceAddress] and [Address] records.
    /// Param @3 (@Type) must has one value from: 'work', 'travel' EVER (will break if nothing and address has both uses)
    /// </summary>
    public const string sqlDelServiceAddress = @"
        /* Be carefull with removing an address, if exists both as 'travel' and 'work' addresses, only
            uncheck the type, don't delete */
        DECLARE @Type varchar(10)
        SET @Type = @3

        IF EXISTS (SELECT AddressID FROM ServiceAddress
                    WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2
                            AND ServicesPerformedAtLocation = 1
                            AND TravelFromLocation = 1)
        BEGIN

            IF @Type like 'work'
                UPDATE ServiceAddress SET
                    ServicesPerformedAtLocation = 0
                WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2
            ELSE IF @Type like 'travel'
                UPDATE ServiceAddress SET
                    TravelFromLocation = 0
                WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2

        END ELSE BEGIN

            DELETE FROM ServiceAddress
            WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2

            IF @@ERROR <> 0 BEGIN
                -- Non deletable serviceaddress, because is linked, simply 'unactive' and remove its use (as work or travel)
                DECLARE @bitWork bit, @bitTravel bit
                IF @Type like 'work'
                    SET @bitWork = cast(1 as bit)
                ELSE
                    SET @bitWork = cast(0 as bit)
                IF @Type like 'travel'
                    SET @bitTravel = cast(1 as bit)
                ELSE
                    SET @bitTravel = cast(0 as bit)

                UPDATE ServiceAddress SET
                    Active = 0
                    ,ServicesPerformedAtLocation = @bitWork
                    ,TravelFromLocation = @bitTravel
                WHERE   AddressID = @0 AND UserID = @1 AND PositionID = @2
            END ELSE BEGIN

                -- Try to remove the Address record too, if is not 'special' ([UniquePerUser]).
                DELETE FROM Address
                WHERE AddressID = @0 AND
                    (SELECT TOP 1 A.UniquePerUser FROM AddressType As A WHERE 
                        A.AddressTypeID = (SELECT B.AddressTypeID FROM Address As B WHERE B.AddressID = @0 AND UserID = @1)
                    ) = 0

                -- If is not possible, maybe is linked, do nothing (but read @@ERROR to not throw the error)
                SELECT @@ERROR As ErrorNumber
            END

        END

        -- Test Alert
        EXEC TestAlertLocation @1, @2
    ";
    #endregion

    #region Pricing Wizard
    #region Provider Price
    public class ProviderPrice
    {
        public bool IsHourly;
        public decimal Price;
    }
    /// <summary>
    /// Gets the minimum price offered by the provider on a specific position,
    /// being a 'since' fixed price or an hourly rate depending on its offered pricing.
    /// </summary>
    /// <param name="providerUserID"></param>
    /// <param name="positionID"></param>
    /// <param name="clienttypeid"></param>
    /// <param name="customerUserID"></param>
    /// <returns></returns>
    public static ProviderPrice GetProviderPrice(int providerUserID, int positionID, int clienttypeid, int customerUserID = 0)
    {
        dynamic minPackage = null;

        // Look for the package with the minimum price (fixed or rate)
        using (var db = Database.Open("sqlloco"))
        {
            var packages = db.Query(@"
            SELECT  coalesce(P.ProviderPackagePrice, 0) As Price
                    ,coalesce(P.PriceRate, 0) As PriceRate
                    ,coalesce(P.PriceRateUnit, '') As PriceRateUnit
                    ,P.PricingTypeID
            FROM    ProviderPackage As P
                     INNER JOIN
                    pricingtype PR
                      ON P.PricingTypeID = PR.PricingTypeID
                         AND PR.CountryID = P.CountryID AND PR.LanguageID = P.LanguageID
                     INNER JOIN
                    positionpricingtype PO
                     ON PR.PricingTypeID = PO.PricingTypeID AND PR.CountryID = PO.CountryID AND PR.LanguageID = PO.LanguageID
                        AND PR.Active = 1
                        AND PO.Active = 1
                        AND P.PositionID = PO.PositionID
            WHERE   P.Active = 1
                    AND P.ProviderUserID = @0
                    AND P.PositionID = @1
                    AND P.LanguageID = @2 AND P.CountryID = @3
                    -- Discard addons:
                    AND P.IsAddOn = 0
            ORDER BY
                    -- Precedence to hourly-rates
                    P.PriceRate DESC
            ", providerUserID, positionID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            foreach (var pak in packages)
            {
                // No minimum, gets this
                if (minPackage == null)
                {
                    minPackage = pak;
                    continue;
                }

                // Hourly rates take precedence.
                // If pak has an hourly rate, compare that
                if (pak.PriceRate != null &&
                    pak.PriceRate > 0 &&
                    (pak.PriceRateUnit ?? "").ToUpper() == "HOUR" &&
                    pak.PriceRate < minPackage.PriceRate)
                {
                    minPackage = pak;
                    continue;
                }

                // If package has a fixed price, compare that
                if (pak.Price != null &&
                    pak.Price > 0 &&
                    pak.Price < minPackage.Price)
                {
                    minPackage = pak;
                    continue;
                }
            }
        }

        // Get fees
        var feesSet = LcPricingModel.GetFeesSetFor(customerUserID, providerUserID, (minPackage != null ? minPackage.PricingTypeID : 0), positionID);
        var fee = feesSet["standard:customer"];
        // Create ProviderPrice from the minimum package
        if (minPackage != null)
        {
            // If has an hourly rate
            if (minPackage.PriceRate != null &&
                minPackage.PriceRate > 0 &&
                (minPackage.PriceRateUnit ?? "").ToUpper() == "HOUR")
            {
                // Get price with fees, 1 decimal for hourly rate
                return new ProviderPrice
                {
                    IsHourly = true,
                    Price = (new LcPricingModel.Price(minPackage.PriceRate, fee, 1)).TotalPrice
                };
            }
            // If has fixed price
            if (minPackage.Price != null &&
                minPackage.Price > 0)
            {
                // Get price with fees, 0 decimal for fixed price
                return new ProviderPrice
                {
                    IsHourly = false,
                    Price = (new LcPricingModel.Price(minPackage.Price, fee, 0)).TotalPrice
                };
            }
        }
        // There is no price, creates 0 and apply flat fees
        fee = feesSet["flat:customer"];
        return new ProviderPrice
        {
            IsHourly = false,
            Price = (new LcPricingModel.Price(0, fee, 0)).TotalPrice
        };
    }
    #endregion
    #region Common Pricing
    /// <summary>
    /// Get the ID list of pricing types for a position
    /// </summary>
    /// <param name="positionID"></param>
    /// <param name="clientTypeID"></param>
    /// <returns></returns>
    public static dynamic GetPositionPricingTypes(int positionID, int clientTypeID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT  PO.pricingtypeid As PricingTypeID
                FROM    positionpricingtype PO INNER JOIN pricingtype PR ON PR.PricingTypeID = PO.PricingTypeID AND PR.CountryID = PO.CountryID AND PR.LanguageID = PO.LanguageID
                WHERE   PO.languageid = @0 AND PO.countryid=@1 AND PO.clienttypeid=@2 AND PO.positionid=@3 AND PR.Active = 1 AND PO.Active = 1
                ORDER BY PR.DisplayRank ASC
            ", GetCurrentLanguageID(), GetCurrentCountryID(), clientTypeID, positionID);
        }
    }

    public static dynamic GetPositionRatings(int positionID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QuerySingle(@"
                SELECT  TOP 1
                        Rating1, Rating2, Rating3
                        ,Rating1FormDescription, Rating2FormDescription, Rating3FormDescription
                        ,Rating1ProfileDescription, Rating2ProfileDescription, Rating3ProfileDescription
                FROM    PositionRatings
                WHERE   (PositionID = @0 OR PositionID = -1)
                        AND LanguageID = @1
                        AND CountryID = @2
                -- First, the specific ID, then the default PositionID=0. 
                -- If there is no specific, with TOP 1 we get the default
                ORDER BY PositionID DESC
            ", positionID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
        }
    }

    #endregion
    #region Package Type (Provider Packages)
    public class ProviderPackagesView
    {
        public dynamic Packages;
        public dynamic PackagesDetails;
        public Dictionary<int, dynamic> PackagesByID;
        public Dictionary<int, List<dynamic>> PackagesDetailsByPackage;
    }
    public static dynamic GetProviderPackage(int providerPackageID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QuerySingle(@"
                SELECT  p.ProviderPackageID
                        ,p.PricingTypeID
                        ,p.ProviderUserID
                        ,p.PositionID
                        ,p.ProviderPackageName As Name
                        ,p.ProviderPackageDescription As Description
                        ,p.ProviderPackagePrice As Price
                        ,p.ProviderPackageServiceDuration As ServiceDuration
                        ,p.FirstTimeClientsOnly
                        ,p.NumberOfSessions
                        ,p.PriceRate
                        ,p.PriceRateUnit
                        ,p.IsPhone
                        ,p.LanguageID
                        ,p.CountryID
                        ,p.Active
                FROM    ProviderPackage As P
                WHERE   p.ProviderPackageID = @0
            ", providerPackageID);
        }
    }
    public static ProviderPackagesView GetPricingPackagesByProviderPosition(int providerUserID, int positionID, int packageID = -1, int pricingTypeID = -1, bool? isAddon = null)
    {
        dynamic packages, details;
        using (var db = Database.Open("sqlloco")){
            // Get the Provider Packages
            packages = db.Query(@"
                SELECT  p.ProviderPackageID
                        ,p.PricingTypeID
                        ,p.ProviderUserID
                        ,p.PositionID
                        ,p.ProviderPackageName As Name
                        ,p.ProviderPackageDescription As Description
                        ,p.ProviderPackagePrice As Price
                        ,p.ProviderPackageServiceDuration As ServiceDuration
                        ,p.FirstTimeClientsOnly
                        ,p.NumberOfSessions
                        ,p.PriceRate
                        ,p.PriceRateUnit
                        ,p.IsPhone
                        ,p.LanguageID
                        ,p.CountryID
                        ,p.Active
                FROM    ProviderPackage As P
                         INNER JOIN
                        PricingType As PT
                          ON P.PricingTypeID = PT.PricingTypeID
                            AND P.LanguageID = PT.LanguageID
                            AND P.CountryID = PT.CountryID
                WHERE   p.ProviderUserID = @0 AND P.PositionID = @1
                         AND 
                        p.LanguageID = @2 AND p.CountryID = @3
                         AND 
                        p.Active = 1
                         AND (@4 = -1 OR p.ProviderPackageID = @4)
                         AND (@5 = -1 OR p.PricingTypeID = @5)
                         AND (@6 = -1 OR P.IsAddOn = @6)
                ORDER BY PT.DisplayRank ASC
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, pricingTypeID,
            (isAddon.HasValue ? (isAddon.Value ? 1 : 0) : -1));
            details = db.Query(@"
                SELECT  PD.ServiceAttributeID
                        ,A.Name
                        ,A.ServiceAttributeDescription
                        ,P.ProviderPackageID
                FROM    ProviderPackageDetail As PD
                         INNER JOIN
                        ProviderPackage As P
                          ON P.ProviderPackageID = PD.ProviderPackageID
                         INNER JOIN
                        ServiceAttribute As A
                          ON A.ServiceAttributeID = PD.ServiceAttributeID
                            AND A.LanguageID = P.LanguageID AND A.CountryID = P.CountryID
                WHERE   P.ProviderUserID = @0 AND P.PositionID = @1
                         AND P.LanguageID = @2 AND P.CountryID = @3
                         AND PD.Active = 1 AND P.Active = 1
                         AND (@4 = -1 OR P.ProviderPackageID = @4)
                         AND (@5 = -1 OR P.PricingTypeID = @5)
                         AND (@6 = -1 OR P.IsAddOn = @6)
                ORDER BY A.Name ASC
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, pricingTypeID,
             (isAddon.HasValue ? (isAddon.Value ? 1 : 0) : -1));
        }
        // Create index of packages, Key:ID, Value:Package record
        var index = new Dictionary<int, dynamic>(packages.Count);
        foreach (var pak in packages)
        {
            index.Add(pak.ProviderPackageID, pak);
        }
        // Create index of packages details per package, Key:PackageID, Value:List of details records
        var detailsIndex = new Dictionary<int, List<dynamic>>();
        foreach (var det in details)
        {
            List<dynamic> detI = null;
            if (detailsIndex.ContainsKey(det.ProviderPackageID))
                detI = detailsIndex[det.ProviderPackageID];
            else {
                detI = new List<dynamic>();
                detailsIndex.Add(det.ProviderPackageID, detI);
            }
            detI.Add(det);
        }
        return new ProviderPackagesView { Packages = packages, PackagesDetails = details, PackagesByID = index, PackagesDetailsByPackage = detailsIndex };
    }
    #endregion
    #endregion

    #region Alerts
    public static string CreateAlertURL(dynamic alert)
    {
        string completeUrl = N.W(alert.AlertPageURL);
        if (completeUrl != null)
        {
            if (alert.PositionSpecific)
            {
                completeUrl = completeUrl.Replace("@(PositionID)", alert.PositionID.ToString());
            }
            if (!completeUrl.StartsWith("javascript:"))
            {
                completeUrl = LcUrl.LangPath + completeUrl;
            }
        }
        return completeUrl;
    }
    public static dynamic GetActiveUserAlerts(int userID, int positionID = -1)
    {
        using (var db = Database.Open("sqlloco")) {
            return db.Query(@"
            SELECT  A.AlertID,
                    A.AlertTypeID,
                    A.AlertName,
                    A.AlertHeadlineDisplay,
                    A.AlertTextDisplay,
                    A.AlertDescription,
                    A.AlertPageURL,
                    A.DisplayRank,
                    A.PositionSpecific,
                    A.Required,
                    UA.PositionID,
                    AT.AlertTypeName,
                    AT.AlertTypeDescription,
                    P.PositionSingular
            FROM    Alert As A
                     INNER JOIN
                    UserAlert As UA
                      ON A.AlertID = UA.AlertID
                     INNER JOIN
                    AlertType As AT
                      ON AT.AlertTypeID = A.AlertTypeID
                     LEFT JOIN (
                    Positions As P
                     INNER JOIN
                    UserProfilePositions As UP
                      ON UP.PositionID = P.PositionID
                         AND UP.Active = 1
                         AND UP.StatusID > 0
                         AND UP.LanguageID = P.LanguageID
                         AND UP.CountryID = P.CountryID
                    )
                      ON P.PositionID = UA.PositionID
                         AND P.LanguageID = A.LanguageID
                         AND P.CountryID = A.CountryID
                         AND UP.UserID = UA.UserID
            WHERE   UA.Active = 1 AND A.Active = 1 AND UA.UserID = @0
                     AND A.LanguageID = @1 AND A.CountryID = @2
                     AND (UA.PositionID = 0 OR P.PositionID is not null)
                    -- Filtered optionally by position (-1 to not filter by position)
                     AND (UA.PositionID = 0 OR @3 = -1 OR UA.PositionID = @3)
                    -- Added dismissed feature #243: not show if is dismissed
                    -- except for required ones, that cannot be dismissed
                    AND (A.Required = 1 OR UA.Dismissed = 0)
            ORDER BY AT.DisplayRank, AT.AlertTypeName, A.DisplayRank, A.AlertName
            ", userID,
             LcData.GetCurrentLanguageID(),
             LcData.GetCurrentCountryID(),
             positionID);
        }
    }
    public static int GetActiveRequiredUserAlertsCount(int userID, int positionID = -1)
    {
        int required = 0;
        foreach (var alert in GetActiveUserAlerts(userID, positionID))
        {
            if (alert.Required)
                required++;
        }
        return required;
    }
    public class UserAlertsNumbers
    {
        public int CountAlerts;
        public int CountRequiredAlerts;
        public int CountActiveAlerts;
        public int CountRequiredActiveAlerts;
        public int CountRequiredPassedAlerts;
        public dynamic NextAlert;
        public int AlertRank;
        public dynamic RequiredNextAlert;
        public int RequiredAlertRank;
    }
    public static Dictionary<int, UserAlertsNumbers> GetUserAlertsNumbers(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Get generic/all positions alerts counts
            var counts = db.QuerySingle(@"
                SELECT
                    coalesce((SELECT count(*) FROM alert), 0) As Total
                    ,coalesce((SELECT count(*) FROM alert WHERE Required = 1), 0) As TotalRequired
            ", userID);
            var countAlerts = counts.Total;
            var countRequiredAlerts = counts.TotalRequired;

            // Iterate for all active alerts
            var posCounts = new Dictionary<int, UserAlertsNumbers>();
            foreach (var a in GetActiveUserAlerts(userID))
            {
                dynamic posc = null;
                if (!posCounts.ContainsKey(a.PositionID))
                    posc = posCounts[a.PositionID] = new UserAlertsNumbers {
                        CountAlerts = countAlerts,
                        CountRequiredAlerts = countRequiredAlerts,
                        CountActiveAlerts = 0,
                        CountRequiredActiveAlerts = 0,
                        CountRequiredPassedAlerts = 0,
                        NextAlert = (dynamic)null,
                        RequiredNextAlert = (dynamic)null,
                        AlertRank = int.MaxValue,
                        RequiredAlertRank = int.MaxValue
                    };
                else
                    posc = posCounts[a.PositionID];

                posc.CountActiveAlerts++;
                if (a.Required)
                    posc.CountRequiredActiveAlerts++;
                if (a.DisplayRank < posc.AlertRank)
                {
                    posc.AlertRank = a.DisplayRank;
                    posc.NextAlert = a;
                }
                if (a.Required && a.DisplayRank < posc.RequiredAlertRank)
                {
                    posc.RequiredAlertRank = a.DisplayRank;
                    posc.RequiredNextAlert = a;
                }
            }

            // Complete collection with positions that user has but there are not in 
            // the previous list of active alerts because has not a position specific alert
            // but we need it to complete the list and then being updated with the all-positions numbers.
            foreach (var p in LcData.UserInfo.GetUserPos(userID))
            {
                if (!posCounts.ContainsKey(p.PositionID))
                    posCounts.Add(p.PositionID, new UserAlertsNumbers {
                        CountAlerts = countAlerts,
                        CountRequiredAlerts = countRequiredAlerts,
                        CountActiveAlerts = 0,
                        CountRequiredActiveAlerts = 0,
                        CountRequiredPassedAlerts = 0,
                        NextAlert = (dynamic)null,
                        RequiredNextAlert = (dynamic)null,
                        AlertRank = int.MaxValue,
                        RequiredAlertRank = int.MaxValue
                    });
            }

            // Iterate all numbers per position for the last tasks, including
            // add all-positions numbers (positionID:0) to every position.
            var allPositions = posCounts.ContainsKey(0) ? posCounts[0] : null;
            foreach (var p in posCounts)
            {
                // Combine all-positions alerts (positionID:0) with each specific position:
                if (allPositions != null && p.Key > 0)
                {
                    p.Value.CountActiveAlerts += allPositions.CountActiveAlerts;
                    p.Value.CountRequiredActiveAlerts += allPositions.CountRequiredActiveAlerts;
                    if (p.Value.RequiredNextAlert == null)
                        p.Value.RequiredNextAlert = allPositions.RequiredNextAlert;
                    if (p.Value.NextAlert == null)
                        p.Value.NextAlert = allPositions.NextAlert;
                }

                // Calculate passed alerts
                p.Value.CountRequiredPassedAlerts = p.Value.CountRequiredAlerts - p.Value.CountRequiredActiveAlerts;

                // Required alerts take precedence to other alerts, if there is one 
                // and independently of Rank:
                if (p.Value.RequiredNextAlert != null)
                    p.Value.NextAlert = p.Value.RequiredNextAlert;
            }

            return posCounts;
        }
    }
    #endregion

    #region Licenses and Certifications
    public const string sqlGetVerifiedUserLicenses = @"
            SELECT  
                    L.LicenseCertificationType
                    ,SP.StateProvinceName
                    ,C.CountyName
                    ,UL.LicenseStatus
                    ,UL.ExpirationDate
                    ,UL.LastVerifiedDate
                    ,L.LicenseCertificationAuthority
                    ,L.LicenseCertificationTypeDescription
                    ,UL.Comments
            FROM    UserLicenseVerification As UL
                     INNER JOIN
                    LicenseCertification As L
                      ON UL.LicenseCertificationID = L.LicenseCertificationID
                     INNER JOIN
                    StateProvince As SP
                      ON L.StateProvinceID = SP.StateProvinceID
                     INNER JOIN
                    County As C
                      ON C.CountyID = UL.CountyID
            WHERE   UL.ProviderUserID = @0
                     AND
                    (@1 = 0 OR UL.PositionID = @1)
                     AND
                    L.Active = 1
                     AND
                    UL.StatusID = 2 -- Verified successfully.
    ";
    #endregion

    #region Education
    public const string sqlSelectFromUserEducation = @"
            SELECT  E.UserEducationId, E.UserID, E.InstitutionID
                    ,E.DegreeCertificate
                    ,E.FieldOfStudy
                    ,E.FromYearAttended
                    ,E.ToYearAttended
                    ,I.InstitutionName
            FROM    UserEducation As E
                     INNER JOIN
                    Institution As I
                      ON E.InstitutionID = I.InstitutionID
    ";
    #endregion

    #region Reviews and Scores
    public const string sqlCheckUserReview = @"
        SELECT  count(*)
        FROM    UserReviews
        WHERE   PositionID = @0
		            AND
		        BookingID = @1
		            AND
		        ProviderUserID = @2
		            AND
		        CustomerUserID = @3
    ";
    public const string sqlGetUserReviewScores = @"
        SELECT  Rating1, Rating2, Rating3, Rating4, Answer1, Answer2, TotalRatings, ServiceHours
        FROM    UserReviewScores
        WHERE   UserID = @0
                    AND
                PositionID = @1
    ";
    public const string sqlInsertUserReviewScores = @"
        INSERT INTO UserReviewScores (
            UserID, PositionID,
            TotalRatings,
            Rating1, Rating2, Rating3, Rating4,
            Answer1, Answer2,
            ServiceHours, LastRatingDate,
            CreatedDate, UpdatedDate, ModifiedBy
        ) VALUES (
            @0, @1,
            @2, 
            @3, @4, @5, @6,
            @7, @8,
            @9, @10,
            getdate(), getdate(), 'sys'
        )
    ";
    public const string sqlUpdateUserReviewScores = @"
        UPDATE UserReviewScores SET
            TotalRatings = @2,
            Rating1 = @3, Rating2 = @4, Rating3 = @5, Rating4 = @6,
            Answer1 = @7, Answer2 = @8,
            ServiceHours = @9, LastRatingDate = @10,
            UpdatedDate = getdate(),
            ModifiedBy = 'sys'
        WHERE   UserID = @0
                    AND
                PositionID = @1
    ";
    public const string sqlInsertUserReview = @"
        INSERT INTO UserReviews (
            BookingID, CustomerUserID, ProviderUserID, PositionID,
            Rating1, Rating2, Rating3, Rating4,
            Answer1, Answer2,
            Answer1Comment, Answer2Comment,
            PrivateReview, PublicReview,
            ServiceHours, HelpfulReviewCount,
            CreatedDate, UpdatedDate, ModifiedBy
        ) VALUES (
            @0, @1, @2, @3,
            @4, @5, @6, @7,
            @8, @9,
            @10, @11,
            @12, @13,
            @14, @15,
            getdate(), getdate(), 'sys'
        )
    ";
    #endregion

    #region Positions
    public static int GetPositionIDByName(string nameOrTerm)
    {
        using (var db = Database.Open("sqlloco"))
        {
            var r = db.Query("EXEC SearchPositions @0,@1,@2", "%" + nameOrTerm + "%", LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            // Check results number:
            switch (r.Count())
            {
                // Only one result, return that
                case 1:
                    return r.First().PositionID;
                // No retults, return 0
                case 0:
                    return 0;
            }
            // More than one result, check for one record that matchs exactly the 
            // PositionSingular name
            foreach (var ri in r)
                if (nameOrTerm.ToLower() == ri.PositionSingular.ToLower())
                    return ri.PositionID;

            // Too much partial matches, ambiguous search:
            return -1;
        }
    }
    #endregion
}