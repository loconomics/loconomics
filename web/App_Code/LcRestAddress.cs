using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Implements the scheme for a 'service-address' object
/// in the REST API, and static methods for database
/// operations
/// </summary>
public class LcRestAddress
{
    #region Fields
    public int addressID;
    public int jobTitleID;
    public int userID;
    public string addressName;
    public string addressLine1;
    public string addressLine2;
    private int postalCodeID;
    public string postalCode;
    public string city;
    private int stateProvinceID;
    public string stateProvinceCode;
    public string stateProvinceName;
    private int countryID;
    public string countryCode;
    public double? latitude;
    public double? longitude;
    public string specialInstructions;
    public bool isServiceLocation;
    public bool isServiceArea;
    public decimal? serviceRadius;
    public DateTime createdDate;
    public DateTime updatedDate;
    /// <summary>
    /// A valid AddressKind string.
    /// </summary>
    public string kind;
    #endregion

    #region Enums
    public const int NotAJobTitleID = 0;

    public const int NewAddressID = 0;
    public const int NotAnAddressID = 0;

    /// <summary>
    /// Internal address type, used in database but not exposed
    /// in the REST API.
    /// </summary>
    public enum AddressType : short {
        Home = 1,
        Billing = 13,
        Other = 12
    }
    /// <summary>
    /// Public address kind enumeration (string is not valid as Enum, so static
    /// class with prefixed values per public const property).
    /// Its needed to properly mark and expose each kind of
    /// address that can exists in the API (a bit like the 'special types'
    /// that were inconsistently managed with the AddressType).
    /// Let each returned address to be clearly identified
    /// inside the API. The numeric values are only internal
    /// is expected to expose as text.
    /// 
    /// NOTE: Maybe an actual enum can be created using toString() to produce
    /// the string value? Any assigned numeric value is not wanted just a side effect
    /// </summary>
    public static class AddressKind
    {
        #region Valid Property Values
        public const string Home = "home";
        public const string Billing = "billing";
        public const string Service = "service";
        #endregion
        
        #region Utils
        private static List<string> List = new List<string> { "home", "billing", "service" };
        
        public static bool IsValid(string kind)
        {
            return List.Contains(kind);
        }

        public static string GetFromAddressDBRecord(dynamic address)
        {
            var addressTypeID = (int)address.addressTypeID;
            var jobTitleID = (int)address.jobTitleID;

            // It is attached to a job title (>0), doesn't matters
            // the typeID, is treated ever as a 'service' address.
            if (jobTitleID > 0)
            {
                return Service;
            }
            else
            {
                switch (addressTypeID)
                {
                    case (short)AddressType.Home:
                        return Home;
                    case (short)AddressType.Billing:
                        return Billing;
                    default:
                        // Its really strange to end here (not if the data is consistent)
                        // but any way, under any corrupted data or something, treated
                        // like a service address
                        return Service;
                }
            }
        }
        #endregion
    }
    #endregion

    public static LcRestAddress FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestAddress {
            addressID = record.addressID,
            jobTitleID = record.jobTitleID,
            userID = record.userID,
            addressName = record.addressName,
            addressLine1 = record.addressLine1,
            addressLine2 = record.addressLine2,
            postalCodeID = record.postalCodeID,
            postalCode = record.postalCode,
            city = record.city,
            stateProvinceID = record.stateProvinceID,
            stateProvinceCode = record.stateProvinceCode,
            stateProvinceName = record.stateProvinceName,
            countryID = record.countryID,
            countryCode = record.countryCode,
            latitude = record.latitude,
            longitude = record.longitude,
            specialInstructions = record.specialInstructions,
            isServiceLocation = record.isServiceLocation,
            isServiceArea = record.isServiceArea,
            serviceRadius = N.D(record.serviceRadius) == null ? null : DataTypes.GetTypedValue<decimal?>(record.serviceRadius, 0),
            createdDate = record.createdDate,
            updatedDate = record.updatedDate,
            kind = AddressKind.GetFromAddressDBRecord(record)
        };
    }

    #region SQL
    private const string sqlSelect = @"SELECT ";
    private const string sqlSelectOne = @"SELECT TOP 1 ";
    private const string sqlFields = @"
                L.AddressID as addressID
                ,L.UserID as userID
                ,coalesce(SA.PositionID, 0) as jobTitleID
                ,L.AddressName as addressName
                ,L.AddressLine1 as addressLine1
                ,L.AddressLine2 as addressLine2

                ,L.PostalCodeID as postalCodeID
                ,PC.PostalCode as postalCode
                ,L.City as city
                ,L.StateProvinceID as stateProvinceID
                ,SP.StateProvinceCode as stateProvinceCode
                ,SP.StateProvinceName as stateProvinceName
                ,L.CountryID as countryID
                ,C.CountryCodeAlpha2 as countryCode

                ,L.Latitude as latitude
                ,L.Longitude as longitude
                ,L.SpecialInstructions as specialInstructions

                ,coalesce(SA.ServicesPerformedAtLocation, Cast(0 as bit)) as isServiceLocation
                ,coalesce(SA.TravelFromLocation, Cast(0 as bit)) as isServiceArea
                ,SA.ServiceRadiusFromLocation as serviceRadius

                ,L.CreatedDate as createdDate
                ,CASE WHEN SA.UpdatedDate is null OR L.UpdatedDate > SA.UpdatedDate THEN L.UpdatedDate ELSE SA.UpdatedDate END as updatedDate

                ,L.AddressTypeID as addressTypeID

        FROM    Address As L
                 INNER JOIN
                StateProvince As SP
                  ON L.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                PostalCode As PC
                  ON PC.PostalCodeID = L.PostalCodeID
                 INNER JOIN
                Country As C
                  ON L.CountryID = C.CountryID
                    AND C.LanguageID = @0
                 LEFT JOIN
                ServiceAddress As SA
                  -- Special case when the jobtitle/position requested is zero
                  -- just dont let make the relation to avoid bad results
                  -- because of internally reused addressID.
                  ON @2 > 0 AND L.AddressID = SA.AddressID
        WHERE   L.Active = 1
                 AND L.UserID = @1
    ";
    private const string sqlAndJobTitleID = @"
        AND coalesce(SA.PositionID, 0) = @2
    ";
    private const string sqlAndAddressID = @"
        AND L.AddressID = @3
    ";
    private const string sqlAndTypeID = @"
        AND L.AddressTypeID = @4
    ";
    // Since user can delete addresses from being available on its list but still
    // we need preserve that addresses information for cases in that is linked to 
    // a booking, that addresses get 'soft deleted', changing its flags for kind
    // of location to false, then we only show addresses with almost one flag.
    // NOTE: Its public because is used externally on webpages, since initially was
    // there and to avoid duplicated is just linked from there right now.
    public const string sqlcondOnlyActiveServiceAddress = " AND (TravelFromLocation = 1 OR ServicesPerformedAtLocation = 1)";
    /// <summary>
    /// Parameter @0 the UserID.
    /// </summary>
    public static readonly string sqlGetHomeAddressID = @"
        SELECT  AddressID
        FROM    Address
        WHERE   UserID = @0
                AND Active = 1
                AND AddressTypeID = " + ((short)AddressType.Home).ToString()
    ;
    #endregion

    #region Fetch
    public static List<LcRestAddress> GetServiceAddresses(int userID, int jobTitleID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(sqlSelect + sqlFields + sqlAndJobTitleID + sqlcondOnlyActiveServiceAddress,
                LcData.GetCurrentLanguageID(), userID, jobTitleID)
                .Select(FromDB)
                .ToList();
        }
    }

    public static List<LcRestAddress> GetBillingAddresses(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Parameter jobTitleID needs to be specified as 0 to avoid to join
            // the service-address table
            // Null value as 3th parameter since that placeholder is reserved for addressID
            return db.Query(sqlSelect + sqlFields + sqlAndJobTitleID + sqlAndTypeID,
                LcData.GetCurrentLanguageID(), userID, NotAJobTitleID, null, AddressType.Billing)
                .Select(FromDB)
                .ToList();
        }
    }

    private static LcRestAddress GetSingleFrom(IEnumerable<dynamic> dbRecords)
    {
        var add = dbRecords
            .Select(FromDB)
            .ToList();

        if (add.Count == 0)
            return null;
        else
            return add[0];
    }
    
    public static LcRestAddress GetServiceAddress(int userID, int jobTitleID, int addressID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return GetSingleFrom(db.Query(
                sqlSelectOne + sqlFields + sqlAndJobTitleID + sqlAndAddressID + sqlcondOnlyActiveServiceAddress,
                LcData.GetCurrentLanguageID(), userID, jobTitleID, addressID
            ));
        }
    }

    public static LcRestAddress GetBillingAddress(int userID, int addressID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Parameter jobTitleID needs to be specified as 0 to avoid to join
            // the service-address table
            return GetSingleFrom(db.Query(
                sqlSelectOne + sqlFields + sqlAndJobTitleID + sqlAndAddressID + sqlAndTypeID,
                LcData.GetCurrentLanguageID(), userID, NotAJobTitleID, addressID, AddressType.Billing
            ));
        }
    }

    public static LcRestAddress GetHomeAddress(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Parameter jobTitleID needs to be specified as 0 to avoid to join
            // the service-address table
            // Null value as 3th parameter since that placeholder is reserved for addressID
            // NOTE: Home address must exists ever, created on sign-up (GetSingleFrom
            // takes care to return null if not exists, but on this case is not possible
            // --or must not if not corrupted user profile)
            return GetSingleFrom(db.Query(
                sqlSelectOne + sqlFields + sqlAndJobTitleID + sqlAndTypeID,
                LcData.GetCurrentLanguageID(), userID, NotAJobTitleID, null, AddressType.Home
            ));
        }
    }
    #endregion

    #region Delete
    /// <summary>
    /// Delete an address, or transparently 'soft delete' if is linked internally.
    /// BE CAREFUL that this does not check for what kind of address is to delete,
    /// on the REST API or any other preliminar checks must be done to ensure
    /// the address can be deleted (like a service from the service API
    /// and a billing from the billing API; the home address is treated special
    /// internally and is not allowed to be deleted -because of [UniquePerUser]-; for a time, the billing
    /// address will not too, but that can change with the time).
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="jobTitleID"></param>
    /// <param name="addressID"></param>
    public static void DelAddress(int userID, int jobTitleID, int addressID)
    {
        using (var db = Database.Open("sqlloco")) {
            // Some old logics apply here because of the Dashboard up to v6, 
            // like the last parameter with "both".
            db.Execute(LcData.sqlDelServiceAddress, addressID, userID, jobTitleID, "both");
        }
    }
    #endregion

    #region Constraints
    /// <summary>
    /// Returns true if is allowed to add a new address that is a service area.
    /// Constraint: only one service area is allowed at this time.
    ///
    /// Original notes:
    /// Validate that 'travel from location' is unique
    /// Issue #86, details. for now, only allow one 'travel from' location for a simpler customer visualization of provider working zones.
    /// 
    /// Update 2015-03-07: Per comments on #677 2015-03-07 (following https://github.com/dani0198/Loconomics/issues/677#issuecomment-77714980),
    /// this contraint is not used with the creation of the App and the REST API, but code is preserved (the call to this function was
    /// commented on the RestPage).
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="jobTitleID"></param>
    /// <param name="addressID"></param>
    /// <returns></returns>
    public static bool IsNewServiceAreaAllowed(int userID, int jobTitleID, int addressID)
    {
        using (var db = Database.Open("sqlloco")) {
            
            return db.QueryValue(@"
                SELECT count(*) FROM ServiceAddress
                WHERE UserID = @0 AND PositionID = @1
                        AND TravelFromLocation = 1 -- Only travel from addresses
                        AND AddressID <> @2 --Don't count this address!
            ", userID, jobTitleID, addressID) == 0;
        }
    }

    #endregion

    #region Create/Update
    public static int SetAddress(LcRestAddress address)
    {
        // Inferred TypeID
        var internalTypeID = AddressType.Other;
        switch (address.kind)
        {
            case AddressKind.Home:
                internalTypeID = AddressType.Home;
                break;
            case AddressKind.Billing:
                internalTypeID = AddressType.Billing;
                break;
            // Any other kind (Service), is already set to 'Other'.
        }

        // Automatically set the City, StateProvinceID and PostalCodeID given
        // the PostalCode and Country information from the object.
        if (!AutosetByCountryPostalCode(address))
        {
            // TODO l10n
            throw new ValidationException("Invalid ZIP code", "postalCode", "address");
        }

        // GPS
        if ((!address.latitude.HasValue || address.latitude.Value == 0) &&
            (!address.longitude.HasValue || address.longitude.Value == 0))
        {
            var addressInline = ASP.LcHelpers.JoinNotEmptyStrings(", ",
                address.addressLine1,
                address.addressLine2,
                address.city,
                address.postalCode,
                address.stateProvinceCode,
                address.countryCode
            );

            var latLng = LcData.Address.GoogleGeoCode(addressInline);

            if (latLng != null) {
                address.latitude = (double)latLng.Lat;
                address.longitude = (double)latLng.Lng;
            }
            else {
                // Per comment on #677 2015-03-07 (following https://github.com/dani0198/Loconomics/issues/677#issuecomment-77714980)
                // The constraint that makes GPS required is removed but with code copy, so next lines are commented:
                // // Coordinates are required
                // throw new HttpException(404, "Looks like we're having problems verifying this location. Please double-check it or use the pin to choose a location.");
            }
        }

        // Presets
        // If is a service area location and has no name, put automatically a name:
        if (address.isServiceArea &&
            String.IsNullOrWhiteSpace(address.addressName))
        {
            // TODO l10n preset address name for service area addresses
            address.addressName = "Service Area";
        }

        using (var db = Database.Open("sqlloco")) {

            // Different SQL for service addresses.
            // Despite of that, we pass later all the service
            // parameters, since they will be just discarded
            // by the placeholder replacement, and the sort
            // of the standard address fields is the same
            // since the SQL for that part is the same
            // in the service-address sql.
            var sql = address.kind == AddressKind.Service ?
                LcData.sqlSetServiceAddress :
                LcData.sqlSetAddress
            ;

            // Special: for the kind 'home' we need to set the addressID
            // that exists on database (it behaves a bit like a 'singleton',
            // and its ID is not know when the update is requested
            // If for some internal disaster it does not exists, use 0
            // to create one. and fix that :-)
            if (address.kind == AddressKind.Home)
            {
                address.addressID = (int)(N.D(db.QueryValue(sqlGetHomeAddressID, address.userID)) ?? NewAddressID);
            }

            return (int)db.QueryValue(sql,
                address.addressID,
                address.userID,
                // Cannot be null on database, but can be empty on some addresses (service radius)
                address.addressLine1 ?? "",
                address.addressLine2,
                address.city,
                address.stateProvinceID,
                address.postalCodeID,
                address.countryID,
                address.addressName,
                internalTypeID,
                address.specialInstructions,
                address.latitude,
                address.longitude,
                null, // old unused field "google-map-url",
                // Beggining of service-address specific fields:
                address.jobTitleID,
                address.isServiceLocation,
                address.isServiceArea,
                address.serviceRadius,
                null, // unused field on REST "travel-transport",
                false // unused field on REST "preferred-address"
            );
        }
    }
    #endregion

    #region Look up tasks
    /// <summary>
    /// For an address with the Country (code or ID) and Postal Code information,
    /// it looks in database for the PostalCodeID, City and StateProvinceID and 
    /// set it in the passed address object.
    /// If the initial address contains a Country Code but not ID, the ID is
    /// auto set too.
    /// 
    /// It throws ValidationException if the required postal code and country information
    /// does not exists in the address object.
    /// </summary>
    /// <param name="address"></param>
    /// <returns>The success of the task.</returns>
    public static bool AutosetByCountryPostalCode(LcRestAddress address)
    {
        if (String.IsNullOrWhiteSpace(address.postalCode))
        {
            // TODO l10n
            throw new ValidationException("Address must contain a postal code", "postalCode", "address");
        }
        if (address.countryID <= 0)
        {
            if (String.IsNullOrWhiteSpace(address.countryCode))
            {
                // TODO l10n
                throw new ValidationException("Address must contain a country code or country ID", "countryCode", "address");
            }
            address.countryID = LcRestLocale.GetCountryIDByCode(address.countryCode);
        }
        else
        {
            // Just ensure the Country Code is the correct for the given ID
            address.countryCode = LcRestLocale.GetCountryCodeByID(address.countryID);
        }

        // Get the information by postal code and country from database
        var data = GetPostalCodeData(address.postalCode, address.countryID, false);
        if (data != null)
        {
            address.postalCodeID = data.PostalCodeID;
            address.city = data.City;
            address.stateProvinceID = data.StateProvinceID;
            // Done:
            return true;
        }
        else
        {
            // Failed look-up
            return false;
        }
    }

    public static dynamic GetPostalCodeData(string postalCode, int countryID, bool publicInterface)
    {
        // Get the information by postal code and country from database
        var sqlGetPublicPostalCodeData = @"
            SELECT  PC.City As city,
                    SP.StateProvinceCode As stateProvinceCode,
                    SP.StateProvinceName As stateProvinceName
            FROM    PostalCode As PC
                     INNER JOIN
                    StateProvince As SP
                      ON PC.StateProvinceID = SP.StateProvinceID
                          AND PC.CountryID = SP.CountryID
            WHERE   PC.PostalCode = @0
                        AND
                    PC.CountryID = @1
        ";
        var sqlGetPostalCodeData = @"
            SELECT  PostalCodeID, City, StateProvinceID
            FROM    PostalCode
            WHERE   PostalCode = @0
                        AND
                    CountryID = @1
        ";
        using (var db = Database.Open("sqlloco"))
        {
            var data = db.QuerySingle(publicInterface ? sqlGetPublicPostalCodeData : sqlGetPostalCodeData, postalCode, countryID);
            if (data != null)
            {
                return data;
            }
            else
            {
                // Failed look-up
                return null;
            }
        }
    }
    #endregion
}