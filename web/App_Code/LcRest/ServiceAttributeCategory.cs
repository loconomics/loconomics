using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// ServiceAttributes by categories attached to user job titles
    /// </summary>
    public class ServiceAttributeCategory
    {
        #region Fields
        public int serviceAttributeCategoryID;
        public string name;
        public string description;
        public bool requiredInput;
        public bool eligibleForPackages;
        #endregion

        #region Links
        public IEnumerable<ServiceAttribute> serviceAttributes;
        #endregion

        #region Instances
        public ServiceAttributeCategory() { }

        public static ServiceAttributeCategory FromDB(dynamic record, IEnumerable<dynamic> list = null)
        {
            // Name and description can be on any of following pair of property names:
            var name = "";
            var desc = "";
            try
            {
                name = record.serviceAttributeCategoryName;
                desc = record.serviceAttributeCategoryDescription;
            }
            catch
            {
                name = record.name;
                desc = record.description;
            }

            var cat = new ServiceAttributeCategory
            {
                serviceAttributeCategoryID = record.serviceAttributeCategoryID,
                name = name,
                description = desc,
                requiredInput = record.requiredInput,
                eligibleForPackages = record.eligibleForPackages
            };

            if (list != null)
            {
                cat.serviceAttributes = list.Select(ServiceAttribute.FromDB);
            }
            return cat;
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT DISTINCT
	            a.serviceAttributeCategoryID,
	            a.ServiceAttributeCategory as name,
	            a.ServiceAttributeCategoryDescription as description,
	            a.requiredInput,
                coalesce(a.EligibleForPackages, cast(0 as bit)) As eligibleForPackages
	        FROM serviceattributecategory a
	            JOIN servicecategorypositionattribute c
	            on a.ServiceAttributeCategoryID = c.ServiceAttributeCategoryID
	            and a.LanguageID = c.LanguageID
	            and a.CountryID = c.CountryID
	        WHERE
                c.PositionID = @0
	            and c.LanguageID  = @1
	            and c.CountryID = @2
	            and (a.PricingOptionCategory is null OR a.PricingOptionCategory = 1)
	            -- only actived
	            and a.Active = 1
	            and c.Active = 1
	        ORDER BY a.DisplayRank ASC, a.ServiceAttributeCategory ASC
        ";
        public static PricingSummary Get(int id, int revision)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlGetItem, id, revision));
            }
        }
        #endregion
    }
}