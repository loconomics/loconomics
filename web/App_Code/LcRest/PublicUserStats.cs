using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// PublicUserStats
    /// </summary>
    public class PublicUserStats
    {
        #region Fields
        public int userID;
        public decimal? responseTimeMinutes;
        #endregion

        #region Instances
        public PublicUserStats() {}

        public static PublicUserStats FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserStats
            {
                userID = record.userID,
                responseTimeMinutes = record.responseTimeMinutes
            };
        }
        #endregion

        #region Fetch
        public static PublicUserStats Get(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle("SELECT userID, responseTimeMinutes FROM UserStats WHERE UserID = @0", userID));
            }
        }
        #endregion
    }
}