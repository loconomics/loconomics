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
        public LcEnum.UserPostingStatus statusID = LcEnum.UserPostingStatus.open;
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
                var sql = sqlSelect + sqlWhereUser;
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

    /// <summary>
    /// A simplified structure for Specializations, just with data needed to attach to a UserPosting
    /// (id, name)
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
