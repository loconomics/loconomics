using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Query cancellation policy information
    /// </summary>
    public class CancellationPolicy
    {
        #region Fields
        public int cancellationPolicyID;
        public string language;
        public string name;
        public string description;
        public int hoursRequired;
        public decimal cancellationFeeAfter;
        public decimal cancellationFeeBefore;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public CancellationPolicy() { }

        public static CancellationPolicy FromDB(dynamic record)
        {
            if (record == null) return null;
            return new CancellationPolicy
            {
                cancellationPolicyID = record.cancellationPolicyID,
                language = record.language,
                name = record.name,
                description = record.description,
                hoursRequired = record.hoursRequired,
                cancellationFeeAfter = (decimal)record.cancellationFeeAfter,
                cancellationFeeBefore = (decimal)record.cancellationFeeBefore,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Consts
        /// <summary>
        /// Currently, default cancellation policy is Flexible:3
        /// TODO: Use a LcEnum?
        /// </summary>
        public const int DefaultCancellationPolicyID = 3;
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetItem = @"
            SELECT
                cancellationPolicyID,
                language,
                cancellationPolicyName As name,
                cancellationPolicyDescription As description,
                hoursRequired,
                cancellationFeeAfter,
                cancellationFeeBefore,
                updatedDate
            FROM CancellationPolicy
            WHERE CancellationPolicyID = @0
                AND Language = @1
        ";
        #endregion

        public static CancellationPolicy Get(int cancellationPolicyID, string language)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, cancellationPolicyID, language));
            }
        }
        #endregion
    }
}
