using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Public User Verifications, for the user or for a job-title
    /// </summary>
    public class PublicUserVerification
    {
        #region Fields
        public int userID;
        public int verificationID;
        /// <summary>
        /// Can be 0 to mean 'user verification' and not 'job title verification'
        /// </summary>
        public int jobTitleID;
        public DateTime lastVerifiedDate;
        #endregion

        #region Links
        public Verification verification;
        #endregion

        #region Instances
        public static PublicUserVerification FromDB(dynamic record)
        {
            if (record == null) return null;
            var uv = new PublicUserVerification
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                verificationID = record.verificationID,
                lastVerifiedDate = record.lastVerifiedDate
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
                    AND VerificationStatusID = 1 -- ONLY confirmed ones
                    AND PositionID = @1
        ";

        public static IEnumerable<PublicUserVerification> GetList(int userID, int jobTitleID = 0)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID).Select(FromDB);
            }
        }
        #endregion
    }
}
