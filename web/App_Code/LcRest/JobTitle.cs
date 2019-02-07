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
        /// <param name="language"></param>
        /// <returns></returns>
        public static int? FindExactName(string jobTitleName, string language)
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
                        AND Language = @0
                        AND Approved = 1 
                        AND (
                            PositionSingular like @1
                             OR
                            PositionPlural like @1
                        )
                    ", language, jobTitleName);
            }
        }
    }
}