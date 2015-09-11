using System;
using System.Collections.Generic;
using System.Linq;
using WebMatrix.Data;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class PricingSummary
    {
        #region Fields
        public int pricingSummaryID;
        public int pricingSummaryRevision;
        public decimal? serviceDurationHours;
        public decimal? firstSessionDurationHours;
        public decimal? subtotalPrice;
        public decimal? feePrice;
        public decimal? totalPrice;
        public decimal? pFeePrice;
        public DateTime createdDate;
        public DateTime updatedDate;
        public decimal? subtotalRefunded;
        public decimal? feeRefunded;
        public decimal? totalRefunded;
        public decimal? dateRefunded;
        #endregion

        #region Links
        public IEnumerable<PricingSummaryDetail> details;
        #endregion

        #region Instances
        public PricingSummary() { }

        public static PricingSummary FromDB(dynamic record)
        {
            return new PricingSummary
            {
                pricingSummaryID = record.pricingSummaryID,
                pricingSummaryRevision = record.pricingSummaryRevision,
                serviceDurationHours = record.serviceDurationHours,
                firstSessionDurationHours = record.firstSessionDurationHours,
                subtotalPrice = record.subtotalPrice,
                feePrice = record.feePrice,
                totalPrice = record.totalPrice,
                pFeePrice = record.pFeePrice,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                subtotalRefunded = record.subtotalRefunded,
                feeRefunded = record.feeRefunded,
                totalRefunded = record.totalRefunded,
                dateRefunded = record.dateRefunded
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                pricingEstimateID,
                pricingEstimateRevision,
                serviceDurationHours,
                firstSessionDurationHours,
                subtotalPrice,
                feePrice,                        
                totalPrice,
                pFeePrice,
                createdDate,
                updatedDate,
                subtotalRefunded,
                feeRefunded,
                totalRefunded,
                dateRefunded
            FROM
                PricingSummary
            WHERE
                PricingSummaryID = @0
                AND PricingSummaryRevision = @1
                AND Active = 1
        ";
        public static PricingSummary Get(int id, int revision)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlGetItem, id, revision));
            }
        }
        /// <summary>
        /// Load from database all the links data
        /// </summary>
        public void FillLinks()
        {
            details = PricingSummaryDetail.GetList(pricingSummaryID, pricingSummaryRevision);
        }
        #endregion

        #region Set
        #region SQL
        const string sqlInsertItem = @"
            DECLARE @id int
            DECLARE @revision int

            -- estimate ID by param, 0 for new, any other to create a new pricing revision for that existing one
            SET @id = @0
                    
            -- Getting the ID and Revision
            IF @id = 0 BEGIN
                -- new id
                SELECT @id = MAX(PricingSummaryID) + 1 FROM PricingSummary WITH (UPDLOCK, HOLDLOCK)
                -- first revision
                SET @revision = 1
            END ELSE BEGIN
                -- use updated id and get new revision
                SELECT @revision = MAX(PricingSummaryRevision) + 1 FROM PricingSummary WITH (UPDLOCK, HOLDLOCK)
                WHERE PricingSummaryID = @id
            END

            -- Creating record
            INSERT INTO PricingSummary (
                PricingSummaryID,
                PricingSummaryRevision,
                ServiceDurationHours,
                FirstSessionDurationHours,
                SubtotalPrice,
                FeePrice,
                TotalPrice,
                PFeePrice,
                CreatedDate,
                UpdatedDate,
                ModifiedBy,
                Active
            ) VALUES (
                @id,
                @revision,
                @1, -- duration
                @2, -- first session duration
                @3, -- subtotal price
                @4, -- fee price
                @5, -- total price
                @6, -- pfee price
                getdate(), getdate(), 'sys', 1
            )

            SELECT * FROM PricingSummary WHERE PricingSummaryID = @id AND PricingSummaryRevision = @revision
        ";
        #endregion

        /// <summary>
        /// Save the given pricing summary and returns a copy of the record from database after
        /// that (so it includes andy generated IDs, dates,..)
        /// </summary>
        /// <param name="data"></param>
        public static PricingSummary Set(PricingSummary data, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                return FromDB(db.QuerySingle(sqlInsertItem,
                    data.pricingSummaryID, data.serviceDurationHours, data.firstSessionDurationHours,
                    data.subtotalPrice, data.feePrice,
                    data.totalPrice, data.pFeePrice));
            }
        }

        /// <summary>
        /// Simplified method for use on service professional bookings
        /// Create or update a Pricing Estimate, generating a new revision for each update (new records but sharing
        /// pricingEstimateID --the given one-- and increasing the revision).
        /// If the given pricingEstimateID is zero, a new pricing is created. At any time, the returned
        /// data is the pricingEstimateID (auto created or the same provided on updates).
        /// </summary>
        /// <param name="pricingEstimateID"></param>
        /// <param name="totalDuration"></param>
        /// <param name="totalPrice"></param>
        /// <param name="servicesData"></param>
        /// <returns></returns>
        public static PricingSummary SetForServiceProfessionalBooking(int pricingSummaryID, decimal totalDurationHours, decimal totalPrice, Dictionary<int, dynamic> servicesData, Database db)
        {
            var summary = Set(new PricingSummary
            {
                pricingSummaryID = pricingSummaryID,
                serviceDurationHours = totalDurationHours,
                firstSessionDurationHours = totalDurationHours,
                subtotalPrice = totalPrice,
                totalPrice = totalPrice,
                feePrice = 0,
                pFeePrice = 0
            }, db);

            summary.details = PricingSummaryDetail.SetForServiceProfessionalBooking(summary, servicesData, db);

            return summary;
        }
        #endregion
    }
}
