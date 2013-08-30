using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class PricingVariableDefinition
    {
        public int PricingVariableID { get; internal set; }
        public int LanguageID { get; internal set; }
        public int CountryID { get; internal set; }
        public int PositionID { get; internal set; }
        public int PricingTypeID { get; internal set; }
        public string InternalName { get; internal set; }
        public bool IsProviderVariable { get; internal set; }
        public bool IsCustomerVariable { get; internal set; }
        public string DataType { get; internal set; }
        public string VariableLabel { get; internal set; }
        public string VariableLabelPopUp { get; internal set; }
        public string VariableNameSingular { get; internal set; }
        public string VariableNamePlural { get; internal set; }
        public string NumberIncludedLabel { get; internal set; }
        public string NumberIncludedLabelPopUp { get; internal set; }
        public string HourlySurchargeLabel { get; internal set; }
        public string HourlySurchargeLabelPopUp { get; internal set; }
        public string MinNumberAllowedLabel { get; internal set; }
        public string MinNumberAllowedLabelPopUp { get; internal set; }
        public string MaxNumberAllowedLabel { get; internal set; }
        public string MaxNumberAllowedLabelPopUp { get; internal set; }
        public string MinMaxValuesList { get; internal set; }
        public int? CalculateWithVariableID { get; internal set; }
        
        internal static PricingVariableDefinition CreateFromDbRecord(dynamic r)
        {
            return new PricingVariableDefinition {
                PricingVariableID       = r.PricingVariableID
                ,LanguageID             = r.LanguageID
                ,CountryID              = r.CountryID
                ,PositionID             = r.PositionID
                ,PricingTypeID          = r.PricingTypeID
                ,InternalName           = r.InternalName
                ,IsProviderVariable     = r.IsProviderVariable
                ,IsCustomerVariable     = r.IsCustomerVariable
                ,DataType               = r.DataType
                ,VariableLabel          = r.VariableLabel
                ,VariableLabelPopUp     = r.VariableLabelPopUp
                ,VariableNameSingular   = r.VariableNameSingular
                ,VariableNamePlural     = r.VariableNamePlural
                ,NumberIncludedLabel    = r.NumberIncludedLabel
                ,NumberIncludedLabelPopUp   = r.NumberIncludedLabelPopup
                ,HourlySurchargeLabel       = r.HourlySurchargeLabel
                ,MinNumberAllowedLabel      = r.MinNumberAllowedLabel
                ,MinNumberAllowedLabelPopUp = r.MinNumberAllowedLabelPopUp
                ,MaxNumberAllowedLabel      = r.MaxNumberAllowedLabel
                ,MaxNumberAllowedLabelPopUp = r.MaxNumberAllowedLabelPopUp
                ,CalculateWithVariableID    = r.CalculateWithVariableID
                ,MinMaxValuesList           = r.MinMaxValuesList
            };
        }

        #region Instance utils
        /// <summary>
        /// Generates a collection of key-value -> label for the MinMaxValuesList field.
        /// Empty collection if there is no values in the list.
        /// It generates automatically labels for only numeric lists.
        /// </summary>
        /// <returns></returns>
        public IEnumerable<KeyValuePair<string, object>> GenerateMinMaxValuesCollection()
        {
            if (!String.IsNullOrWhiteSpace(MinMaxValuesList))
            {
                var jsonobj = Json.Decode(MinMaxValuesList);
                if (jsonobj is DynamicJsonObject)
                    foreach (var a in jsonobj)
                        yield return a;
                else if (jsonobj is DynamicJsonArray)
                    foreach (var a in jsonobj)
                        yield return new KeyValuePair<string,object>((a ?? "").ToString(), LcUtils.GetLabelForValue(a, VariableNameSingular, VariableNamePlural));
            }
        }
        #endregion

        #region Experimental cache and index INCOMPLETE
        public class PrimaryKey
        {
            public int PricingVariableID { get; private set; }
            public int LanguageID { get; private set; }
            public int CountryID { get; private set; }
            public int PositionID { get; private set; }
            public int PricingTypeID { get; private set; }
            public PrimaryKey (int pricingVariableID, int languageID, int countryID, int positionID, int pricingTypeID)
            {
                PricingVariableID = PricingVariableID;
                LanguageID = languageID;
                CountryID = countryID;
                PositionID = positionID;
                PricingTypeID = pricingTypeID;
            }
            public override bool Equals(object obj)
            {
                var pk = obj as PrimaryKey;
                if (pk == null)
                    return false;
                return (this.PricingVariableID == pk.PricingVariableID
                    && this.LanguageID == pk.LanguageID
                    && this.CountryID == pk.CountryID
                    && this.PositionID == pk.PositionID
                    && this.PricingTypeID == pk.PricingTypeID);
            }
            public override int GetHashCode()
            {
                return string.Format("{0}-{1}-{2}-{3}-{4}", PricingTypeID, LanguageID, CountryID, PositionID, PricingTypeID).GetHashCode();
            }
        }
        private static Dictionary<PrimaryKey, PricingVariableDefinition> Cached
        {
            get
            {
                var cached = HttpContext.Current.Cache["ClassCollection:PricingVariableDefinition"] as Dictionary<PrimaryKey, PricingVariableDefinition>;
                if (cached == null)
                {
                    cached = FetchFromDB();
                    HttpContext.Current.Cache["ClassCollection:PricingVariableDefinition"] = cached;
                }
                return cached;
            }
        }
        /// <summary>
        /// Get all records from database,
        /// it creates the instances of PricingVariableDefinition,
        /// return it in a collection indexed by the Key
        /// </summary>
        /// <param name="dbrecords"></param>
        /// <returns></returns>
        private static Dictionary<PrimaryKey, PricingVariableDefinition> FetchFromDB()
        {
            dynamic dbrecords;
            using (var db = Database.Open("sqlloco"))
            {
                dbrecords = db.Query(@"SELECT * FROM PricingVariableDefinition");
            }
            var ret = new Dictionary<PrimaryKey, PricingVariableDefinition>();
            foreach (var record in dbrecords)
            {
                var pk = new PrimaryKey (
                    record.PricingVariableID
                    ,record.LanguageID
                    ,record.CountryID
                    ,record.PositionID
                    ,record.PricingTypeID
                );
                ret[pk] = new PricingVariableDefinition {
                    PricingVariableID = record.PricingVariableID
                    ,InternalName = record.InternalName
                    ,IsProviderVariable = record.IsProviderVariable
                    ,IsCustomerVariable = record.IsCustomerVariable
                    ,DataType = record.DataType
                    ,VariableLabel = record.VariableLabel
                    ,VariableLabelPopUp = record.VariableLabelPopUp
                    ,VariableNameSingular = record.VariableNameSingular
                    ,VariableNamePlural = record.VariableNamePlural
                    ,NumberIncludedLabel = record.NumberIncludedLabel
                    ,NumberIncludedLabelPopUp = record.NumberIncludedLabelPopup
                    ,CalculateWithVariableID = record.CalculateWithVariableID
                };

            }
            return ret;
        }
        #endregion
    }
    public class PricingVariableValue
    {
        public int PricingVariableID { get; internal set; }
        public dynamic Value;
        public decimal? ProviderNumberIncluded;
        public decimal? ProviderMinNumberAllowed;
        public decimal? ProviderMaxNumberAllowed;
        public T GetValue<T>(T defaultValue)
        {
            return LcUtils.GetTypedValue<T>(Value, defaultValue);
        }
        public PricingVariableDefinition Def { get; internal set; }
        internal static PricingVariableValue CreateFromDbRecord(dynamic r)
        {
            return new PricingVariableValue {
                PricingVariableID           = r.PricingVariableID
                ,Value                      = r.Value
                ,ProviderNumberIncluded     = r.ProviderNumberIncluded
                ,ProviderMinNumberAllowed   = r.ProviderMinNumberAllowed
                ,ProviderMaxNumberAllowed   = r.ProviderMaxNumberAllowed
                ,Def                        = PricingVariableDefinition.CreateFromDbRecord(r)
            };
        }
    }
    /// <summary>
    /// Class to manage pricing provider-package-variables,
    /// with automatic type conversion, defaults and abstraction
    /// from the back-end at database.
    /// </summary>
    public class PricingVariables : IEnumerable<KeyValuePair<string, PricingVariableValue>>
    {
        #region Instance private fields
        Dictionary<string, PricingVariableValue> data;
        Dictionary<int, PricingVariableValue> idIndex;
        int userID, packageID, pricingEstimateID, pricingEstimateRevision;
        #endregion

        #region Public Properties
        public int UserID { get { return userID; } }
        public int PackageID { get { return packageID; } }
        public int PricingEstimateID { get { return pricingEstimateID; } }
        public int PricingEstimateRevision { get { return pricingEstimateRevision; } }
        #endregion

        #region Constructors (instance and static)
        /// <summary>
        /// Creates a new empty collection of variables for the given userID and packageID.
        /// It must be persisted with 'Save' overriding existing values.
        /// To load variables for userID and packageID from back-end, use the
        /// static constructor FromProviderPackage.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="packageID"></param>
        private PricingVariables(int userID, int packageID)
        {
            data = new Dictionary<string, PricingVariableValue>();
            idIndex = new Dictionary<int,PricingVariableValue>();
            this.userID = userID;
            this.packageID = packageID;
            this.pricingEstimateID = 0;
            this.pricingEstimateRevision = 0;
        }
        #region Static constructors
        /// <summary>
        /// Get the collection of pricing variables with its values that were persisted
        /// for a given package and pricing estimate.
        /// </summary>
        /// <param name="packageID"></param>
        /// <param name="pricingEstimateID"></param>
        /// <param name="pricingEstimateRevision"></param>
        /// <returns></returns>
        public static PricingVariables FromPricingEstimatePackage(int packageID, int pricingEstimateID, int pricingEstimateRevision)
        {
            var ret = new PricingVariables(-1, packageID);
            Load(ret, -1, packageID, pricingEstimateID, pricingEstimateRevision);
            return ret;
        }
        /// <summary>
        /// Get the collection of variables with its values for an existent provider package.
        /// </summary>
        /// <param name="providerID"></param>
        /// <param name="packageID"></param>
        /// <returns></returns>
        public static PricingVariables FromProviderPackage(int providerID, int packageID)
        {
            var ret = new PricingVariables(providerID, packageID);
            Load(ret, providerID, packageID, 0, 0);
            return ret;
        }
        /// <summary>
        /// Returns a set of pricingVariables with the saved values for the given provider package
        /// updated with current set of variables assigned to the position and pricingType,
        /// suitable to fill the 'edit package' form.
        /// </summary>
        /// <param name="providerID"></param>
        /// <param name="packageID"></param>
        /// <param name="positionID"></param>
        /// <param name="pricingTypeID"></param>
        /// <returns></returns>
        public static PricingVariables FromUpdatedProviderPackage(int providerID, int packageID, int positionID, int pricingTypeID)
        {
            var ret = new PricingVariables(providerID, packageID);
            LoadUpdated(ret, providerID, packageID, positionID, pricingTypeID);
            return ret;
        }
        /// <summary>
        /// Get the collection of pricing variables required to create a package.
        /// When only loading variables to create the form, packageID can be 0 (providerID too),
        /// but for when using it to get the posted values and saved in database, all ID fields
        /// need to be accuracy.
        /// Variables values will be empty, but the list and definitions will be complete.
        /// </summary>
        /// <param name="providerID"></param>
        /// <param name="packageID"></param>
        /// <param name="positionID"></param>
        /// <param name="pricingTypeID"></param>
        /// <returns></returns>
        public static PricingVariables ForNewProviderPackage(int providerID, int packageID, int positionID, int pricingTypeID)
        {
            var ret = new PricingVariables(providerID, packageID);
            LoadNew(ret, positionID, pricingTypeID);
            return ret;
        }
        /// <summary>
        /// Get variables given a package object that enables this to automatically get variables
        /// for a new package (when ID is 0) or the values for the existing package on other case.
        /// </summary>
        /// <param name="package">The package information used to discover what variables and values retrieve.</param>
        /// <returns></returns>
        public static PricingVariables FromPackageBaseData(PackageBaseData package)
        {
            PricingVariables provars;
            if (package.ID == 0)
                provars = PricingVariables.ForNewProviderPackage(package.ProviderUserID, 0, package.PositionID, package.PricingTypeID);
            else
                provars = PricingVariables.FromUpdatedProviderPackage(package.ProviderUserID, package.ID, package.PositionID, package.PricingTypeID);
            return provars;
        }
        #endregion
        #endregion

        #region Using variables
        /// <summary>
        /// Gets the value for a variable by
        /// its internal name (key), or the
        /// @defaultValue if there is no value.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="key"></param>
        /// <param name="defaultValue"></param>
        /// <returns></returns>
        public T GetValue<T>(string key, T defaultValue)
        {
            if (data.ContainsKey(key))
                return LcUtils.GetTypedValue<T>(data[key].Value, defaultValue);
            else
                return defaultValue;
        }
        /// <summary>
        /// Sets or gets the value for a variable by
        /// its internal name (key).
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public PricingVariableValue this[string key]
        {
            get
            {
                return data[key];
            }
            internal set
            {
                data[key] = value;
            }
        }
        public PricingVariableValue this[int id]
        {
            get
            {
                return idIndex[id];
            }
        }
        /// <summary>
        /// Get the linked variable to the one given through the field CalculateWithVariable
        /// </summary>
        /// <param name="variable"></param>
        /// <returns></returns>
        public PricingVariableValue GetCalculateWithVariableFor(PricingVariableValue variable)
        {
            if (variable.Def.CalculateWithVariableID.HasValue)
                return idIndex[variable.Def.CalculateWithVariableID.Value];
            return null;
        }
        #endregion

        #region Saving
        /// <summary>
        /// Save data on database
        /// </summary>
        public void Save()
        {
            Save(this, userID, packageID, pricingEstimateID, pricingEstimateRevision);
        }
        /// <summary>
        /// Save data on database for the given pricingEstimateID and pricingEstimateRevision;
        /// thats values get updated in the object.
        /// </summary>
        /// <param name="pricingEstimateID"></param>
        /// <param name="pricingEstimateRevision"></param>
        public void Save(int pricingEstimateID, int pricingEstimateRevision, int onBehalfUserID = 0)
        {
            this.pricingEstimateID = pricingEstimateID;
            this.pricingEstimateRevision = pricingEstimateRevision;
            // Replace userID from the load with a new one, normally because the provider
            // variables were loaded but here we are loading the customer ones.
            if (onBehalfUserID > 0)
                this.userID = onBehalfUserID;
            Save();
        }
        #endregion

        #region Iterating
        public IEnumerator<KeyValuePair<string, PricingVariableValue>> GetEnumerator()
        {
            return data.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return data.GetEnumerator();
        }
        #endregion

        #region Object override
        /// <summary>
        /// Create a string in JSON format that represents the variables with value
        /// included in this instance.
        /// Additional context data as package, user... is not included
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            var copy = new Dictionary<string, object>();
            foreach (var r in data)
            {
                if (r.Value.Value != null)
                    copy.Add(r.Key, r.Value.Value);
            }
            return Json.Encode(new DynamicJsonObject(copy));
        }
        #endregion

        // ProposalB++Alternative backend implementation
        #region DB Backend
        #region Consts
        const string selectVarValuesDef = @"
            SELECT  D.PricingVariableID
                    ,V.ProviderPackageID
                    ,V.UserID
                    ,V.PricingEstimateID
                    ,V.PricingEstimateRevision
                    ,V.Value
                    ,V.ProviderNumberIncluded
                    ,V.ProviderMinNumberAllowed
                    ,V.ProviderMaxNumberAllowed
                    ,D.InternalName
                    ,D.LanguageID
                    ,D.CountryID
                    ,D.PositionID
                    ,D.PricingTypeID
                    ,D.IsProviderVariable
                    ,D.IsCustomerVariable
                    ,D.DataType
                    ,D.VariableLabel
                    ,D.VariableLabelPopUp
                    ,D.VariableNameSingular
                    ,D.VariableNamePlural
                    ,D.NumberIncludedLabel
                    ,D.NumberIncludedLabelPopUp
                    ,D.HourlySurchargeLabel
                    ,D.MinNumberAllowedLabel
                    ,D.MinNumberAllowedLabelPopUp
                    ,D.MaxNumberAllowedLabel
                    ,D.MaxNumberAllowedLabelPopUp
                    ,D.CalculateWithVariableID
                    ,D.MinMaxValuesList
        ";
        const string sqlGetVariablesActualValues = selectVarValuesDef + @"
            FROM    PricingVariableValue As V
                        INNER JOIN
                    PricingVariableDefinition As D
                        ON V.PricingVariableID = D.PricingVariableID
            WHERE   (UserID = @0 OR @0 = -1)
                    AND ProviderPackageID = @1
                    AND PricingEstimateID = @2
                    AND PricingEstimateRevision = @3
                    AND D.LanguageID = @4
                    AND D.CountryID = @5
        ";
        const string sqlGetVariablesForEdit = selectVarValuesDef + @"
            FROM    PricingVariableDefinition As D
                     LEFT JOIN
                    PricingVariableValue As V
                        ON V.PricingVariableID = D.PricingVariableID
                        AND V.UserID = @0
                        AND V.ProviderPackageID = @1
                        AND V.Active = 1
                        -- Data returned must be from the-package, not a previous estimate:
                        AND V.PricingEstimateID = 0
                        AND V.PricingEstimateRevision = 0
            WHERE   D.Active = 1
                    AND D.LanguageID = @4
                    AND D.CountryID = @5
                    AND (D.PositionID = @2 OR D.PositionID = -1)
                    AND D.PricingTypeID = @3
        ";
        const string sqlGetVariablesForNewPackage = @"
            SELECT  D.PricingVariableID
                    ,D.InternalName
                    ,D.LanguageID
                    ,D.CountryID
                    ,D.PositionID
                    ,D.PricingTypeID
                    ,D.IsProviderVariable
                    ,D.IsCustomerVariable
                    ,D.DataType
                    ,D.VariableLabel
                    ,D.VariableLabelPopUp
                    ,D.VariableNameSingular
                    ,D.VariableNamePlural
                    ,D.NumberIncludedLabel
                    ,D.NumberIncludedLabelPopUp
                    ,D.HourlySurchargeLabel
                    ,D.MinNumberAllowedLabel
                    ,D.MinNumberAllowedLabelPopUp
                    ,D.MaxNumberAllowedLabel
                    ,D.MaxNumberAllowedLabelPopUp
                    ,D.CalculateWithVariableID
                    ,D.MinMaxValuesList
            FROM    PricingVariableDefinition As D
            WHERE   (D.PositionID = @0 OR D.PositionID = -1)
                    AND D.PricingTypeID = @1
                    AND D.LanguageID = @2
                    AND D.CountryID = @3
                    AND D.Active = 1
        ";
        const string sqlSetVariables = @"
            DECLARE @varID int
            SET @varID = @4

            UPDATE  PricingVariableValue SET
                    Value = @5
                    ,ProviderNumberIncluded = @6
                    ,ProviderMinNumberAllowed = @7
                    ,ProviderMaxNumberAllowed = @8
                    ,UpdatedDate = getdate()
                    ,ModifiedBy = 'sys'
            WHERE   UserID = @0
                    AND ProviderPackageID = @1
                    AND PricingEstimateID = @2
                    AND PricingEstimateRevision = @3
                    AND PricingVariableID = @varID

            IF @@rowcount = 0
                INSERT INTO PricingVariableValue (
                    PricingVariableID                        
                    ,UserID
                    ,ProviderPackageID
                    ,PricingEstimateID
                    ,PricingEstimateRevision
                    ,Value
                    ,ProviderNumberIncluded
                    ,ProviderMinNumberAllowed
                    ,ProviderMaxNumberAllowed
                    ,CreatedDate
                    ,UpdatedDate
                    ,ModifiedBy
                    ,Active
                ) VALUES (
                    @varID
                    ,@0
                    ,@1
                    ,@2
                    ,@3
                    ,@5
                    ,@6
                    ,@7
                    ,@8
                    ,getdate()
                    ,getdate()
                    ,'sys'
                    ,1
                )
        ";
        #endregion
        private static void LoadNew(PricingVariables data, int positionID, int pricingTypeID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var vars = db.Query(sqlGetVariablesForNewPackage, positionID, pricingTypeID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                foreach(var r in vars)
                {
                    var varValue = new PricingVariableValue {
                        PricingVariableID           = r.PricingVariableID
                        ,Value                      = null
                        ,ProviderNumberIncluded     = null
                        ,ProviderMinNumberAllowed   = null
                        ,ProviderMaxNumberAllowed   = null
                        ,Def                        = PricingVariableDefinition.CreateFromDbRecord(r)
                    };
                    data[r.InternalName] = varValue;
                    // Update index
                    data.idIndex[varValue.PricingVariableID] = varValue;
                }
            }
        }
        /// <summary>
        /// Load the set of pricingVariables with the saved values for the given provider package
        /// updated with current set of variables assigned to the position and pricingType,
        /// suitable to fill the 'edit package' form.
        /// </summary>
        /// <param name="data"></param>
        /// <param name="userID"></param>
        /// <param name="packageID"></param>
        /// <param name="positionID"></param>
        /// <param name="pricingTypeID"></param>
        private static void LoadUpdated(PricingVariables data, int userID, int packageID, int positionID, int pricingTypeID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var vars = db.Query(sqlGetVariablesForEdit,
                    userID,
                    packageID,
                    positionID,
                    pricingTypeID,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID());
                foreach(var r in vars)
                {
                    var varValue = PricingVariableValue.CreateFromDbRecord(r);
                    data[r.InternalName] = varValue;
                    // Update index
                    data.idIndex[varValue.PricingVariableID] = varValue;
                }
            }
        }
        private static void Load(PricingVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var vars = db.Query(sqlGetVariablesActualValues, userID, packageID, pricingEstimateID, pricingEstimateRevision,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                foreach(var r in vars)
                {
                    var varValue = PricingVariableValue.CreateFromDbRecord(r);
                    data[r.InternalName] = varValue;
                    // Update index
                    data.idIndex[varValue.PricingVariableID] = varValue;
                }
            }
        }
        /// <summary>
        /// Save all the values for the variables in the database.
        /// If there is no pricingEstimate (@pricingEstimateID is 0 or less)
        /// then only the provider variables will be saved.
        /// </summary>
        /// <param name="data"></param>
        /// <param name="userID"></param>
        /// <param name="packageID"></param>
        /// <param name="pricingEstimateID"></param>
        /// <param name="pricingEstimateRevision"></param>
        private static void Save(PricingVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
        {
            using (var db = Database.Open("sqlloco"))
            {
                foreach (var v in data) {
                    // Only save provider values when there is no pricingEstimate
                    // (avoid save customer variables that are null, unneed and will fail)
                    if (pricingEstimateID > 0 || v.Value.Def.IsProviderVariable)
                        db.Execute(sqlSetVariables, 
                            userID, packageID, pricingEstimateID, pricingEstimateRevision,
                            v.Value.PricingVariableID,
                            v.Value.Value,
                            v.Value.ProviderNumberIncluded,
                            v.Value.ProviderMinNumberAllowed,
                            v.Value.ProviderMaxNumberAllowed
                        );
                }
            }
        }
        #endregion

        #region "Static Utilities"
        /// <summary>
        /// It updates the values for customer variables in the passed @vars with
        /// the values used by the @customerID in its last booking/estimate.
        /// This allows the 'memory effect' on bookings, helping customers with repeated bookings.
        /// </summary>
        /// <param name="vars"></param>
        /// <param name="customerID"></param>
        public static void UpdateWithLastCustomerValues(PricingVariables vars, int customerID)
        {
            dynamic data = null;
            // Get customer values from last booking/estimate
            using (var db = Database.Open("sqlloco"))
            {
                var sql = @"
                    DECLARE @UserID int
                    DECLARE @PackageID int

                    SET @UserID = @0
                    SET @PackageID = @1

                    DECLARE @PricingEstimateID int
                    DECLARE @PricingEstimateRevision int

                    SELECT	TOP 1
		                    @PricingEstimateID = PricingEstimateID,
                            @PricingEstimateRevision = PricingEstimateRevision
                    FROM	PricingVariableValue
                    WHERE	Active = 1
		                    AND UserID = @UserID
		                    AND ProviderPackageID = @PackageID
                    ORDER BY PricingEstimateID DESC, PricingEstimateRevision DESC

                    SELECT	V.PricingVariableID, V.Value
                    FROM	PricingVariableValue As V
                    WHERE	V.Active = 1
		                    AND V.UserID = @UserID
		                    AND V.ProviderPackageID = @PackageID
		                    AND V.PricingEstimateID = @PricingEstimateID
		                    AND V.PricingEstimateRevision = @PricingEstimateRevision
                ";

                data = db.Query(sql, customerID, vars.PackageID);
            }
            // Update vars with that values
            foreach (var r in data)
            {
                var v = vars[(int)r.PricingVariableID];
                if (v.Def.IsCustomerVariable)
                    v.Value = r.Value;
            }
        }
        #endregion
    }
}