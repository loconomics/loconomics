using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// UserVerifications
    /// </summary>
    public class UserVerification
    {
        #region Fields
        public int userID;
        public int verificationID;
        /// <summary>
        /// Can be 0 to mean 'user verification' and not 'job title verification'
        /// </summary>
        public int jobTitleID;
        public DateTime? lastVerifiedDate;
        public int statusID;
        #endregion

        #region Links
        public Verification verification;
        #endregion

        #region Instances
        public static UserVerification FromDB(dynamic record)
        {
            if (record == null) return null;
            var uv = new UserVerification
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                verificationID = record.verificationID,
                lastVerifiedDate = record.lastVerifiedDate,
                statusID = record.statusID
            };

            // If the record has verification information, include it
            // (try-catch because will fail if not found columns)
            try
            {
                uv.verification = Verification.FromDB(record);
            }
            catch { }

            return uv;
        }
        #endregion

        #region Fetch
        const string sqlGetList = @"
            SELECT  
                    UV.userID,
                    UV.positionID As jobTitleID,
                    UV.lastVerifiedDate,
                    UV.VerificationStatusID As statusID,
                    V.VerificationType As name,
                    V.VerificationDescription As description,
                    V.icon,
                    V.verificationID,
                    V.summaryGroup
                    -- V.verificationCategoryID
            FROM    UserVerification As UV
                        INNER JOIN
                    Verification As V
                        ON UV.VerificationID = V.VerificationID
            WHERE   UserID = @0
        ";

        public static IEnumerable<UserVerification> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID).Select(FromDB);
            }
        }
        #endregion
    }
}