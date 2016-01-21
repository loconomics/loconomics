using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class JobTitleSearchResult
    {
        #region Fields
        public int jobTitleID;
        public string singularName;
        public string pluralName;
        public string description;
        public string searchDescription;
        public decimal averageRating;
        public long totalRatings;
        public decimal? averageResponseTimeMinutes;
        public decimal? averageHourlyRate;
        public long serviceProfessionalsCount;
        #endregion

        #region Instances
        public static JobTitleSearchResult FromDB(dynamic record)
        {
            if (record == null) return record;
            return new JobTitleSearchResult
            {
                jobTitleID = record.jobTitleID,
                singularName = record.singularName,
                pluralName = record.pluralName,
                description = record.description,
                searchDescription = record.searchDescription,
                averageRating = record.averageRating,
                totalRatings = record.totalRatings,
                averageResponseTimeMinutes = record.averageResponseTimeMinutes,
                averageHourlyRate = record.averageHourlyRate,
                serviceProfessionalsCount = record.serviceProfessionalsCount
            };
        }
        #endregion

        #region Fetch
        public static IEnumerable<JobTitleSearchResult> SearchByCategory(string category, string city, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query("EXEC dbo.SearchPositionsByCategory @0, @1, @2, @3", locale.languageID, locale.countryID, category, city)
                    .Select(FromDB);
            }
        }
        #endregion
    }
}