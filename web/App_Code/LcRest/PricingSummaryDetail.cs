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
        public decimal? subtotalPrice;
        public decimal? feePrice;
        public decimal? totalPrice;
        public decimal? serviceDurationHours;
        public decimal? firstSessionDurationHours;
        //public int pricingGroupID;
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
                subtotalPrice = record.subtotalPrice,
                feePrice = record.feePrice,
                totalPrice = record.totalPrice,
                serviceDurationHours = record.serviceDurationHours,
                firstSessionDurationHours = record.firstSessionDurationHours,
                //pricingGroupID = record.pricingGroupID,
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
                subtotalPrice,
                feePrice,
                totalPrice,
                serviceDurationHours,
                firstSessionDurationHours,
                pricingGroupID,
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
                SubtotalPrice,
                FeePrice,
                TotalPrice,
                ServiceDuration,
                FirstSessionDuration,
                CreatedDate,
                UpdatedDate,
                ModifiedBy,
                PricingGroupID -- unused but not null
            ) VALUES (
                @0, -- ID
                @1, -- revision
                @2, -- serviceID
                @3, -- subtotal
                @4, -- fees
                @5, -- price
                @6, -- duration
                @7, -- first duration
                getdate(), getdate(), 'sys',
                0 -- unused pricing group id
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
                    data.subtotalPrice, data.feePrice, data.totalPrice,
                    data.serviceDurationHours, data.firstSessionDurationHours
                    ));
            }
        }

        /// <summary>
        /// This method is paired with the one at PricingSummary with the same name,
        /// expected to be used with it only, but anyway instructions to be used:
        /// Simplified method for use on service professional bookings.
        /// Create Pricing Summary Detail records for the given simplified data,
        /// returning them as a list suitable to add to the given pricingSummary object.
        /// The summary must be pre-populated with IDs and exist on database previous to this.
        /// </summary>
        /// <param name="summary">Presaved summary</param>
        /// <param name="servicesData">Dictionary indexed by the serviceID that contains objects like: { decimal Price, decimal DurationHours }</param>
        /// <returns></returns>
        public static List<PricingSummaryDetail> SetForServiceProfessionalBooking(PricingSummary summary, Dictionary<int, dynamic> servicesData, Database db)
        {
            var details = new List<PricingSummaryDetail>();

            foreach (var serviceID in servicesData.Keys)
            {
                var serviceData = servicesData[serviceID];
                var price = serviceData.Price ?? 0;
                var duration = serviceData.DurationHours ?? 0;

                var detail = Set(new PricingSummaryDetail
                {
                    pricingSummaryID = summary.pricingSummaryID,
                    pricingSummaryRevision = summary.pricingSummaryRevision,
                    serviceDurationHours = duration,
                    firstSessionDurationHours = duration,
                    subtotalPrice = price,
                    totalPrice = price,
                    feePrice = 0,
                    serviceProfessionalServiceID = serviceID
                }, db);

                details.Add(detail);
            }

            return details;
        }
        #endregion
    }
}