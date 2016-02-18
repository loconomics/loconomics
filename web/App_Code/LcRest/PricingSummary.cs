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
        /// <summary>
        /// The sum of all pricingSummary.details.
        /// In other words, cost of all services included.
        /// See CalculateDetails for implementation details.
        /// </summary>
        public decimal? subtotalPrice;
        /// <summary>
        /// The "first time booking" fees, if any, zero on other cases.
        /// If a cancellation happens and this fee is not refundable, will keep
        /// it's original value, but if it happens that is refundable then will be updated
        /// to zero or whatever value gets calculated.
        /// </summary>
        public decimal? clientServiceFeePrice;
        /// <summary>
        /// It's the final price charged to a client.
        /// Initially, is the subtotalPrice plus clientServiceFeePrice, but a
        /// booking cancellation will update it to whatever the client must pay,
        /// depending on cancellation fees or not-refundable clientServiceFeePrice.
        /// See booking cancellation calculations for implementation details.
        /// </summary>
        public decimal? totalPrice;
        /// <summary>
        /// It's the 'transaction service fee', part of it it's received by Loconomics
        /// and the remaining is used to pay to Braintree the payment processing fees of the
        /// whole transaction.
        /// Substracting this from the TotalPrice is what 
        /// the service professionals receives.
        /// It was know as "payment processing fee" but is more than that since
        /// it includes the clientServiceFeePrice too, and only the part of
        /// the processing fees supported by the service professional since
        /// Loconomics will be charged part of processing too.
        /// It fills the Braintree.Transaction.ServiceFeeAmount field when asking for payment.
        /// See calculateServiceFee for implementation details.
        /// </summary>
        public decimal? serviceFeeAmount;
        public DateTime createdDate;
        public DateTime updatedDate;
        public decimal? cancellationFeeCharged;
        public DateTime? cancellationDate;
        public decimal firstTimeServiceFeeFixed;
        public decimal firstTimeServiceFeePercentage;
        public decimal paymentProcessingFeePercentage;
        public decimal paymentProcessingFeeFixed;
        public decimal firstTimeServiceFeeMaximum;
        public decimal firstTimeServiceFeeMinimum;
        #endregion

        #region Links
        public IEnumerable<PricingSummaryDetail> details;
        #endregion

        #region Instances
        public PricingSummary() { }

        /// <summary>
        /// Creates a pricing summary instance prefilling the reference fees
        /// fields with values from the bookingType and depending if is for HIPAA or not.
        /// </summary>
        /// <param name="bookingTypeID"></param>
        /// <param name="isHipaa"></param>
        public PricingSummary(int bookingTypeID, bool isHipaa)
        {

        }

        public static PricingSummary FromDB(dynamic record)
        {
            return new PricingSummary
            {
                pricingSummaryID = record.pricingSummaryID,
                pricingSummaryRevision = record.pricingSummaryRevision,
                serviceDurationMinutes = record.serviceDurationMinutes,
                firstSessionDurationMinutes = record.firstSessionDurationMinutes,
                subtotalPrice = record.subtotalPrice,
                clientServiceFeePrice = record.clientServiceFeePrice,
                totalPrice = record.totalPrice,
                serviceFeeAmount = record.serviceFeeAmount,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                cancellationFeeCharged = record.cancellationFeeCharged,
                cancellationDate = record.cancellationDate,
                firstTimeServiceFeeFixed = record.firstTimeServiceFeeFixed,
                firstTimeServiceFeePercentage = record.firstTimeServiceFeePercentage,
                paymentProcessingFeeFixed = record.paymentProcessingFeeFixed,
                paymentProcessingFeePercentage = record.paymentProcessingFeePercentage,
                firstTimeServiceFeeMaximum = record.firstTimeServiceFeeMaximum,
                firstTimeServiceFeeMinimum = record.firstTimeServiceFeeMinimum
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
                clientServiceFeePrice,                        
                totalPrice,
                serviceFeeAmount,
                createdDate,
                updatedDate,
                cancellationFeeCharged,
                cancellationDate,
                firstTimeServiceFeeFixed,
                firstTimeServiceFeePercentage,
                paymentProcessingFeeFixed,
                paymentProcessingFeePercentage,
                firstTimeServiceFeeMaximum,
                firstTimeServiceFeeMinimum
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
                clientServiceFeePrice,
                TotalPrice,
                serviceFeeAmount,
                cancellationDate,
                cancellationFeeCharged,
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
                @7, -- canc date
                @8, -- canc fee
                getdate(), getdate(), 'sys', 1
            )

            SELECT * FROM PricingSummary WHERE PricingSummaryID = @id AND PricingSummaryRevision = @revision
        ";
        #endregion

        /// <summary>
        /// Save the given pricing summary and returns a copy of the record from database after
        /// that (so it includes any generated IDs, dates,..)
        /// </summary>
        /// <param name="data"></param>
        public static PricingSummary Set(PricingSummary data, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                PricingSummary newData = FromDB(db.QuerySingle(sqlInsertItem,
                    data.pricingSummaryID,
                    data.serviceDurationMinutes, data.firstSessionDurationMinutes,
                    data.subtotalPrice, data.clientServiceFeePrice,
                    data.totalPrice, data.serviceFeeAmount,
                    data.cancellationDate, data.cancellationFeeCharged
                ));

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
                    this.firstSessionDurationMinutes += detail.firstSessionDurationMinutes;
                }
            }

            // TODO PricingMod calculations???
            // OLD code from LcPricingModel.CalculatePackages:
            /*
            // Calculate time and price required for selected package
            if (config.Mod != null)
            {
                // Applying calculation from the PackageMod
                config.Mod.CalculateCustomerData(customerID, thePackage, fee, modelData, ModelState);
            }*/
        }

        /// <summary>
        /// Just sum subtotal and fee to update the totalPrice field,
        /// if not null.
        /// </summary>
        public void CalculateTotalPrice()
        {
            if (!this.subtotalPrice.HasValue ||
                !this.clientServiceFeePrice.HasValue)
            {
                this.totalPrice = null;
            }
            else
            {
                this.totalPrice = this.subtotalPrice.Value + this.clientServiceFeePrice.Value;
            }
        }

        /// <summary>
        /// Calculate client fees (clientServiceFeePrice), based on subtotalPrice, and save at the clientServiceFeePrice property.
        /// </summary>
        /// <param name="type"></param>
        /// <param name="firstTimeBooking"></param>
        public void CalculateClientServiceFee()
        {
            // Can only be calculated if there is a subtotal price previously calculated
            // otherwise clientServiceFeePrice will remain without value to mark it as not possible to calculate.
            if (subtotalPrice.HasValue)
            {
                var amount = Math.Round(firstTimeServiceFeeFixed + ((firstTimeServiceFeePercentage / 100) * subtotalPrice.Value), 2);
                clientServiceFeePrice = Math.Min(Math.Max(amount, firstTimeServiceFeeMinimum), firstTimeServiceFeeMaximum);
            }
            else
            {
                clientServiceFeePrice = null;
            }
        }

        /// <summary>
        /// AKA "calculate PaymentProcessing fee".
        /// </summary>
        /// <param name="type"></param>
        public void CalculateServiceFee()
        {
            // Can only calculate with a notnull totalPrice and feePrice, otherwise serviceFeeAmount is null to state the impossibility of the calculation
            if (totalPrice.HasValue && clientServiceFeePrice.HasValue)
            {
                // NOTE: We are rounding to 2 decimals because is the usual, but because who decides and performs this calculation
                // is the payment processing service (Braintree at this moment), its in their hands. Maybe they round with ceiling
                // or present more precision to the service professional (who will show how much received on their bank account).
                serviceFeeAmount = Math.Round(paymentProcessingFeeFixed + ((paymentProcessingFeePercentage/100) * (totalPrice.Value - clientServiceFeePrice.Value)) + clientServiceFeePrice.Value, 2);
            }
            else
            {
                serviceFeeAmount = null;
            }
        }

        /// <summary>
        /// Calculates service fee, totalPrice and payment processing fees.
        /// </summary>
        /// <param name="type"></param>
        /// <param name="firstTimeBooking"></param>
        public void CalculateFees()
        {
            // Calculate client fees (clientServiceFeePrice), based on subtotalPrice
            CalculateClientServiceFee();

            // Total Price must be calculated before calculate the deducted payment processing fees (serviceFeeAmount)
            // because is calculated on top of that (since is deducted by the payment processing platform over the total)
            CalculateTotalPrice();

            CalculateServiceFee();
        }
        #endregion

        #region Query
        /// <summary>
        /// Returns a one-line text-only representation of all the services
        /// included in the pricing summary
        /// </summary>
        /// <param name="pricingSummary"></param>
        /// <returns></returns>
        internal static string GetOneLineDescription(PricingSummary pricingSummary)
        {
            var servicePricings = LcEmailTemplate.ServicePricing.GetForPricingSummary(pricingSummary);
            var details = servicePricings.Select(v => LcRest.PricingSummaryDetail.GetOneLineDescription(v.service, v.pricing));
            return ASP.LcHelpers.JoinNotEmptyStrings("; ", details);
        }
        #endregion
    }
}
