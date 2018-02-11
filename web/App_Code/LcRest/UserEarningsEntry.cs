using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class UserEarningsEntry
    {
        #region Fields
        public int userID;
        public int earningsEntryID;
        public DateTimeOffset paidDate;
        public int durationMinutes;
        public int userExternalListingID;
        public int jobTitleID;
        public int clientUserID;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        public string notes;
        #endregion

        #region Computed fields
        private TimeSpan duration
        {
            get
            {
                return TimeSpan.FromMinutes(durationMinutes);
            }
            set
            {
                durationMinutes = (int)Math.Ceiling(value.TotalMinutes);
            }
        }
        #endregion

        #region Instances
        public UserEarningsEntry() { }

        private static UserEarningsEntry FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserEarningsEntry
            {
                userID = record.userID,
                earningsEntryID = record.earningsEntryID,
                paidDate = record.paidDate,
                durationMinutes = record.durationMinutes,
                userExternalListingID = record.userExternalListingID,
                jobTitleID = record.jobTitleID,
                clientUserID = record.clientUserID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                notes = record.notes
            };
        }
        #endregion

        #region Fetch
        const string sqlSelect = @"
            SELECT 
                userID,
                earningsEntryID,
                paidDate,
                durationMinutes,
                userExternalListingID,
                jobTitleID,
                clientUserID,
                notes,
                createdDate,
                updatedDate
            FROM
                UserEarningsEntry
            WHERE
                Active = 1
                AND UserID = @0
        ";
        const string sqlAndID = @"
                AND earningsEntryID = @1
        ";
        private const string sqlOrderDesc = @"
            ORDER BY T.paidDate DESC
        ";
        private const string sqlOrderAsc = @"
            ORDER BY T.paidDate ASC
        ";
        public static UserEarningsEntry Get(int userID, int earningsEntryID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlSelect + sqlAndID, userID, earningsEntryID));
            }
        }

        public static IEnumerable<UserEarningsEntry> GetList(int userID, int limit, int? untilID = null, int? sinceID = null)
        {
            // Limits: Minimum: 1, Maximum: 100
            limit = Math.Max(1, Math.Min(limit, 100));

            var sql = sqlSelect + sqlOrderDesc;

            // Generally, we get the more recent records (order desc), except
            // if the parameter sinceID was set without an untilID: we
            // want the closest records to that, in other words, 
            // the older records that are more recent that sinceID.
            // A final sorting is done to return rows in descending as ever.
            var usingSinceOnly = sinceID.HasValue && !untilID.HasValue;
            if (usingSinceOnly)
            {
                sql = sqlSelect + sqlOrderAsc;
            }

            using (var db = new LcDatabase())
            {
                // db.Query has a bug not processiong parameters in 'select top @1'
                // so manual replacement
                sql = sql.Replace("@1", limit.ToString());

                var data = db.Query(sqlSelect, userID, limit, untilID, sinceID)
                .Select(FromDB);

                if (usingSinceOnly)
                {
                    // Since rows were get in ascending, records need to be inverted
                    // so we ever return data in descending order (latest first).
                    data.Reverse();
                }

                return data;
            }
        }
        #endregion

        #region Delete
        const string sqlDelete = @"
            UPDATE UserEarningsEntry
            SET Active = 0
            WHERE UserID = @0 AND EarningsEntryID = @1
        ";
        /// <summary>
        /// Delete an entry.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="earningsEntryID"></param>
        public static void Delete(int userID, int earningsEntryID)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlDelete, userID, earningsEntryID);
            }
        }
        #endregion

        #region Create/Update
        const string sqlSet = @"
            DECLARE @userID int = @0
            DECLARE @earningsEntryID int = @1

            IF EXISTS (SELECT earningsEntryID FROM UserEarningsEntry WHERE earningsEntryID = @earningsEntryID AND UserID = @userID)
                UPDATE UserEarningsEntry SET
                    paidDate= @2
                    ,durationMinutes = @3
                    ,userExternalListingID = @4
                    ,jobTitleID = @5
                    ,clientUserID = @6
                    ,Notes = @7
                    ,updatedDate = getdate()
                    ,ModifiedBy = 'user'
                WHERE UserID = @userID AND earningsEntryID = @earningsEntryID
                    AND Active = 1
            ELSE BEGIN
                -- 'Calculate' new ID, restricted to user
                SELECT TOP 1 @earningsEntryID = earningsEntryID + 1
                FROM UserEarningsEntry WITH (TABLOCKX)
                WHERE UserID = @userID
                ORDER BY earningsEntryID DESC

                -- Fallback to 1 if no entries still (or will get zero, no valid)
                IF @earningsEntryID = 0
                SET @earningsEntryID = 1

                INSERT INTO UserEarningsEntry (
                    UserID
                    ,EarningsEntryID
                    ,PaidDate
                    ,DurationMinutes
                    ,UserExternalListingID
                    ,JobTitleID
                    ,ClientUserID
                    ,Notes
                    ,CreatedDate
                    ,updatedDate
                    ,ModifiedBy
                    ,Active
                ) VALUES (
                    @userID
                    ,@earningsEntryID
                    ,@2
                    ,@3
                    ,@4
                    ,@5
                    ,@6
                    ,@7
                    ,getdate()
                    ,getdate()
                    ,'user'
                    ,1
                )
            END

            SELECT @earningsEntryID As ID
        ";
        public static int Set(UserEarningsEntry entry, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                return (int)db.QueryValue(sqlSet,
                    entry.userID,
                    entry.earningsEntryID,
                    entry.paidDate,
                    entry.durationMinutes,
                    entry.userExternalListingID,
                    entry.jobTitleID,
                    entry.clientUserID,
                    entry.notes
                );
            }
        }
        #endregion
    }
}
