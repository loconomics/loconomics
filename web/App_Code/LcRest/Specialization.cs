using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// Manage specialization records. Take care that an specialized sub-type of this exist 
    /// with name UserPostingSpecialization, just to have only the fields that goes with
    /// an UserPosting record, being responsable of some details.
    /// </summary>
    public class Specialization
    {
        #region Instances
        public Specialization() { }
        #endregion

        #region User incoming list
        const string sqlCheckSpecializations = @"
            SELECT count(*) as c
            FROM Specialization
            WHERE specializationID IN (@0)
                AND languageID = @1
                AND countryID = @2
                AND solutionID = @3
        ";

        /// <summary>
        /// Validates that external list of IDs as text are valid numbers and exists on DB
        /// for the given solutionID and locale
        /// </summary>
        /// <param name="list"></param>
        /// <param name="solutionID"></param>
        /// <param name="locale"></param>
        /// <returns>Formatted text for storage with the specializations IDs</returns>
        public static List<int> ValidateIncomingSpecializations(IEnumerable<string> list, int solutionID, Locale locale)
        {
            var sanitizedList = new List<int>();
            foreach (var sid in list)
            {
                if (!sid.IsInt())
                {
                    throw new ConstraintException("Invalid specialization ID");
                }
                sanitizedList.Add(sid.AsInt());
            }
            // Quick return: when no values
            if (sanitizedList.Count == 0)
            {
                return sanitizedList;
            }

            using (var db = new LcDatabase())
            {
                var sql = db.UseListInSqlParameter(sqlCheckSpecializations, 0, sanitizedList, "-1");
                if (sanitizedList.Count == (int)db.QueryValue(sql, null, locale.languageID, locale.countryID, solutionID))
                {
                    // valid
                    return sanitizedList;
                }
                else
                {
                    throw new ConstraintException("Some specializations are not valid");
                }
            }
        }
        #endregion
    }
}
