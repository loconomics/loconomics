﻿using System;
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
    public static ProviderPrice GetProviderPrice(int providerUserID, int positionID, int clienttypeid, int customerUserID = 0)
    {       
        // Get our Pricing Type ID:
        int pricingtypeid = LcData.GetPositionPricingTypeID(positionID, clienttypeid);
        // Get Fees that apply to the provider and customer
        var fee = LcPricingModel.GetFee(LcData.Booking.GetFeeFor(customerUserID, providerUserID, pricingtypeid));

        var providerPrice = new ProviderPrice();

        using (var db = Database.Open("sqlloco"))
        {
            if (pricingtypeid == 2 || pricingtypeid == 1)
            {
                providerPrice.IsHourly = true;
                // Get hourly rate
                providerPrice.Price = db.QueryValue(@"
                    SELECT  coalesce(HourlyRate, 0)
                    FROM    ProviderHourlyRate
                    WHERE   UserID = @0
                                AND
                            PositionID = @1
                                AND
                            ClientTypeID = @2
                ", providerUserID, positionID, clienttypeid) ?? 0;

                // Apply fees
                providerPrice.Price += LcPricingModel.ApplyFee(fee, providerPrice.Price);
            }
            else if (pricingtypeid == 3)
            {
                providerPrice.Price = db.QueryValue(@"
                    SELECT  coalesce(min(ProviderPackagePrice), 0)
                    FROM    ProviderPackage
                    WHERE   ProviderUserID = @0
                             AND PositionID = @1
                             AND LanguageID = @2 AND CountryID = @3
                             AND IsAddOn = 0
                ", providerUserID, positionID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID()) ?? 0;

                // Apply fees
                providerPrice.Price += LcPricingModel.ApplyFeeAndRound(fee, providerPrice.Price);
            }
        }
        return providerPrice;
    }
    #endregion
    #region Common Pricing
    public static int GetPositionPricingTypeID(int positionID, int clientTypeID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return ((int?)db.QueryValue(@"
                SELECT  pricingtypeid
                FROM    positionpricingtype
                WHERE   languageid = @0 AND countryid=@1 AND clienttypeid=@2 AND positionid=@3
            ", GetCurrentLanguageID(), GetCurrentCountryID(), clientTypeID, positionID) ?? 0);
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

    public static decimal GetProviderHourlyRate(
        int providerUserID,
        int positionID,
        int clientTypeID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return (decimal)(db.QueryValue(@"
                SELECT  TOP 1 HourlyRate
                FROM    providerhourlyrate
                WHERE   UserID = @0 AND PositionID = @1 AND ClientTypeID = @2 AND Active = 1
            ", providerUserID, positionID, clientTypeID) ?? 0);
        }
    }

    #endregion
    #region Variables and options

    #region SQLs
    public static string sqlSetCustomerPricingVariable = @"
        BEGIN TRAN
            UPDATE  customerpricingvariableinputs WITH (serializable)
            SET     PricingDataInput = @0,
                    UpdatedDate = getdate(),  
                    ModifiedBy = 'sys',
                    Active = 1
            WHERE   UserId = @1 AND PricingVariableID = @2

            IF @@rowcount = 0
            BEGIN
                INSERT INTO customerpricingvariableinputs (PricingDataInput,
                    UserID, PricingVariableID, CreatedDate, UpdatedDate, 
                    ModifiedBy, Active)
                VALUES (@0, @1, @2, getdate(), getdate(), 'sys', 1)
            END
        COMMIT TRAN
    ";
    public static string sqlSetCustomerPricingOption = @"
        BEGIN TRAN
            UPDATE  customerpricingoptioninputs WITH (serializable)
            SET     PricingDataInput = @0,
                    UpdatedDate = getdate(),  
                    ModifiedBy = 'sys',
                    Active = 1
            WHERE   UserId = @1 AND PricingOptionID = @2

            IF @@rowcount = 0
            BEGIN
                INSERT INTO customerpricingoptioninputs (PricingDataInput,
                    UserID, PricingOptionID, CreatedDate, UpdatedDate, 
                    ModifiedBy, Active)
                VALUES (@0, @1, @2, getdate(), getdate(), 'sys', 1)
            END
        COMMIT TRAN
    ";
    public static string sqlDelCustomerPricingOption = @"
        DELETE FROM customerpricingoptioninputs
        WHERE       UserId = @0 AND PricingOptionID = @1
    ";
    #endregion

    public static dynamic GetPricingVariables(
        int customerUserID,
        int providerUserID,
        int positionID,
        int clientTypeID,
        int pricingTypeID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
            SELECT  pv.PricingVariableID, pv.PricingVariableName, 
                    pv.CustomerInputDataRequired, pv.CustomerDataInputType,
                    pv.CustomerDataValues, pv.CustomerPricingVariableDisplayText,
                    pv.ProviderDataInputUnit, pv.CustomerDataInputUnit,
                    pi.PricingDataInput As ProviderDataInputValue,
                    pc.PricingDataInput As CustomerDataInputValue
            FROM    pricingvariable As pv
                     LEFT JOIN
                    providerpricingvariableinputs as pi
                      ON pv.PricingVariableID = pi.PricingVariableID
                     LEFT JOIN
                    customerpricingvariableinputs as pc
                      ON pv.PricingVariableID = pc.PricingVariableID
                        AND pc.Active = 1 AND pc.UserID = @6
            WHERE   pv.CountryID=@1 AND pv.LanguageID=@0
                     AND 
                    pv.ClientTypeID=@2 AND pv.PositionID=@3
                     AND 
                    pv.CustomerInputDataRequired = 1
                     AND
                    pv.Active = 1 AND pv.PricingTypeID = @4
                     AND
                    (
                     -- If Provider Input is not Required, it means is an informational variable -without calculation-,
                     --  no needs relationed record at providerpricingvariableinputs (pi) table
                     pv.ProviderInputDataRequired = 0
                      OR
                     -- Else, it means a Provider Input is Required in order to do calculations: because of this
                     --  the variable record is only showed/returned if there is a Provider Input Value, with the
                     --  relationship at providerpricingvariableinputs (pi) and proper conditional values
                     pi.PricingDataInput is not null
                      AND
                     pi.Active = 1 AND pi.ProviderUserID = @5
                    )
            ", LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), clientTypeID, positionID, pricingTypeID, providerUserID, customerUserID);
        }
    }
    public static dynamic GetPricingOptions(
        int customerUserID,
        int providerUserID,
        int positionID,
        int clientTypeID,
        int pricingTypeID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
            SELECT  pr.PricingOptionID, pr.PricingOptionName, 
                    pr.CustomerInputDataRequired, pr.CustomerDataInputType,
                    pr.CustomerDataValues, pr.CustomerPricingOptionDisplayText,
                    pr.ProviderDataInputUnit, pr.CustomerDataInputUnit,
                    pr.ServiceAttributeID,
                    pi.PricingDataInput As ProviderDataInputValue,
                    pi.ProviderTimeRequired,
                    pc.PricingDataInput As CustomerDataInputValue
            FROM    pricingoption As pr
                     LEFT JOIN
                    providerpricingoptioninputs as pi
                      ON pr.PricingOptionID = pi.PricingOptionID
                     LEFT JOIN
                    customerpricingoptioninputs as pc
                      ON pr.PricingOptionID = pc.PricingOptionID
                        AND pc.Active = 1 AND pc.UserID = @6
            WHERE   pr.LanguageID=@0 AND pr.CountryID=@1
                     AND 
                    pr.ClientTypeID=@2 AND pr.PositionID=@3
                     AND 
                    pr.CustomerInputDataRequired = 1
                     AND
                    pr.Active = 1 AND pr.PricingTypeID = @4
                     AND
                    (
                     -- If Provider Input is not Required, it means is an informational variable -without calculation-,
                     --  no needs relationed record at providerpricingoptioninputs (pi) table
                     pr.ProviderInputDataRequired = 0
                      OR
                     -- Else, it means a Provider Input is Required in order to do calculations: because of this
                     --  the variable record is only showed/returned if there is a Provider Input Value, with the
                     --  relationship at providerpricingoptioninputs (pi) and proper conditional values
                     pi.PricingDataInput is not null
                      AND
                     pi.Active = 1 AND pi.ProviderUserID = @5
                    )
            ", LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), clientTypeID, positionID, pricingTypeID, providerUserID, customerUserID);
        }
    }
    #endregion
    #region Package Type (Provider Packages)
    public static ProviderPackagesView GetPricingPackagesByProviderPosition(int providerUserID, int positionID, int packageID = -1, int pricingTypeID = -1)
    {
        dynamic packages, details;
        using (var db = Database.Open("sqlloco")){
            // Get the Provider Packages
            packages = db.Query(@"
                SELECT  p.ProviderPackageID
                        ,p.PricingTypeID
                        ,p.ProviderPackageName As Name
                        ,p.ProviderPackageDescription As Description
                        ,p.ProviderPackagePrice As Price
                        ,p.ProviderPackageServiceDuration As ServiceDuration
                        ,p.FirstTimeClientsOnly
                        ,p.NumberOfSessions
                        ,p.IsAddOn
                FROM    providerpackage As p
                WHERE   p.ProviderUserID = @0 AND P.PositionID = @1
                         AND 
                        p.LanguageID = @2 AND p.CountryID = @3
                         AND 
                        p.Active = 1
                         AND (@4 = -1 OR p.ProviderPackageID = @4)
                         AND (@5 = -1 OR p.PricingTypeID = @5)
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, pricingTypeID);
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
                ORDER BY A.Name ASC
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, pricingTypeID);
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
    public class ProviderPackagesView
    {
        public dynamic Packages;
        public dynamic PackagesDetails;
        public Dictionary<int, dynamic> PackagesByID;
        public Dictionary<int, List<dynamic>> PackagesDetailsByPackage;
    }
    public static ProviderPackagesView GetProviderPackageByProviderPosition(int providerUserID, int positionID, int packageID = -1, int type = -1)
    {
        dynamic packages, details;
        using (var db = Database.Open("sqlloco")){
            // Get the Provider Packages
            packages = db.Query(@"
                SELECT  p.ProviderPackageID
                        ,p.ProviderPackageName As Name
                        ,p.ProviderPackageDescription As Description
                        ,p.ProviderPackagePrice As Price
                        ,p.ProviderPackageServiceDuration As ServiceDuration
                        ,p.FirstTimeClientsOnly
                        ,p.NumberOfSessions
                        ,p.IsAddOn
                FROM    providerpackage As p
                WHERE   p.ProviderUserID = @0 AND P.PositionID = @1
                         AND 
                        p.LanguageID = @2 AND p.CountryID = @3
                         AND 
                        p.Active = 1
                         AND (@4 = -1 OR ProviderPackageID = @4)
                         AND (@5 = -1 OR p.IsAddOn = @5)
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, type);
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
                         AND (@5 = -1 OR P.IsAddOn = @5)
                ORDER BY A.Name ASC
            ", providerUserID, positionID, GetCurrentLanguageID(), GetCurrentCountryID(), packageID, type);
        }
        // Create index of packages, Key:ID, Value:Package record
        var index = new Dictionary<int, dynamic>(packages.Count);
        foreach (var pak in packages)
        {
            index.Add(pak.ProviderPackageID, pak);
        }
        return new ProviderPackagesView { Packages = packages, PackagesDetails = details, PackagesByID = index };
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
    public static dynamic GetActiveUserAlerts(int userID)
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
            ORDER BY AT.DisplayRank, AT.AlertTypeName, A.DisplayRank, A.AlertName
            ", userID,
             LcData.GetCurrentLanguageID(),
             LcData.GetCurrentCountryID());
        }
    }
    public static int GetActiveUserAlertsCount(int userID)
    {
        /*using (var db = Database.Open("sqlloco")) {
            return (int)db.QueryValue(@"
                SELECT  count(*)
                FROM    Alert As A
                         INNER JOIN
                        UserAlert As UA
                          ON A.AlertID = UA.AlertID
                WHERE   UA.Active = 1 AND A.Active = 1 AND UA.UserID = @0
                         AND A.LanguageID = @1 AND A.CountryID = @2
            ", userID,
             LcData.GetCurrentLanguageID(),
             LcData.GetCurrentCountryID());
        }*/
        return GetActiveUserAlerts(userID).Count;
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
                    L.Active = 1
                     AND
                    UL.StatusID = 2 -- Verified succesfully.
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