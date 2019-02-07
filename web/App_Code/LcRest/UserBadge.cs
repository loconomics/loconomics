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
        public string category = "general";
        public string createdBy = "user";
        public string modifiedBy = "user";
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
                createdBy = record.createdBy,
                modifiedBy = record.modifiedBy,
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
                b.createdBy,
                b.modifiedBy,
                b.expiryDate,
                b.createdDate,
                b.updatedDate
            FROM
                UserBadge as b
        ";
        const string sqlWhere = @"
            WHERE b.userID = @0 AND b.Active = 1
                AND b.language = @1
        ";
        const string sqlByID = @"
            AND b.userBadgeID = @2
        ";
        const string sqlByListing = @"
                LEFT JOIN UserSolution as s
                  ON s.solutionID = b.solutionID AND s.Active = 1
        " + sqlWhere + @"
                and (s.userListingID = @2 OR b.solutionID is null)
        ";
        const string sqlBySolution = @"
                LEFT JOIN UserSolution as s
                  ON s.solutionID = b.solutionID AND s.Active = 1
        " + sqlWhere + @"
                and b.solutionID = @2
        ";
        const string sqlAndPublicOnly = @"
                AND (b.expiryDate is null OR b.expiryDate > getdate())
        ";
        public static UserBadge Get(int userID, int userBadgeID, string language)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlWhere + sqlByID;
                return FromDB(db.QuerySingle(sql, userID, language, userBadgeID));
            }
        }
        /// <summary>
        /// Includes all badges assigned to solutions included in the listing, plus user profile badges (where solutionID is null)
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userListingID"></param>
        /// <param name="language"></param>
        /// <param name="onlyPublicOnes">Request only badges that can be displayed publicly</param>
        /// <returns></returns>
        public static IEnumerable<UserBadge> ListByListing(int userID, int userListingID, string language, bool onlyPublicOnes = false)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlByListing + (onlyPublicOnes ? sqlAndPublicOnly : "");
                return db.Query(sql, userID, language, userListingID).Select(FromDB);
            }
        }
        /// <summary>
        /// Includes strictly only badges assigned to the solutionID. Can be null to fetch non-solution badges (apply to the whole user profile).
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="solutionID"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public static IEnumerable<UserBadge> ListBySolution(int userID, int? solutionID, string language)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + (solutionID.HasValue ? sqlBySolution : sqlWhere + " AND b.solutionID is null");
                return db.Query(sql, userID, language, solutionID).Select(FromDB);
            }
        }
        /// <summary>
        /// List all (non deleted) user badges, for internal, admin, usage.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public static IEnumerable<UserBadge> ListAllByUser(int userID, string language)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelect + sqlWhere;
                return db.Query(sql, userID, language).Select(FromDB);
            }
        }
        #endregion

        #region Delete
        const string sqlDelete = @"
            UPDATE UserBadge
                SET Active = 0
            WHERE UserID = @0
                AND language = @1
                AND UserBadgeID = @2
        ";
        const string sqlRestrictToUserCreated = " AND CreatedBy like 'user'";
        /// <summary>
        /// Delete an entry. Only if user generated
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userBadgeID"></param>
        public static void Delete(int userID, int userBadgeID, string language, bool byAdmin = false)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlDelete + (byAdmin ? "" : sqlRestrictToUserCreated);
                db.Execute(sql, userID, userBadgeID);
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
                    ,expiryDate = @6
                    ,updatedDate = getdate()
                    ,ModifiedBy = @10
                WHERE UserID = @userID
                    -- The user can only edit if was created by himself
                    AND (@9 not like 'user' OR CreatedBy like 'user')
                    AND userBadgeID = @userBadgeID
                    AND Active = 1
            ELSE BEGIN
                INSERT INTO UserBadge (
                    UserID
                    ,solutionID
                    ,badgeURL
                    ,type
                    ,category
                    ,expiryDate
                    ,language
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
                    ,@8
                    ,getdate()
                    ,getdate()
                    ,@9
                    ,@10
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
                    entry.category,
                    entry.expiryDate,
                    locale.ToString(),
                    entry.createdBy,
                    entry.modifiedBy
                );
            }
        }
        #endregion
    }
}
