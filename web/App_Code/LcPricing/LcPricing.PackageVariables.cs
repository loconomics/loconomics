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
            ProposalA.Load(this, userID, packageID, pricingEstimateID, pricingEstimateRevision);
         }
        /// <summary>
        /// Save data on database
        /// </summary>
        public void Save()
        {
            ProposalA.Save(this, userID, packageID, pricingEstimateID, pricingEstimateRevision);
        }
        /// <summary>
        /// Save data on database for the given pricingEstimateID and pricingEstimateRevision;
        /// thats values get updated in the object.
        /// </summary>
        /// <param name="pricingEstimateID"></param>
        /// <param name="pricingEstimateRevision"></param>
        public void Save(int pricingEstimateID, int pricingEstimateRevision)
        {
            this.pricingEstimateID = pricingEstimateID;
            this.pricingEstimateRevision = pricingEstimateRevision;
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

        #region DB Backend: Proposals 
        /// <summary>
        /// ProposalA backend implementation
        /// </summary>
        private static class ProposalA
        {
            #region Consts
            const string sqlGetVariables = @"
                SELECT  TOP 1 *
                FROM    ProviderPackageVariables
                WHERE   UserID = @0
                        AND PackageID = @1
                        AND PricingEstimateID = @2
                        AND PricingEstimateRevision = @3
            ";
            const string sqlSetVariables = @"
                UPDATE  ProviderPackageVariables SET
                        CleaningRate = @4
                        ,BedsNumber = @5
                        ,BathsNumber = @6
                        ,HoursNumber = @7
                        ,ChildsNumber = @8
                        ,ChildSurcharge = @9
                WHERE   UserID = @0
                        AND PackageID = @1
                        AND PricingEstimateID = @2
                        AND PricingEstimateRevision = @3

                IF @@rowcount = 0
                    INSERT INTO ProviderPackageVariables (
                        UserID
                        ,PackageID
                        ,PricingEstimateID
                        ,PricingEstimateRevision
                        ,CleaningRate
                        ,BedsNumber
                        ,BathsNumber
                        ,HoursNumber
                        ,ChildsNumber
                        ,ChildSurcharge
                    )VALUES (
                        @0
                        ,@1
                        ,@2
                        ,@3
                        ,@4
                        ,@5
                        ,@6
                        ,@7
                        ,@8
                        ,@9
                    )
            ";
            #endregion
            public static void Load(PackageVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
            {
                using (var db = Database.Open("sqlloco"))
                {
                    var r = db.QuerySingle(sqlGetVariables, userID, packageID, pricingEstimateID, pricingEstimateRevision);
                    if (r != null)
                    {
                        data["CleaningRate"] = r.CleaningRate;
                        data["BedsNumber"] = r.BedsNumber;
                        data["BathsNumber"] = r.BathsNumber;
                        data["HoursNumber"] = r.HoursNumber;
                        data["ChildsNumber"] = r.ChildsNumber;
                        data["ChildSurcharge"] = r.ChildSurcharge;
                    }
                }
            }
            public static void Save(PackageVariables data, int userID, int packageID, int pricingEstimateID = 0, int pricingEstimateRevision = 0)
            {
                using (var db = Database.Open("sqlloco"))
                {
                    db.Execute(sqlSetVariables, userID, packageID, pricingEstimateID, pricingEstimateRevision,
                        data.Get<decimal?>("CleaningRate", null),
                        data.Get<int?>("BedsNumber", null),
                        data.Get<int?>("BathsNumber", null),
                        data.Get<decimal?>("HoursNumber", null),
                        data.Get<int?>("ChildsNumber", null),
                        data.Get<decimal?>("ChildSurcharge", null));
                }
            }
        }
        #endregion
    }
}