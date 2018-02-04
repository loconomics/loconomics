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

        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
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

                title = record.title,

                jobTitles = ParseJsonJobTitles((string)record.jobTitles),
                notes = record.notes,

                createdDate = record.createdDate,
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
                createdDate,
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

        #region Public Utils
        /// <summary>
        /// Fills in the jobTitles field with values from database for the given
        /// list of Job Title IDs.
        /// This way we use stored job titles names rather than anyone provided through the
        /// external REST API.
        /// </summary>
        /// <param name="jobTitleIds"></param>
        public void FillJobTitlesWithIds(IEnumerable<int> jobTitleIds, int languageID, int countryID)
        {
            jobTitles = new Dictionary<int, string>();
            using (var db = new LcDatabase())
            {
                foreach (int jobTitleID in jobTitleIds)
                {
                    var name = (string)db.QueryValue(@"SELECT PositionSingular FROM Positions WHERE Active = 1
                        AND PositionID = @0
                        AND LanguageID = @1
                        AND CountryID = @2
                    ", jobTitleID, languageID, countryID);
                    if (String.IsNullOrEmpty(name))
                    {
                        throw new ConstraintException("Invalid Job Title ID");
                    }
                    jobTitles.Add(jobTitleID, name);
                }
            }
        }
        #endregion

        #region Changes
        /// <summary>
        /// 
        /// </summary>
        /// <param name="externalListing"></param>
        /// <returns>Generated ID</returns>
        public static int Insert(UserExternalListing externalListing)
        {
            var sqlInsert = @"
                INSERT INTO UserExternalListing (
                    UserID, PlatformID,
                    Title, JobTitles, Notes,
                    CreatedDate, UpdatedDate,
                    ModifiedBy, Active
                ) VALUES (
                    @0, @1, 
                    @2, @3, @4,
                    getdate(), getdate(),
                    'sys', 1
                )
                SELECT @@Identity
            ";

            using (var db = new LcDatabase())
            {
                return (int)db.QueryValue(sqlInsert,
                    externalListing.userID,
                    externalListing.platformID,
                    externalListing.title,
                    Newtonsoft.Json.JsonConvert.SerializeObject(externalListing.jobTitles),
                    externalListing.notes
                );
            }
        }

        public static bool Update(UserExternalListing externalListing)
        {
            var sqlUpdate = @"
                UPDATE  UserExternalListing
                SET     title = @2,
                        jobTitles = @3,
                        notes = @4,
                        UpdatedDate = getdate()
                WHERE   
                    UserID = @0
                    AND UserExternalListingID = @1
                    AND Active = 1
            ";

            using (var db = new LcDatabase())
            {
                var affected = db.Execute(sqlUpdate,
                    externalListing.userID,
                    externalListing.userExternalListingID,
                    externalListing.title,
                    Newtonsoft.Json.JsonConvert.SerializeObject(externalListing.jobTitles),
                    externalListing.notes
                );

                // Task done? Almost a record must be affected to be a success
                return affected > 0;
            }
        }

        public static bool Delete(int userID, int userExternalListingID)
        {
            using (var db = new LcDatabase())
            {
                // Set StatusID to 0 'deleted by user'
                int affected = db.Execute(@"
                    DELETE FROM UserExternalListing
                    WHERE
                        UserID = @0
                        AND UserExternalListingID = @1
                ", userID, userExternalListingID);

                // Task done? Almost a record must be affected to be a success
                return affected > 0;
            }
        }
        #endregion
    }
}
