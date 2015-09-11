using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// TODO serviceAddress, dates Links
    /// </summary>
    public class Booking
    {
        #region Fields
        public int bookingID;
        public int clientUserID;
        public int serviceProfessionalUserID;
        public int jobTitleID;
        public int languageID;
        public int countryID;
        public int bookingStatusID;
        public int bookingTypeID;
        public int cancellationPolicyID;
        public int? parentBookingID;

        public int? serviceAddressID;
        public int? serviceDateID;
        public int? alternativeDate1ID;
        public int? alternativeDate2ID;

        public int pricingSummaryID;
        public int pricingSummaryRevision;
        private string paymentTransactionID;
        public string paymentLastFourCardNumberDigits;
        public decimal? totalPricePaidByClient;
        public decimal? totalServiceFeesPaidByClient;
        public decimal? totalPaidToServiceProfessional;
        public decimal? totalServiceFeesPaidByServiceProfessional;

        public bool instantBooking;
        public bool firstTimeBooking;
        public bool sendReminder;
        public bool sendPromotional;
        public bool recurrent;
        public bool multiSession;
        public bool pricingAdjustmentApplied;
        public bool paymentCollected;
        public bool paymentAuthorized;
        public int? awaitingResponseFromUserID;
        public bool pricingAdjustmentRequested;
        private string supportTicketNumber;
	
        private string messagingLog;
        private DateTime? createdDate;
        public DateTime? updatedDate;
        private string modifiedBy;

	    public string specialRequests;
        public string preNotesToClient;
        public string postNotesToClient;
        /// <summary>
        /// ONLY READABLE by service professional
        /// </summary>
        public string preNotesToSelf;
        /// <summary>
        /// ONLY READABLE by service professional
        /// </summary>
        public string postNotesToSelf;

        /// <summary>
        /// Computed
        /// </summary>
        public bool reviewedByServiceProfessional;
        /// <summary>
        /// Computed
        /// </summary>
        public bool reviewedByClient;
        #endregion

        #region Links
        public PricingSummary pricingSummary;
        public LcRestAddress serviceAddress;
        public EventDates serviceDate;
        public EventDates alternativeDate1;
        public EventDates alternativeDate2;
        #endregion

        #region Instances
        public Booking() { }

        public static Booking FromDB(dynamic booking, bool internalUse, int? forUserID = null)
        {
            if (booking == null) return null;

            var forServiceProfessional = forUserID.HasValue && forUserID.Value == booking.serviceProfessionalUserID;
            var forClient = forUserID.HasValue && forUserID.Value == booking.clientUserID;

            return new Booking
            {
                bookingID = booking.bookingID,
                clientUserID = booking.clientUserID,
                serviceProfessionalUserID = booking.serviceProfessionalUserID,
                jobTitleID = booking.jobTitleID,
                languageID = booking.languageID,
                countryID = booking.countryID,
                bookingStatusID = booking.bookingStatusID,
                bookingTypeID = booking.bookingTypeID,
                cancellationPolicyID = booking.cancellationPolicyID,
                parentBookingID = booking.parentBookingID,
                
                serviceAddressID = booking.serviceAddressID,
                serviceDateID = booking.serviceDateID,
                alternativeDate1ID = booking.alternativeDate1ID,
                alternativeDate2ID = booking.alternativeDate2ID,

                pricingSummaryID = booking.pricingSummaryID,
                pricingSummaryRevision = booking.pricingSummaryRevision,
                paymentTransactionID = internalUse ? booking.paymentTransactionID : null,
                paymentLastFourCardNumberDigits = forClient ? LcEncryptor.Decrypt(booking.paymentLastFourCardNumberDigits) : null,
                totalPricePaidByClient = booking.totalPricePaidByClient,
                totalServiceFeesPaidByClient = booking.totalServiceFeesPaidByClient,
                totalPaidToServiceProfessional = booking.totalPaidToServiceProfessional,
                totalServiceFeesPaidByServiceProfessional = booking.totalServiceFeesPaidByServiceProfessional,
                
                instantBooking = booking.instantBooking,
                firstTimeBooking = booking.firstTimeBooking,
                sendReminder = booking.sendReminder,
                sendPromotional = booking.sendPromotional,
                recurrent = booking.recurrent,
                multiSession = booking.multiSession,
                pricingAdjustmentApplied = booking.pricingAdjustmentApplied,
                paymentCollected = booking.paymentCollected,
                paymentAuthorized = booking.paymentAuthorized,
                awaitingResponseFromUserID = booking.awaitingResponseFromUserID,
                pricingAdjustmentRequested = booking.pricingAdjustmentRequested,
                supportTicketNumber = internalUse ? booking.supportTicketNumber : null,

                messagingLog = internalUse ? booking.messagingLog : null,
                createdDate = internalUse ? booking.CreatedDate : null,
                updatedDate = booking.UpdatedDate,
                modifiedBy = internalUse ? booking.modifiedBy : null,

                specialRequests = booking.specialRequests,
                preNotesToClient = booking.PreNotesToClient,
                postNotesToClient = booking.PostNotesToClient,

                preNotesToSelf = (forServiceProfessional ? booking.preNotesToSelf : ""),
                postNotesToSelf = (forServiceProfessional ? booking.postNotesToSelf : ""),

                reviewedByServiceProfessional = booking.reviewedByServiceProfessional,
                reviewedByClient = booking.reviewedByClient
            };
        }
        #endregion

        #region Fetch data
        #region SQL
        private const string sqlSelect = @"
            SELECT
                bookingID,
                clientUserID,
                serviceProfessionalUserID,
                jobTitleID,
                languageID,
                countryID,
                bookingStatusID,
                bookingTypeID,
                cancellationPolicyID,
                parentBookingID,

                serviceAddressID,
                serviceDateID,
                alternativeDate1ID,
                alternativeDate2ID,

                pricingSummaryID,
                pricingSummaryRevision,
                paymentTransactionID,
                paymentLastFourCardNumberDigits,
                totalPricePaidByClient,
                totalServiceFeesPaidByClient,
                totalPaidToServiceProfessional,
                totalServiceFeesPaidByServiceProfessional,

                instantBooking,
                firstTimeBooking,
                sendReminder,
                sendPromotional,
                recurrent,
                multiSession,
                pricingAdjustmentApplied,
                paymentCollected,
                paymentAuthorized,
                awaitingResponseFromUserID,
                pricingAdjustmentRequested,
                supportTicketNumber,

                messagingLog,
                B.createdDate,
                B.updatedDate,
                B.modifiedBy,

                specialRequests,
                preNotesToClient,
                postNotesToClient,

                preNotesToSelf,
                postNotesToSelf,

                CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URP
                    WHERE URP.BookingID = B.BookingID
                        AND
                        URP.ProviderUserID = B.ServiceProfessionalUserID
                        AND 
                        URP.PositionID = 0
                ) = 0 THEN 0 ELSE 1 END As bit) As reviewedByServiceProfessional,

                CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URC
                    WHERE URC.BookingID = B.BookingID
                        AND
                        URC.CustomerUserID = B.ClientUserID
                        AND 
                        URC.PositionID = B.JobTitleID
                ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByClient

            FROM    Booking As B
        ";
        const string sqlJoinDate = @"
             INNER JOIN
            CalendarEvents As E
                ON E.Id = B.ServiceDateID
        ";
        const string sqlGetItem = sqlSelect + "WHERE B.bookingID = @0";
        const string sqlGetList = sqlSelect + sqlJoinDate + @"
            WHERE 
                (B.clientUserID = @0 OR B.serviceProfessionalUserID = @0)
                    AND
                E.EndTime > @1
                    AND
                E.StartTime < @2
        ";
        const string sqlGetItemForUser = sqlSelect + @"
            AND (B.clientUserID = @1 OR B.serviceProfessionalUserID = @1)
        ";
        #endregion

        public static Booking Get(int BookingID, bool internalUse = false, int? UserID = null)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var sql = UserID.HasValue ? sqlGetItemForUser : sqlGetItem;
                return FromDB(db.QuerySingle(sql, BookingID, UserID), internalUse, UserID);
            }
        }
        public static IEnumerable<Booking> GetList(int UserID, DateTime StartTime, DateTime EndTime)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlGetList, UserID, StartTime, EndTime).Select<dynamic, Booking>(booking =>
                 {
                     return FromDB(booking, false, UserID);
                 });
            }
        }

        /// <summary>
        /// Load from database all the links data
        /// </summary>
        public void FillLinks()
        {
            pricingSummary = PricingSummary.Get(pricingSummaryID, pricingSummaryRevision);
            pricingSummary.FillLinks();
        }
        #endregion
    }
}