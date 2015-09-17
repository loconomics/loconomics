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
        public int languageID;
        public int countryID;
        public string name;
        public string description;
        public int hoursRequired;
        public decimal refundIfCancelledBefore;
        public decimal refundIfCancelledAfter;
        public decimal refundOfServiceFees;
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
                languageID = record.languageID,
                countryID = record.countryID,
                name = record.name,
                description = record.description,
                hoursRequired = record.hoursRequired,
                refundIfCancelledBefore = (decimal)record.refundIfCancelledBefore,
                refundIfCancelledAfter = (decimal)record.refundIfCancelledAfter,
                refundOfServiceFees = (decimal)record.refundOfServiceFees,
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
                languageID,
                countryID,
                cancellationPolicyName As name,
                cancellationPolicyDescription As description,
                hoursRequired,
                refundIfCancelledBefore,
                refundIfCancelledAfter,
                refundOfLoconomicsFee As refundOfServiceFees,
                updatedDate
            FROM CancellationPolicy
            WHERE CancellationPolicyID = @0
                AND LanguageID = @1 AND CountryID = @2
        ";
        #endregion

        public static CancellationPolicy Get(int cancellationPolicyID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, cancellationPolicyID, languageID, countryID));
            }
        }
        #endregion
    }
}
