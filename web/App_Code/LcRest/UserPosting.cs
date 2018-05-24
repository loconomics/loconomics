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
        /// <summary>
        /// Optional info about the userID creating the posting, filled when 
        /// the posting is displayed to suggested professional(s)
        /// </summary>
        public PublicUserProfile client;
        /// <summary>
        /// User-dependant info: based on the user requesting the information, this field
        /// is filled or not.
        /// For professionals fetching a suggested user posting, this can include which reaction
        /// they have given to it (they discarded, they applied for it,..) and some reactions can
        /// even prevent the posting from being returned through the API under default query.
        /// If no reaction still, is null; for the creator of the posting, this will be ever null.
        /// </summary>
        public LcEnum.UserPostingReactionType? reactionTypeID;
        /// <summary>
        /// Related to reactionTypeID, will only have a value when that one has too, so all
        /// its rules apply here. From the underlyning UserPostingReaction table, the 
        /// updatedDate value is used here.
        /// </summary>
        public DateTimeOffset? reactionDate;
        [JsonIgnore]
        public int languageID;
        [JsonIgnore]
        public int countryID;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instances
        public UserPosting() { }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="record"></param>
        /// <param name="fillSpecializations"></param>
        /// <param name="clientRequesterUserID">UserID of a professional that request client information to be filled in</param>
        /// <returns></returns>
        private static UserPosting FromDB(dynamic record, bool fillSpecializations = false, int clientRequesterUserID = 0)
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
                countryID = record.countryID,
                postingTemplateID = record.postingTemplateID
            };
            if (fillSpecializations)
            {
                r.FillSpecializations();
            }
            if (clientRequesterUserID > 0)
            {
                r.FillClient(clientRequesterUserID);
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
        
        public void FillClient(int requesterUserID)
        {
            client = PublicUserProfile.Get(userID, requesterUserID);
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
        const string sqlFields = @"
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
        ";
        const string sqlFromTables = @"
                UserPosting as A
                INNER JOIN Solution as S
                 ON A.solutionID = S.solutionID
                 AND A.languageID = S.languageID
                 AND A.countryID = S.countryID
        ";
        const string sqlSelect = @"
            SELECT " + sqlFields + @"
            FROM " + sqlFromTables;
        const string sqlWhereUser = @"
            WHERE a.userID = @0
                AND a.languageID = @1 AND a.countryID = @2
        ";
        const string sqlWhereUserAndID = sqlWhereUser + @"
            AND a.userPostingID = @3
        ";
        const string sqlOrderByDate = "ORDER BY a.createdDate DESC";
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

        #region Suggested lists
        const string sqlSelectSuggestedForUser = "SELECT " + sqlFields + @"
                ,r.reactionTypeID
                ,r.updatedDate as reactionDate 
            FROM " + sqlFromTables + @"
                INNER JOIN UserSolution
                 ON UserSolution.SolutionID = A.SolutionID
                    AND UserSolution.Active = 1
                LEFT JOIN UserPostingReaction As R
                 ON R.userPostingID = a.userPostingID
                 AND R.serviceProfessionalUserID = @0
            WHERE a.userID <> @0
                AND UserSolution.userID = @0
                AND a.languageID = @1 AND a.countryID = @2
                AND a.statusID = 1
        ";
        const string sqlReactionFiltered = @"
                -- Only not-set or applied reactions (prevents 'discarded' from appearing)
                AND (R.reactionTypeID is null OR R.reactionTypeID = 1)
        ";
        /// <summary>
        /// Provides a list of postings suggested for that user to apply for.
        /// It NEVER returns sugestions where the user is the creator on it, only active suggestions
        /// and matches based on the solutionID and the user listings (maybe on needed specializations at some point)
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <param name="fillLinks"></param>
        /// <returns></returns>
        public static IEnumerable<UserPosting> ListSuggestedPostings(int userID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelectSuggestedForUser + sqlReactionFiltered + sqlOrderByDate;
                return db.Query(sql, userID, languageID, countryID)
                    .Select((r) => {
                        var post = (UserPosting)FromDB(r, true, userID);
                        post.reactionDate = r.reactionDate;
                        post.reactionTypeID = (LcEnum.UserPostingReactionType?)r.reactionTypeID;
                        return post;
                    });
            }
        }
        /// <summary>
        /// Get a single user posting if suggested for the given user, attaching any reaction information it has (even discarded)
        /// </summary>
        /// <param name="userPostingID"></param>
        /// <param name="userID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static UserPosting GetSuggestedPosting(int userPostingID, int userID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                var sql = sqlSelectSuggestedForUser + " AND a.userPostingID = @3 " + sqlOrderByDate;
                var r = db.QuerySingle(sql, userID, languageID, countryID, userPostingID);
                var post = (UserPosting)FromDB(r, true, userID);
                post.reactionDate = r.reactionDate;
                post.reactionTypeID = (LcEnum.UserPostingReactionType?)r.reactionTypeID;
                return post;
            }
        }
        const string sqlSelectSuggestedProfessionals = @"
            SELECT
                UserSolution.userID,
                userprofile.email
            FROM
                UserPosting as A
                INNER JOIN UserSolution
                 ON UserSolution.SolutionID = A.SolutionID
                    AND UserSolution.Active = 1
                INNER JOIN userprofile
                 ON userprofile.userId = UserSolution.userID
                -- Only CCC students right now
                INNER JOIN CCCUsers
                 ON CCCUsers.userID = userprofile.userId
                 AND CCCUsers.UserType like 'student'
            WHERE a.userPostingID = @0
                AND a.languageID = @1 AND a.countryID = @2
                AND a.statusID = 1
        " + sqlOrderByDate;
        /// <summary>
        /// Provides a list of service professionals suggested to apply to a given userPostingID
        /// </summary>
        /// <param name="userPostingID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<UserEmail> ListSuggestedProfessionals(int userPostingID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlSelectSuggestedProfessionals, userPostingID, languageID, countryID)
                    .Select((r) => (UserEmail)UserEmail.FromDB(r));
            }
        }
        #endregion

        #region Service Professional Reactions
        const string sqlSetReaction = @"
            UPDATE UserPostingReaction
            SET reactionTypeID = @2, message = @3, updatedDate = getdate()
            WHERE UserPostingID = @0 AND serviceProfessionalUserID = @1

            IF @@ROWCOUNT = 0
                INSERT INTO UserPostingReaction (
                    userPostingID,
                    serviceProfessionalUserID,
                    reactionTypeID,
                    createdDate,
                    updatedDate,
                    message
                ) VALUES (
                    @0, @1, @2,
                    getdate(), getdate(),
                    @3
                )
        ";
        /// <summary>
        /// Saves a record with the service professional reaction to a user posting. It does NOT send any message on cases
        /// that should being needed ('apply'), check LcMessaging for one to run manually.
        /// </summary>
        /// <param name="userPostingID"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="reaction"></param>
        /// <param name="message"></param>
        public static void SetServiceProfessionalReaction(
            int userPostingID, int serviceProfessionalUserID, LcEnum.UserPostingReactionType reaction, string message = null)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSetReaction, userPostingID, serviceProfessionalUserID, (short)reaction, message);
            }
        }
        public static string GetServiceProfessionalReactionMessage(int userPostingID, int serviceProfessionalUserID)
        {
            using (var db = new LcDatabase())
            {
                var sql = @"
                    SELECT TOP 1 message FROM UserPostingReaction
                    WHERE UserPostingID = @0 AND serviceProfessionalUserID = @1
                ";
                return (string)db.QueryValue(sql, userPostingID, serviceProfessionalUserID);
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
                AND StatusID < 2
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
        /// <summary>
        /// Change a posting status, by the author, but only posible if status is editable (0:incomplete, 1:active)
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="userPostingID"></param>
        /// <param name="status"></param>
        public static void SetStatus(int userID, int userPostingID, LcEnum.UserPostingStatus status)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(@"UPDATE UserPosting
                    SET StatusID = @2, updatedDate = getdate()
                    WHERE UserPostingID = @0 AND userID = @1
                        AND StatusID < 2", userPostingID, userID, (short)status);
            }
        }
        #endregion
    }
}
