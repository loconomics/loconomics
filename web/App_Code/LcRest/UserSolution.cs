using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// UserSolution
    /// </summary>
    public class UserSolution
    {
        #region Fetch solutions
        /// <summary>
        /// Fetch all active (non deleted) solutions of a user listing,
        /// for both public and private usage
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userListingID"></param>
        /// <param name="locale"></param>
        /// <returns></returns>
        public static IEnumerable<Solution> GetSolutionsByListing(int userID, int userListingID, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                var sql = "SELECT " + Solution.sqlFields + Solution.sqlFrom + @"
                    INNER JOIN UserSolution As U
                     ON U.solutionID = S.solutionID
                        AND U.language = S.language
                    WHERE
                        S.Active = 1
                         AND U.Active = 1
                         AND U.userID = @0
                         AND U.userListingID = @1
                         AND S.language = @2
                    ORDER BY U.DisplayRank
                ";
                return db.Query(sql, userID, userListingID, locale.ToString()).Select(Solution.FromDB);
            }
        }
        #endregion

        #region Put/replace list
        const string sqlSoftDeleteByUserListing = @"
            UPDATE UserSolution
            SET Active = 0
            WHERE UserID = @0
                AND UserListingID = @1
                AND Language = @2
        ";
        const string sqlSet = @"
            UPDATE UserSolution
            SET Active = 1,
                DisplayRank = @4,
                UpdatedDate = getdate(),
                ModifiedBy = @5
            WHERE UserID = @0
                AND UserListingID = @1
                AND Language = @2
                AND SolutionID = @3

            IF @@ROWCOUNT = 0 BEGIN
                INSERT INTO UserSolution (
                    UserID
                    ,UserListingID
                    ,Language
                    ,SolutionID
                    ,DisplayRank
                    ,CreatedDate
                    ,UpdatedDate
                    ,ModifiedBy
                    ,Active
                ) VALUES (
                    @0
                    ,@1
                    ,@2
                    ,@3
                    ,@4
                    ,getdate()
                    ,getdate()
                    ,@5
                    ,1
                )
            END
        ";

        static void Set(int userID, int userListingID, int solutionID, int displayRank, string language, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.QueryValue(sqlSet,
                    userID,
                    userListingID,
                    language,
                    solutionID,
                    displayRank,
                    userID.ToString()
                );
            }
        }

        public static void SetList(int userID, int userListingID, IEnumerable<int> sortedSolutions, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                db.Execute("BEGIN TRANSACTION");
                db.Execute(sqlSoftDeleteByUserListing, userID, userListingID, locale.ToString());
                var displayRank = 1;
                foreach (var solutionID in sortedSolutions)
                {
                    Set(userID, userListingID, solutionID, displayRank, locale.ToString(), db);
                    displayRank += 1;
                }
                db.Execute("COMMIT TRANSACTION");
            }
        }

        /// <summary>
        /// Assign to the given user listing all the solutions that exist as the 'default' ones for the
        /// listing job title
        /// </summary>
        /// <param name="userListingID"></param>
        public static void SetDefaultSolutionsForListing(int userListingID)
        {
            using (var db = new LcDatabase())
            {
                var listing = db.QuerySingle(@"
                    SELECT TOP 1 userID, positionID as jobTitleID, language
                    FROM userprofilepositions WHERE userListingID=@0",
                    userListingID);
                if (listing != null)
                {
                    var defaultSolutions = db.Query(@"
                        SELECT solutionID, displayRank
                        FROM JobTitleSolution
                        WHERE DefaultSelected = 1
                            AND jobTitleID=@0 AND language=@1",
                        listing.jobTitleID, listing.language);

                    db.Execute("BEGIN TRANSACTION");
                    foreach (var solution in defaultSolutions)
                    {
                        Set(listing.userID, userListingID, solution.solutionID, solution.displayRank, listing.language, db);
                    }
                    db.Execute("COMMIT TRANSACTION");
                }
            }
        }
        #endregion
    }
}
