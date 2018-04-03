using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// JobTitle
    /// </summary>
    public class JobTitle
    {
        /// <summary>
        /// Searchs for an exact match of a job title given a singular or plural name, and matching language
        /// </summary>
        /// <param name="jobTitleName"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static int? FindExactName(string jobTitleName, int languageID, int countryID)
        {
            if (String.IsNullOrWhiteSpace(jobTitleName))
            {
                return null;
            }
            using (var db = new LcDatabase())
            {
                return (int?)db.QueryValue(@"
                    SELECT PositionID
                    FROM Positions
                    WHERE Active = 1
                        AND LanguageID = @0
                        AND CountryID = @1
                        AND Approved = 1 
                        AND (
                            PositionSingular like @2
                             OR
                            PositionPlural like @2
                        )
                    ", languageID, countryID, jobTitleName);
            }
        }
    }
}