using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Solution
    /// </summary>
    public class Solution
    {
        #region Fields
        public int solutionID;
        public int languageID;
        public int countryID;
        public string name;
        public bool credentialCheckRequired;
        public bool backgroundCheckRequired;
        public bool isHipaa;
        public int? taxActivityID;
        public int? postingTemplateID;
        public string image;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instances
        public Solution() { }

        public static Solution FromDB(dynamic record)
        {
            if (record == null) return null;
            return new Solution
            {
                solutionID = record.solutionID,
                languageID = record.languageID,
                countryID = record.countryID,
                name = record.name,
                credentialCheckRequired = record.credentialCheckRequired,
                backgroundCheckRequired = record.backgroundCheckRequired,
                isHipaa = record.isHipaa,
                taxActivityID = record.taxActivityID,
                postingTemplateID = record.postingTemplateID,
                image = record.image,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        /// <summary>
        /// For search API, used for autocomplete, results are limited for better performance
        /// </summary>
        const string sqlLimitedSelect = @"SELECT TOP 20";
        const string sqlSelect = "SELECT";
        const string sqlGetList = @"
                solutionID,
                languageID,
                countryID,
                name,
                credentialCheckRequired,
                backgroundCheckRequired,
                isHipaa,
                taxActivityID,
                postingTemplateID,
                image,
                createdDate,
                updatedDate
            FROM
                Solution
            WHERE
                Active = 1
                 AND languageID = @0
                 AND countryID = @1
        ";
        const string sqlSearchConditions = @"
                 AND name like '%' + @2 + '%'
        ";
        const string sqlAndId = @"
                 AND solutionID = @2
        ";
        #endregion

        /// <summary>
        /// List all
        /// </summary>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<Solution> List(int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlSelect + sqlGetList, languageID, countryID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> Search(string searchText, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlLimitedSelect + sqlGetList + sqlSearchConditions, languageID, countryID, searchText).Select(FromDB);
            }
        }

        public static Solution Get(int solutionID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle("SELECT TOP 1 " + sqlGetList + sqlAndId, languageID, countryID, solutionID));
            }
        }
        #endregion
    }
}
