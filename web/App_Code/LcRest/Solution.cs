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
        public const string sqlFields = @"
                S.solutionID,
                S.languageID,
                S.countryID,
                S.name,
                S.credentialCheckRequired,
                S.backgroundCheckRequired,
                S.isHipaa,
                S.taxActivityID,
                S.postingTemplateID,
                S.image,
                S.createdDate,
                S.updatedDate
        ";
        public const string sqlFrom = "FROM Solution AS S";
        const string sqlCommonOrder = "ORDER BY S.name";
        const string sqlCommonWhere = @"
            WHERE
                S.Active = 1
                 AND S.languageID = @0
                 AND S.countryID = @1
        ";
        const string sqlGetList = sqlFields + sqlFrom + sqlCommonWhere;
        const string sqlSearchConditions = @"
                 AND S.name like '%' + @2 + '%'
        ";
        const string sqlAndId = @"
                 AND S.solutionID = @2
        ";
        const string sqlBySearchSubcategoryID = sqlSelect + sqlFields + sqlFrom + @"
                INNER JOIN SearchSubCategorySolution As C
                 ON C.solutionID = S.solutionID
                 AND C.languageID = S.languageID
                 AND C.countryID = S.countryID
        " + sqlCommonWhere + @"
                 AND C.searchSubcategoryID = @2
                ORDER BY C.displayRank, S.name
        ";
        const string sqlByJobTitleID = sqlSelect + sqlFields + sqlFrom + @"
                INNER JOIN JobTitleSolution As C
                 ON C.solutionID = S.solutionID
                 AND C.languageID = S.languageID
                 AND C.countryID = S.countryID
        " + sqlCommonWhere + @"
                 AND C.jobTitleID = @2
                ORDER BY C.displayRank, S.name
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
                return db.Query(sqlSelect + sqlGetList + sqlCommonOrder, languageID, countryID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> BySearchSubcategory(int searchSubcategoryID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlBySearchSubcategoryID, languageID, countryID, searchSubcategoryID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> ByJobTitle(int jobTitleID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlByJobTitleID, languageID, countryID, jobTitleID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> Search(string searchText, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlLimitedSelect + sqlGetList + sqlSearchConditions + sqlCommonOrder;
                return db.Query(sql, languageID, countryID, searchText).Select(FromDB);
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
