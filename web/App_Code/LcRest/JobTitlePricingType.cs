using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Descripción breve de JobTitlePricingType
    /// </summary>
    public class JobTitlePricingType
    {
        #region Fields
        public int pricingTypeID;
        public int clientTypeID;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public static JobTitlePricingType FromDB(dynamic record)
        {
            if (record == null) return null;
            return new JobTitlePricingType
            {
                pricingTypeID = record.pricingTypeID,
                clientTypeID = record.clientTypeID,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetList = @"
            SELECT
                PricingTypeID As pricingTypeID,
                ClientTypeID As clientTypeID,
                UpdatedDate As updatedDate
            FROM
                positionpricingtype
            WHERE
                PositionID = @0
                 AND LanguageID = @1
                 AND CountryID = @2
                 AND Active = 1
        ";
        #endregion
        public static IEnumerable<JobTitlePricingType> GetList(int jobTitleID, Locale locale)
        {
            return GetList(jobTitleID, locale.languageID, locale.countryID);
        }
        public static IEnumerable<JobTitlePricingType> GetList(int jobTitleID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, jobTitleID, languageID, countryID).Select(FromDB);
            }
        }
        #endregion
    }
}