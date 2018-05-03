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
        public static IEnumerable<Solution> GetSolutionsByListing(int userID, int userListingID, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                var sql = "SELECT " + Solution.sqlFields + Solution.sqlFrom + @"
                    INNER JOIN UserSolution As U
                     ON U.solutionID = S.solutionID
                        AND U.languageID = S.languageID
                        AND U.countryID = S.countryID
                    WHERE
                        S.Active = 1
                         AND U.userID = @0
                         AND U.userListingID = @1
                         AND S.languageID = @2
                         AND S.countryID = @3
                    ORDER BY U.DisplayRank
                ";
                return db.Query(sql, userID, userListingID, locale.languageID, locale.countryID).Select(Solution.FromDB);
            }
        }
        #endregion

        #region Put/replace list
        const string sqlSoftDeleteByUserListing = @"
            UPDATE UserSolution
            SET Active = 0
            WHERE UserID = @0
                AND UserListingID = @1
                AND LanguageID = @2
                AND CountryID = @3
        ";
        const string sqlSet = @"
            UPDATE UserSolution
            SET Active = 1,
                DisplayRank = @5,
                UpdatedDate = getdate(),
                ModifiedBy = @6
            WHERE UserID = @0
                AND UserListingID = @1
                AND LanguageID = @2
                AND CountryID = @3
                AND SolutionID = @4

            IF @@ROWCOUNT = 0 BEGIN
                INSERT INTO UserSolution (
                    UserID
                    ,UserListingID
                    ,LanguageID
                    ,CountryID
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
                    ,@5
                    ,getdate()
                    ,getdate()
                    ,@6
                    ,1
                )
            END
        ";

        static void Set(int userID, int userListingID, int solutionID, int displayRank, Locale locale, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.QueryValue(sqlSet,
                    userID,
                    userListingID,
                    locale.languageID,
                    locale.countryID,
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
                db.Execute(sqlSoftDeleteByUserListing, userID, userListingID, locale.languageID, locale.countryID);
                var displayRank = 1;
                foreach (var solutionID in sortedSolutions)
                {
                    Set(userID, userListingID, solutionID, displayRank, locale, db);
                    displayRank += 1;
                }
                db.Execute("COMMIT TRANSACTION");
            }
        }
        #endregion
    }
}
