using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class UserExternalListing
    {
        #region Fields
        public int userExternalListingID { get; set; }
        public int userID { get; set; }
        public int platformID { get; set; }

        public string title { get; set; }

        public Dictionary<int, string> jobTitles { get; set; }
        public string notes { get; set; }

        public DateTime updatedDate;
        #endregion

        #region Instances
        public UserExternalListing() { }

        private static Dictionary<int, string> ParseJsonJobTitles(string dbText)
        {
            if (string.IsNullOrWhiteSpace(dbText)) return new Dictionary<int, string>();
            return (Dictionary<int, string>)Newtonsoft.Json.JsonConvert.DeserializeObject(dbText, typeof(Dictionary<int, string>));
        }

        public static UserExternalListing FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserExternalListing
            {
                userExternalListingID = record.userExternalListingID,
                userID = record.userID,
                platformID = record.platformID,

                title = record.intro,

                jobTitles = ParseJsonJobTitles((string)record.jobTitles),
                notes = record.notes,

                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetList = @"
            SELECT
                userExternalListingID,
                userID,
                platformID,
                title,
                jobTitles,
                notes,
                updatedDate
            FROM UserExternalListing
            WHERE Active = 1
                AND UserID = @0
        ";
        const string sqlGetItem = sqlGetList + @"
                AND userExternalListingID = @1
        ";
        #endregion

        public static IEnumerable<UserExternalListing> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID).Select(FromDB);
            }
        }
        public static UserExternalListing Get(int userID, int userExternalListingID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, userID, userExternalListingID));
            }
        }
        #endregion
    }
}
