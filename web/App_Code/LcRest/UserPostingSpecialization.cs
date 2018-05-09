using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// A simplified structure for Specializations, just with data needed to attach to a UserPosting
    /// (id, name) and utilities. Check the Specialization class too.
    /// </summary>
    public class UserPostingSpecialization
    {
        #region Fields
        public int specializationID;
        public string name;
        #endregion

        #region Instances
        public UserPostingSpecialization() { }

        public static UserPostingSpecialization FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserPostingSpecialization
            {
                specializationID = record.specializationID,
                name = record.name
            };
        }
        #endregion

        #region Fetch
        const string sqlGetSpecializationsByIds = @"
            SELECT specializationID, name
            FROM Specialization
            WHERE specializationID IN (@0)
                AND languageID = @1
                AND countryID = @2
                AND Approved <> 0
        ";
        public static IEnumerable<UserPostingSpecialization> ListBy(IEnumerable<int> ids, int languageID, int countryID)
        {
            // Quick return
            if (ids.Count() == 0)
            {
                return new List<UserPostingSpecialization> { };
            }
            using (var db = new LcDatabase())
            {
                var sql = db.UseListInSqlParameter(sqlGetSpecializationsByIds, 0, ids, "-1");
                return db.Query(sql, null, languageID, countryID).Select(FromDB);
            }
        }
        #endregion
    }
}
