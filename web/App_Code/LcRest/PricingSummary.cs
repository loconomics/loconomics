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
        public decimal? serviceDurationMinutes;
        public decimal? firstSessionDurationMinutes;
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
                serviceDurationMinutes = record.serviceDurationMinutes,
                firstSessionDurationMinutes = record.firstSessionDurationMinutes,
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
                pricingSummaryID,
                pricingSummaryRevision,
                serviceDurationMinutes,
                firstSessionDurationMinutes,
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
                ServiceDurationMinutes,
                FirstSessionDurationMinutes,
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
                PricingSummary newData = FromDB(db.QuerySingle(sqlInsertItem,
                    data.pricingSummaryID, data.serviceDurationMinutes, data.firstSessionDurationMinutes,
                    data.subtotalPrice, data.feePrice,
                    data.totalPrice, data.pFeePrice));

                if (data.details != null)
                {
                    // Set original with details,
                    // since the saving needs to set-up the generated IDs
                    newData.details = data.details;
                    // After save it, gets the just generated records, with any timestamp.
                    newData.details = SetDetails(newData, sharedDb);
                }

                return newData;
            }
        }

        public static IEnumerable<PricingSummaryDetail> SetDetails(PricingSummary summary, Database sharedDb = null)
        {
            var newDetails = new List<PricingSummaryDetail>();
            foreach (var detail in summary.details)
            {
                // Enforce IDs to be up-to-date
                detail.pricingSummaryID = summary.pricingSummaryID;
                detail.pricingSummaryRevision = summary.pricingSummaryRevision;
                // Save each detail
                newDetails.Add(PricingSummaryDetail.Set(detail, sharedDb));
            }
            return newDetails;
        }
        #endregion

        #region Instance calculations
        /// <summary>
        /// Generates the pricing details list (List of PricingSummaryDetail)
        /// for a given list service professional services, fetching from database
        /// the data for each service and computing it as a PricingSummaryDetail.
        /// It replaces any previous details list.
        /// Its recommended a manual call of Calculate* methods to update the summary after this
        /// 
        /// TODO Add possibility to include serviceProfessional defined price per service (it allows for 
        /// serviceProfessional bookings to set a different price than the default one for the service)
        /// 
        /// TODO Add calculation delegation for ProviderPackageMods and support 
        /// for fields clientDataInput/serviceProfessionalDataInput (special pricings like housekeeper)
        /// </summary>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="services"></param>
        /// <returns>Returns the jobTitleID shared by the given services. 0 if no services.
        /// An exceptions happens if services from different jobTitles are provided</returns>
        public int SetDetailServices(int serviceProfessionalUserID, IEnumerable<int> services)
        {
            var details = new List<PricingSummaryDetail>();
            var jobTitleID = 0;

            foreach (var service in ServiceProfessionalService.GetListByIds(serviceProfessionalUserID, services))
            {
                if (jobTitleID == 0)
                    jobTitleID = service.jobTitleID;

                details.Add(PricingSummaryDetail.FromServiceProfessionalService(service));
            }

            this.details = details;

            return jobTitleID;
        }

        /// <summary>
        /// It calculates summary price and duration from the current
        /// list of details.
        /// Directly touches: subtotalPrice, firstSessionDurationMinutes and serviceDurationMinutes
        /// </summary>
        public void CalculateDetails()
        {
            this.subtotalPrice = 0;
            this.firstSessionDurationMinutes = 0;
            this.serviceDurationMinutes = 0;

            if (details != null)
            {
                foreach (var detail in details)
                {
                    this.subtotalPrice += detail.price;
                    this.serviceDurationMinutes += detail.serviceDurationMinutes;
                    this.firstSessionDurationMinutes = detail.firstSessionDurationMinutes;
                }
            }
        }

        /// <summary>
        /// Just sum subtotal and fee to update the totalPrice field,
        /// if not null.
        /// </summary>
        public void CalculateTotalPrice()
        {
            if (!this.subtotalPrice.HasValue ||
                !this.feePrice.HasValue)
            {
                this.totalPrice = null;
            }
            else
            {
                this.totalPrice = this.subtotalPrice.Value + this.feePrice.Value;
            }
        }

        /// <summary>
        /// Calculate service fees (feePrice), based on subtotalPrice, and feels the feePrice property.
        /// </summary>
        /// <param name="type"></param>
        /// <param name="firstTimeBooking"></param>
        public void CalculateServiceFees(BookingType type, bool firstTimeBooking)
        {
            // Only are applied on firstTimeBookings, otherwise is zero
            if (firstTimeBooking)
            {
                // Can only be calculated if there is a subtotal price previously calculated
                // otherwise feePrice will remain without value to mark it as not possible to calculate.
                if (subtotalPrice.HasValue)
                {
                    var amount = Math.Round(type.firstTimeServiceFeeFixed + (type.firstTimeServiceFeePercentage/100 * subtotalPrice.Value), 2);
                    feePrice = Math.Min(Math.Max(amount, type.firstTimeServiceFeeMinimum), type.firstTimeServiceFeeMaximum);
                }
                else
                {
                    feePrice = null;
                }
            }
            else
            {
                // No fees on other cases, just 0 :-)
                feePrice = 0;
            }
        }

        public void CalculatePaymentProcessingFees(BookingType type)
        {
            // Can only calculate with a notnull totalPrice, otherwise pFeePrice is null to state the impossibility of the calculation
            if (subtotalPrice.HasValue)
            {
                // NOTE: We are rounding to 2 decimals because is the usual, but because who decides and performs this calculation
                // is the payment processing service (Braintree at this moment), its in their hands. Maybe they round with ceiling
                // or present more precision to the service professional (who will show how much received on their bank account).
                pFeePrice = Math.Round(type.paymentProcessingFeeFixed + (type.paymentProcessingFeePercentage/100 * subtotalPrice.Value), 2);
            }
            else
            {
                pFeePrice = null;
            }
        }

        /// <summary>
        /// Calculates service fee, totalPrice and payment processing fees.
        /// </summary>
        /// <param name="type"></param>
        /// <param name="firstTimeBooking"></param>
        public void CalculateFees(BookingType type, bool firstTimeBooking)
        {
            // Calculate service fees (feePrice), based on subtotalPrice
            CalculateServiceFees(type, firstTimeBooking);

            // Total Price must be calculated before calculate the deducted payment processing fees (pFeePrice)
            // because is calculated on top of that (since is deducted by the payment processing platform over the total)
            CalculateTotalPrice();

            CalculatePaymentProcessingFees(type);
        }
        #endregion
    }
}
