using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Descripción breve de LcRestPricingSummaryDetail
    /// </summary>
    public class PricingSummaryDetail
    {
        #region Fields
        public int pricingSummaryID = 0;
        public int pricingSummaryRevision = 0;
        public int serviceProfessionalServiceID;
        public string serviceProfessionalDataInput;
        public string clientDataInput;
        public decimal? hourlyPrice;
        public decimal? price;
        public decimal? serviceDurationMinutes;
        public decimal? firstSessionDurationMinutes;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public PricingSummaryDetail() { }

        public static PricingSummaryDetail FromDB(dynamic record)
        {
            return new PricingSummaryDetail
            {
                pricingSummaryID = record.pricingSummaryID,
                pricingSummaryRevision = record.pricingSummaryRevision,
                serviceProfessionalServiceID = record.serviceProfessionalServiceID,
                serviceProfessionalDataInput = record.serviceProfessionalDataInput,
                clientDataInput = record.clientDataInput,
                hourlyPrice = record.hourlyPrice,
                price = record.price,
                serviceDurationMinutes = record.serviceDurationMinutes,
                firstSessionDurationMinutes = record.firstSessionDurationMinutes,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                pricingEstimateID,
                pricingEstimateRevision,
                serviceProfessionalServiceID,
                serviceProfessionalDataInput,
                clientDataInput,
                hourlyPrice,
                price,
                serviceDurationMinutes,
                firstSessionDurationMinutes,
                createdDate,
                updatedDate
            FROM
                PricingSummary
            WHERE
                PricingSummaryID = @0
                AND PricingSummaryRevision = @1
                AND Active = 1
        ";
        public static IEnumerable<PricingSummaryDetail> GetList(int id, int revision)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlGetItem, id, revision).Select(FromDB);
            }
        }
        #endregion

        #region Set
        #region SQL
        const string sqlInsertItem = @"
            INSERT INTO PricingSummaryDetail (
                PricingSummaryID,
                PricingSummaryRevision,
                ServiceProfessionalServiceID,
                price,
                ServiceDurationMinutes,
                FirstSessionDurationMinutes,
                CreatedDate,
                UpdatedDate,
                ModifiedBy
            ) VALUES (
                @0, -- ID
                @1, -- revision
                @2, -- serviceID
                @3, -- subtotal
                @4, -- duration
                @5, -- first duration
                getdate(), getdate(), 'sys'
            )
        ";
        #endregion

        /// <summary>
        /// Save the given pricing summary detail and returns a copy of the record from database after
        /// that (so it includes andy generated values)
        /// </summary>
        /// <param name="data"></param>
        public static PricingSummaryDetail Set(PricingSummaryDetail data, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                return FromDB(db.QuerySingle(sqlInsertItem,
                    data.pricingSummaryID, data.pricingSummaryRevision,
                    data.serviceProfessionalServiceID,
                    data.price,
                    data.serviceDurationMinutes, data.firstSessionDurationMinutes
                    ));
            }
        }
        #endregion
    }
}