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
        public string minServicePriceUnit;
        public string minServiceValue
        {
            get
            {
                if (!minServicePrice.HasValue)
                {
                    return "";
                }
                else if (!String.IsNullOrEmpty(minServicePriceUnit))
                {
                    return String.Format("{0:c}/{1}", minServicePrice.Value, minServicePriceUnit);
                }
                else
                {
                    return String.Format("{0:c}", minServicePrice.Value);
                }
            }
        }
        #endregion

        #region Instances
        public static PublicUserJobStats FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserJobStats
            {
                userID = record.userID,
                minServicePrice = record.minServicePrice,
                minServicePriceUnit = record.minServicePriceUnit
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetPriceData = @"
            SELECT
                min(ProviderPackagePrice) as minServicePrice,
                min(PriceRate) as minServicePriceRate,
                count(*) as servicesCount
            FROM ProviderPackage As P
            WHERE P.ProviderUserID = @0
                    AND P.PositionID = @1
                    AND P.Active = 1
        ";
        const string sqlGetPriceRateUnit = @"
            SELECT priceRateUnit
            FROM ProviderPackage
            WHERE ProviderUserID = @0
                AND PositionID = @1
                AND PriceRate = @2
        ";
        #endregion
        public static PublicUserJobStats Get(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                //return FromDB(db.QuerySingle(sqlGet, userID));
                var d = db.QuerySingle(sqlGetPriceData, userID, jobTitleID);
                var r = new PublicUserJobStats {
                    userID = userID,
                    servicesCount = (long)d.servicesCount
                };
                if (d == null) return r;
                var mp = (decimal?)d.minServicePrice;
                var mr = (decimal?)d.minServicePriceRate;
                var hasUnit = false;
                if (!mp.HasValue && !mr.HasValue)
                {
                    return r;
                }
                else if (mp.HasValue && !mr.HasValue)
                {
                    r.minServicePrice = mp;
                }
                else if (!mp.HasValue && mr.HasValue)
                {
                    r.minServicePrice = mr;
                    hasUnit = true;
                }
                else
                {
                    // Both has value, get minimum
                    r.minServicePrice = Math.Min(mp.Value, mr.Value);
                    if (r.minServicePrice == d.minServicePriceRate)
                    {
                        hasUnit = true;
                    }
                }
                // Get Unit, if has one (because we choose price rate)
                if (hasUnit)
                {
                    r.minServicePriceUnit = (string)db.QueryValue(sqlGetPriceRateUnit, userID, jobTitleID, r.minServicePrice.Value);
                }
                return r;
            }
        }
        #endregion
    }
}