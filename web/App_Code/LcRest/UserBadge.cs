using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// UserBagdes.
    /// 
    /// Every entry is related to a solutionID, or null for general profile badges (apply to every solution, listing)
    /// </summary>
    public class UserBadge
    {
        #region Fields
        public int userBadgeID;
        public int userID;
        public int? solutionID;
        public string badgeURL;
        public string type;
        public string category;
        public DateTimeOffset? expiryDate;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instances
        public UserBadge() { }

        private static UserBadge FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserBadge
            {
                userBadgeID = record.userBadgeID,
                userID = record.userID,
                solutionID = record.solutionID,
                badgeURL = record.badgeURL,
                type = record.type,
                category = record.category,
                expiryDate = record.expiryDate,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        const string sqlSelect = @"
            SELECT
                b.userBadgeID,
                b.userID,
                b.solutionID,
                b.badgeURL,
                b.type,
                b.category,
                b.expiryDate,
                b.createdDate,
                b.updatedDate
            FROM
                UserBadge as b
        ";
        const string sqlWhere = @"
            WHERE b.userID = @0 AND b.Active = 1
                AND b.languageID = @1 AND b.countryID = @2
        ";
        const string sqlByID = @"
            AND b.userBadgeID = @3
        ";
        const string sqlByListing = @"
                LEFT JOIN UserSolution as s
                  ON s.solutionID = b.solutionID AND s.Active = 1
        " + sqlWhere + @"
                and (s.userListingID = @3 OR b.solutionID is null)
        ";
        const string sqlBySolution = @"
                LEFT JOIN UserSolution as s
                  ON s.solutionID = b.solutionID AND s.Active = 1
        " + sqlWhere + @"
                and b.solutionID = @3
        ";
        public static UserBadge Get(int userID, int userBadgeID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlWhere + sqlByID;
                return FromDB(db.QuerySingle(sql, userID, languageID, countryID, userBadgeID));
            }
        }
        /// <summary>
        /// Includes all badges assigned to solutions included in the listing, plus user profile badges (where solutionID is null)
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userListingID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<UserBadge> ListByListing(int userID, int userListingID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlByListing;
                return db.Query(sql, userID, languageID, countryID, userListingID).Select(FromDB);
            }
        }
        /// <summary>
        /// Includes strictly only badges assigned to the solutionID. Can be null to fetch non-solution badges (apply to the whole user profile).
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="solutionID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<UserBadge> ListBySolution(int userID, int? solutionID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + (solutionID.HasValue ? sqlBySolution : sqlWhere + " AND b.solutionID is null");
                return db.Query(sql, userID, languageID, countryID, solutionID).Select(FromDB);
            }
        }
        #endregion

        #region Delete
        const string sqlDelete = @"
            UPDATE UserBadge
                SET Active = 0
            WHERE UserID = @0 AND CreatedBy like 'user'
                AND languageID = @1 AND countryID = @2
                AND UserBadgeID = @3
        ";
        /// <summary>
        /// Delete an entry. Only if user generated
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userBadgeID"></param>
        public static void Delete(int userID, int userBadgeID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlDelete, userID, languageID, countryID, userBadgeID);
            }
        }
        #endregion

        #region Create/Update
        const string sqlSet = @"
            DECLARE @userID int = @0
            DECLARE @userBadgeID int = @1

            IF @userBadgeID > 0
                UPDATE UserBadge SET
                    solutionID = @2
                    ,badgeURL = @3
                    ,type = @4
                    ,category = @5
                    ,updatedDate = getdate()
                    ,ModifiedBy = 'user'
                WHERE UserID = @userID
                    AND CreatedBy like 'user'
                    AND userBadgeID = @userBadgeID
                    AND Active = 1
            ELSE BEGIN
                INSERT INTO UserBadge (
                    UserID
                    ,solutionID
                    ,badgeURL
                    ,type
                    ,category
                    ,languageID
                    ,countryID
                    ,CreatedDate
                    ,updatedDate
                    ,createdBy
                    ,ModifiedBy
                    ,Active
                ) VALUES (
                    @userID
                    ,@2
                    ,@3
                    ,@4
                    ,@5
                    ,@6
                    ,@7
                    ,getdate()
                    ,getdate()
                    ,'user'
                    ,'user'
                    ,1
                )
            END

            SELECT coalesce(@@Identity, @userBadgeID) As ID
        ";
        public static int Set(UserBadge entry, Locale locale, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                return (int)db.QueryValue(sqlSet,
                    entry.userID,
                    entry.userBadgeID,
                    entry.solutionID,
                    entry.badgeURL,
                    entry.type,
                    // all user entries have the same, fixed, category:
                    "general", //entry.category,
                    locale.languageID,
                    locale.countryID
                );
            }
        }
        #endregion
    }
}
