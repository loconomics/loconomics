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
        public string language;
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
                language = record.language,
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
                S.language,
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
                 AND S.language = @0
        ";
        const string sqlGetList = sqlFields + sqlFrom + sqlCommonWhere;
        const string sqlSearchConditions = @"
                 AND S.name like '%' + @1 + '%'
        ";
        const string sqlAndId = @"
                 AND S.solutionID = @1
        ";
        const string sqlBySearchSubcategoryID = sqlSelect + sqlFields + sqlFrom + @"
                INNER JOIN SearchSubCategorySolution As C
                 ON C.solutionID = S.solutionID
                 AND C.language = S.language
        " + sqlCommonWhere + @"
                 AND C.searchSubcategoryID = @1
                ORDER BY C.displayRank, S.name
        ";
        const string sqlByJobTitleID = sqlSelect + sqlFields + sqlFrom + @"
                INNER JOIN JobTitleSolution As C
                 ON C.solutionID = S.solutionID
                 AND C.language = S.language
        " + sqlCommonWhere + @"
                 AND C.jobTitleID = @1
                ORDER BY C.displayRank, S.name
        ";
        #endregion

        /// <summary>
        /// List all
        /// </summary>
        /// <param name="language"></param>
        /// <returns></returns>
        public static IEnumerable<Solution> List(string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlSelect + sqlGetList + sqlCommonOrder, language).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> BySearchSubcategory(int searchSubcategoryID, string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlBySearchSubcategoryID, language, searchSubcategoryID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> ByJobTitle(int jobTitleID, string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlByJobTitleID, language, jobTitleID).Select(FromDB);
            }
        }

        public static IEnumerable<Solution> Search(string searchText, string language)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlLimitedSelect + sqlGetList + sqlSearchConditions + sqlCommonOrder;
                return db.Query(sql, language, searchText).Select(FromDB);
            }
        }

        public static Solution Get(int solutionID, string language)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle("SELECT TOP 1 " + sqlGetList + sqlAndId, language, solutionID));
            }
        }
        #endregion
    }
}
