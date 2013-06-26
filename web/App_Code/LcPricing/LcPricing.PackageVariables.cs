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
    /// <summary>
    /// Class to manage pricing provider-package-variables,
    /// with automatic type conversion, defaults and abstraction
    /// from the back-end at database.
    /// </summary>
    public class PackageVariables : IEnumerable<KeyValuePair<string, object>>
    {
         Dictionary<string, dynamic> data;
        int userID, packageID, pricingEstimateID, pricingEstimateRevision;

        public PackageVariables(int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
        {
            data = new Dictionary<string, object>();
            this.userID = userID;
            this.packageID = packageID;
            this.pricingEstimateID = pricingEstimateID;
            this.pricingEstimateRevision = pricingEstimateRevision;

            LoadPackageVariables();
        }
        public T Get<T>(string key, T defaultValue)
        {
            if (data.ContainsKey(key)) {
                object val = data[key];
                if (val is T)
                {
                    return (T)val;
                }
                else if (val == null)
                {
                    return defaultValue;
                }
                else
                {
                    // Try to convert to requested type (it works to parse from string too), or defaultValue
                    try
                    {
                        var convertToType = typeof(T);
                        // If the type is nullable, will have an underlying not nullable type,
                        // we must use that non-nullable for a successful conversion
                        var notNullableType = Nullable.GetUnderlyingType(typeof(T));
                        if (notNullableType != null)
                        {
                            convertToType = notNullableType;
                        }
                        return (T)Convert.ChangeType(val, convertToType);
                    }
                    catch {}
                    return defaultValue;
                }
            } else
                return defaultValue;
        }
        public void Set(string key, object value)
        {
            data[key] = value;
        }
        public dynamic this[string key]{
            get
            {
                return Get<dynamic>(key, null);
            }
            set
            {
                Set(key, value);
            }
        }

        public void LoadPackageVariables()
        {
            Backend.Load(this, userID, packageID, pricingEstimateID, pricingEstimateRevision);
        }
        /// <summary>
        /// Save data on database
        /// </summary>
        public void Save()
        {
            Backend.Save(this, userID, packageID, pricingEstimateID, pricingEstimateRevision);
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

        public IEnumerator<KeyValuePair<string, object>> GetEnumerator()
        {
            return data.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return data.GetEnumerator();
        }

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
                if (r.Value != null)
                    copy.Add(r.Key, r.Value);
            }
            return Json.Encode(new DynamicJsonObject(copy));
        }

        #region Static constructors
        public static PackageVariables FromPricingEstimatePackage(int packageID, int pricingEstimateID, int pricingEstimateRevision)
        {
            return new PackageVariables(-1, packageID, pricingEstimateID, pricingEstimateRevision);
        }
        #endregion

        #region DB Backend
        /// <summary>
        /// ProposalB++Alternative backend implementation
        /// </summary>
        private static class Backend
        {
            #region Consts
            const string sqlGetVariables = @"
                SELECT  V.Value, D.InternalName
                FROM    PricingVariableValue As V
                         INNER JOIN
                        PricingVariableDefinition As D
                          ON V.PricingVariableID = D.PricingVariableID
                            AND D.LanguageID = @4
                            AND D.CountryID = @5
                WHERE   (UserID = @0 OR @0 = -1)
                        AND ProviderPackageID = @1
                        AND PricingEstimateID = @2
                        AND PricingEstimateRevision = @3
            ";
            const string sqlSetVariables = @"
                DECLARE @varID int
                SELECT  TOP 1 @varID = PricingVariableID
                FROM    PricingVariableDefinition
                WHERE   InternalName = @4
                         AND
                        LanguageID = @6
                         AND
                        CountryID = @7

                UPDATE  PricingVariableValue SET
                        Value = @5
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
                    ) VALUES (
                        @varID
                        ,@0
                        ,@1
                        ,@2
                        ,@3
                        ,@5
                    )
            ";
            #endregion
            public static void Load(PackageVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
            {
                using (var db = Database.Open("sqlloco"))
                {
                    var vars = db.Query(sqlGetVariables, userID, packageID, pricingEstimateID, pricingEstimateRevision,
                        LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                    foreach(var r in vars)
                    {
                        data[r.InternalName] = r.Value;
                    }
                }
            }
            public static void Save(PackageVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
            {
                using (var db = Database.Open("sqlloco"))
                {
                    foreach (var v in data) {
                        db.Execute(sqlSetVariables, 
                            userID, packageID, pricingEstimateID, pricingEstimateRevision,
                            v.Key,
                            v.Value,
                            LcData.GetCurrentLanguageID(),
                            LcData.GetCurrentCountryID()
                        );
                    }
                }
            }
        }
        #endregion
    }
}