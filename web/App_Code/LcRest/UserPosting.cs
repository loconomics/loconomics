using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// UserPosting.
    /// </summary>
    public class UserPosting
    {
        #region Fields
        public int userPostingID;
        public int userID;
        public int solutionID;
        /// <summary>
        /// Read-only, filled from the related solutionID
        /// </summary>
        public string solutionName;
        public int postingTemplateID;
        public LcEnum.UserPostingStatus statusID = LcEnum.UserPostingStatus.active;
        public string title;
        [JsonIgnore]
        public IEnumerable<int> neededSpecializationIDs;
        [JsonIgnore]
        public IEnumerable<int> desiredSpecializationIDs;
        public IEnumerable<UserPostingSpecialization> neededSpecializations;
        public IEnumerable<UserPostingSpecialization> desiredSpecializations;
        [JsonIgnore]
        public int languageID;
        [JsonIgnore]
        public int countryID;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instances
        public UserPosting() { }

        private static UserPosting FromDB(dynamic record, bool fillLinks = false)
        {
            if (record == null) return null;

            var neededSpecializations = ConvertListOfSpecializationIDs(record.neededSpecializationIDs);
            var desiredSpecializations = ConvertListOfSpecializationIDs(record.desiredSpecializationIDs);

            var r = new UserPosting
            {
                userPostingID = record.userPostingID,
                userID = record.userID,
                solutionID = record.solutionID,
                solutionName = record.solutionName,
                title = record.title,
                statusID = (LcEnum.UserPostingStatus)record.statusID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                neededSpecializationIDs = neededSpecializations,
                desiredSpecializationIDs = desiredSpecializations,
                languageID = record.languageID,
                countryID = record.countryID
            };
            if (fillLinks)
            {
                r.FillSpecializations();
            }
            return r;
        }
        #endregion

        #region Links
        public void FillSpecializations(LcDatabase database = null)
        {
            neededSpecializations = UserPostingSpecialization.ListBy(neededSpecializationIDs, languageID, countryID);
            desiredSpecializations = UserPostingSpecialization.ListBy(desiredSpecializationIDs, languageID, countryID);
        }

        /// <summary>
        /// Comma separated or JSON array of integers
        /// </summary>
        /// <param name="list"></param>
        /// <returns></returns>
        private static List<int> ConvertListOfSpecializationIDs(string list)
        {
            if (String.IsNullOrWhiteSpace(list))
            {
                return new List<int>();
            }
            list = list.Trim('[', ']');
            return list.Split(',').Select((sid) => sid.AsInt()).ToList();
        }
        #endregion

        #region Fetch
        const string sqlSelect = @"
            SELECT
                a.userPostingID,
                a.userID,
                a.solutionID,
                s.name as solutionName,
                a.postingTemplateID,
                a.statusID,
                a.title,
                a.neededSpecializationIDs,
                a.desiredSpecializationIDs,
                a.createdDate,
                a.updatedDate,
                a.languageID,
                a.countryID
            FROM
                UserPosting as A
                INNER JOIN Solution as S
                 ON A.solutionID = S.solutionID
                 AND A.languageID = S.languageID
                 AND A.countryID = S.countryID
        ";
        const string sqlWhereUser = @"
            WHERE a.userID = @0
                AND a.languageID = @1 AND a.countryID = @2
        ";
        const string sqlWhereUserAndID = sqlWhereUser + @"
            AND a.userPostingID = @3
        ";
        const string sqlOrderByDate = "ORDER BY createdDate DESC";
        public static UserPosting Get(int userID, int userPostingID, int languageID, int countryID, bool fillLinks)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlWhereUserAndID;
                return FromDB(db.QuerySingle(sql, userID, languageID, countryID, userPostingID), fillLinks);
            }
        }
        /// <summary>
        /// List postings of an user
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<UserPosting> List(int userID, int languageID, int countryID, bool fillLinks)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlWhereUser + sqlOrderByDate;
                return db.Query(sql, userID, languageID, countryID).Select((r) => (UserPosting)FromDB(r, fillLinks));
            }
        }
        #endregion

        #region Delete
        const string sqlDelete = @"
            DELETE FROM UserPosting
            WHERE UserID = @0
                AND languageID = @1 AND countryID = @2
                AND UserPostingID = @3
        ";
        /// <summary>
        /// 
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userPostingID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        public static void Delete(int userID, int userPostingID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlDelete;
                db.Execute(sql, userID, languageID, countryID, userPostingID);
            }
        }
        #endregion

        #region Create/Update
        const string sqlUpdate = @"
            UPDATE UserPosting SET
                title = @2
                ,neededSpecializationIDs = @3
                ,desiredSpecializationIDs = @4
                ,updatedDate = getdate()
                ,ModifiedBy = @0
            WHERE UserID = @0
                AND userPostingID = @1
        ";
        const string sqlInsert = @"
            INSERT INTO UserPosting (
                UserID
                ,solutionID
                ,postingTemplateID
                ,statusID
                ,title
                ,neededSpecializationIDs
                ,desiredSpecializationIDs
                ,languageID
                ,countryID
                ,CreatedDate
                ,updatedDate
                ,ModifiedBy
            ) VALUES (
                @0
                ,@1
                ,@2
                ,@3
                ,@4
                ,@5
                ,@6
                ,@7
                ,@8
                ,getdate()
                ,getdate()
                ,@0
            )
            SELECT @@Identity As ID
        ";
        public static int Set(UserPosting entry, Locale locale, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                var neededSpecializationsText = string.Join(",", entry.neededSpecializationIDs);
                var desiredSpecializationsText = string.Join(",", entry.desiredSpecializationIDs);

                if (entry.userPostingID > 0)
                {
                    db.QueryValue(sqlUpdate,
                        entry.userID,
                        entry.userPostingID,
                        entry.title,
                        neededSpecializationsText,
                        desiredSpecializationsText
                    );
                    return entry.userPostingID;
                }
                else
                {
                    return (int)db.QueryValue(sqlInsert,
                        entry.userID,
                        entry.solutionID,
                        entry.postingTemplateID,
                        entry.statusID,
                        entry.title,
                        neededSpecializationsText,
                        desiredSpecializationsText,
                        locale.languageID,
                        locale.countryID,
                        entry.userID
                    );
                }
            }
        }
        public static void SetStatus(int userPostingID, LcEnum.UserPostingStatus status)
        {
            using (var db = new LcDatabase())
            {
                db.Execute("UPDATE UserPosting SET StatusID = @1 WHERE UserPostingID = @0", userPostingID, (short)status);
            }
        }
        #endregion
    }
}
