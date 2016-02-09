using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class PublicJobTitle
    {
        #region Fields
        public int jobTitleID;
        public int languageID;
        public int countryID;
        public string singularName;
        public string pluralName;
        public string aliases;
        public string description;
        public string searchDescription;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        #region Links
        public IEnumerable<JobTitlePricingType> pricingTypes;

        public void FillPricingTypes()
        {
            pricingTypes = JobTitlePricingType.GetList(jobTitleID, languageID, countryID);
        }
        #endregion

        #region Instances
        public static PublicJobTitle FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicJobTitle
            {
                jobTitleID = record.jobTitleID,
                singularName = record.singularName,
                pluralName = record.pluralName,
                aliases = record.aliases,
                description = record.description,
                searchDescription = record.searchDescription,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                languageID = record.languageID,
                countryID = record.countryID
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetItem = @"
            SELECT
                PositionID As jobTitleID,
                PositionSingular As singularName,
                PositionPlural As pluralName,
                Aliases As aliases,
                PositionDescription As description,
                PositionSearchDescription As searchDescription,
                CreatedDate As createdDate,
                UpdatedDate As updatedDate,
                languageID,
                countryID
            FROM
                positions
            WHERE
                PositionID = @0
                    AND LanguageID = @1
                    AND CountryID = @2
                    AND Active = 1
                    AND (Approved = 1 Or Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        ";
        #endregion
        public static PublicJobTitle Get(int jobTitleID, Locale locale)
        {
            return Get(jobTitleID, locale.languageID, locale.countryID);
        }
        public static PublicJobTitle Get(int jobTitleID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var r = FromDB(db.QuerySingle(sqlGetItem, jobTitleID, languageID, countryID));
                if (r == null) return null;
                r.FillPricingTypes();
                return r;
            }
        }

        /// <summary>
        /// Search job titles by a partial text by singular or plural name, or alias,
        /// and the given locale.
        /// Just returns the ID as value and singular name as label, suitable for autocomplete components.
        /// </summary>
        /// <param name="searchText"></param>
        /// <param name="locale"></param>
        /// <returns></returns>
        public static IEnumerable<AutocompleteResult> AutocompleteSearch(string searchText, LcRest.Locale locale)
        {
            using (var db = new LcDatabase())
            {
                var sql = "EXEC SearchPositions @0, @1, @2";
                return db.Query(sql, "%" + searchText + "%", locale.languageID, locale.countryID)
                    .Select(job => new AutocompleteResult
                    {
                        value = job.PositionID,
                        label = job.PositionSingular
                    });
            }
        }

        public static IEnumerable<PublicJobTitle> SearchByCategory(string category, string city, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query("EXEC dbo.SearchPositionsByCategory @0, @1, @2", locale.languageID, locale.countryID, category, city)
                    .Select(FromDB);
            }
        }
        #endregion
    }
}