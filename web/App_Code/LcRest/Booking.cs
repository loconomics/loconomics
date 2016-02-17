using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using Braintree;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// Represents a booking, as exposed publicly on REST API, and methods to manage it
    /// </summary>
    public class Booking
    {
        #region Static Information
        /// <summary>
        /// After that time from the last update on a
        /// booking request without provider confirmation,
        /// the request will expire.
        /// </summary>
        public const int ConfirmationLimitInHours = 18;
        #endregion

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
        internal string paymentTransactionID;
        public string paymentLastFourCardNumberDigits;
        internal string paymentMethodID;
        internal string cancellationPaymentTransactionID;
        public decimal? clientPayment;
        public decimal? serviceProfessionalPaid;
        public decimal? serviceProfessionalPPFeePaid;
        internal decimal? loconomicsPaid;
        internal decimal? loconomicsPPFeePaid;

        public bool instantBooking;
        public bool firstTimeBooking;
        public bool sendReminder;
        public bool sendPromotional;
        public bool recurrent;
        public bool multiSession;
        public bool pricingAdjustmentApplied;
        public bool paymentEnabled;
        public bool paymentCollected;
        public bool paymentAuthorized;
        public int? awaitingResponseFromUserID;
        public bool pricingAdjustmentRequested;
        internal string supportTicketNumber;
	
        internal string messagingLog;
        internal DateTime? createdDate;
        public DateTime? updatedDate;
        internal string modifiedBy;

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

        #region Computed properties
        /// <summary>
        /// For booking requests, lests know what date is
        /// the limit the service professional has to confirm
        /// the request, or will expire.
        /// </summary>
        public DateTime? requestConfirmationLimitDate
        {
            get
            {
                if (bookingStatusID == (int)LcEnum.BookingStatus.request &&
                    updatedDate.HasValue)
                {
                    return updatedDate.Value.AddHours(ConfirmationLimitInHours);
                }
                return null;
            }
        }
        #endregion

        #region Links
        public PricingSummary pricingSummary;
        public Address serviceAddress;
        public EventDates serviceDate;
        public EventDates alternativeDate1;
        public EventDates alternativeDate2;
        internal PublicUserJobTitle userJobTitle;
        #endregion

        #region Instances
        private Booking() { }

        public static Booking FromDB(dynamic booking, bool internalUse, int? forUserID = null)
        {
            if (booking == null) return null;

            var forServiceProfessional = forUserID.HasValue && forUserID.Value == booking.serviceProfessionalUserID;
            var forClient = forUserID.HasValue && forUserID.Value == booking.clientUserID;

            var reviewedByServiceProfessional = false;
            var reviewedByClient = false;
            try
            {
                reviewedByServiceProfessional = booking.reviewedByServiceProfessional;
                reviewedByClient = booking.reviewedByClient;
            }
            catch { }

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
                paymentLastFourCardNumberDigits = forClient || internalUse ? LcEncryptor.Decrypt(booking.paymentLastFourCardNumberDigits) : null,
                paymentMethodID = internalUse ? booking.paymentMethodID : null,
                cancellationPaymentTransactionID = internalUse ? booking.cancellationPaymentTransactionID : null,
                clientPayment = booking.clientPayment,
                serviceProfessionalPaid = booking.serviceProfessionalPaid,
                serviceProfessionalPPFeePaid = booking.serviceProfessionalPPFeePaid,
                loconomicsPaid = booking.loconomicsPaid,
                loconomicsPPFeePaid = booking.loconomicsPPFeePaid,
                
                instantBooking = booking.instantBooking,
                firstTimeBooking = booking.firstTimeBooking,
                sendReminder = booking.sendReminder,
                sendPromotional = booking.sendPromotional,
                recurrent = booking.recurrent,
                multiSession = booking.multiSession,
                pricingAdjustmentApplied = booking.pricingAdjustmentApplied,
                paymentEnabled = booking.paymentEnabled,
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

                preNotesToSelf = (forServiceProfessional || internalUse ? booking.preNotesToSelf : ""),
                postNotesToSelf = (forServiceProfessional || internalUse ? booking.postNotesToSelf : ""),

                reviewedByServiceProfessional = reviewedByServiceProfessional,
                reviewedByClient = reviewedByClient
            };
        }

        /// <summary>
        /// Creates a new Booking instance prefilling data from database queries for the given info.
        /// Prefilled fields, that must not be manually updated because are strict rules and
        /// most are never allowed to be updated, or only after check some constraints
        /// - clientUserID
        /// - serviceProfessionalUserID
        /// - jobTitleID
        /// - languageID
        /// - countryID
        /// - bookingStatusID (defaults to 'incomplete' status, must be later overwritted when saving it)
        /// - bookingTypeID
        /// - cancellationTypeID
        /// - instantBooking
        /// - firstTimeBooking
        /// </summary>
        /// <param name="clientID"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="bookCode"></param>
        /// <returns></returns>
        public static Booking NewFor(int clientID, int serviceProfessionalID, int jobTitleID, int langID, int countryID, string bookCode, bool isServiceProfessionalBooking = false)
        {
            var booking = new Booking();
            booking.clientUserID = clientID;
            booking.serviceProfessionalUserID = serviceProfessionalID;
            booking.jobTitleID = jobTitleID;
            booking.languageID = langID;
            booking.countryID = countryID;

            // Set bookingType (IMPORTANT: before fill the user job title)
            if (isServiceProfessionalBooking)
            {
                booking.bookingTypeID = (int)LcEnum.BookingType.serviceProfessionalBooking;
            }
            else
            {
                // Only supports auto-detect client BookNow and Marketplace bookings.
                booking.bookingTypeID = (int)(IsValidBookCode(serviceProfessionalID, bookCode) ? LcEnum.BookingType.bookNowBooking : LcEnum.BookingType.marketplaceBooking);
            }

            // Check service-job exists and enabled, and get its public preferences
            booking.FillUserJobTitle();
            if (booking.userJobTitle == null)
            {
                // Cannot create booking, returns null as meaning 'not found'
                return null;
            }

            // Payment is required for client bookings, but avoided on bookNow bookings. That's excludes service professional bookings too
            // TODO Per #590, a new check by job-title and bookNow preference may be required, allowing
            // optionally enabling payment through bookNow.
            booking.paymentEnabled = false;
            if (!isServiceProfessionalBooking && booking.bookingTypeID != (int)LcEnum.BookingType.bookNowBooking)
            {
                booking.paymentEnabled = IsMarketplacePaymentAccountActive(serviceProfessionalID);
                if (!booking.paymentEnabled)
                {
                    // Cannot create booking, payment required and is not ready, return null as meaning 'not found'
                    return null;
                }
            }

            // Checks:
            booking.bookingStatusID = (int)LcEnum.BookingStatus.incomplete;
            booking.cancellationPolicyID = booking.userJobTitle.cancellationPolicyID;
            booking.instantBooking = booking.userJobTitle.instantBooking;
            booking.firstTimeBooking = IsFirstTimeBooking(serviceProfessionalID, clientID);
        
            // Fees:
            var summary = new PricingSummary();
            booking.pricingSummary = summary;
            var flags = LcMessaging.SendBooking.JobTitleMessagingFlags.Get(jobTitleID, langID, countryID);

            var type = BookingType.Get(booking.bookingTypeID);

            // Payment fees only if payment enabled
            if (booking.paymentEnabled)
            {
                summary.paymentProcessingFeeFixed = type.paymentProcessingFeeFixed;
                summary.paymentProcessingFeePercentage = type.paymentProcessingFeePercentage;
            }
            else
            {
                summary.paymentProcessingFeeFixed = 0;
                summary.paymentProcessingFeePercentage = 0;
            }

            // Client Service Fees
            // Only are applied on NOT-HIPAA NOT-book-now firstTimeBookings, otherwise is zero
            if (flags.hipaa || !booking.firstTimeBooking || booking.bookingTypeID == (int)LcEnum.BookingType.bookNowBooking)
            {
                summary.firstTimeServiceFeeFixed = 0;
                summary.firstTimeServiceFeePercentage = 0;
                summary.firstTimeServiceFeeMinimum = 0;
                summary.firstTimeServiceFeeMaximum = 0;
            }
            else
            {
                summary.firstTimeServiceFeeFixed = type.firstTimeServiceFeeFixed;
                summary.firstTimeServiceFeePercentage = type.firstTimeServiceFeePercentage;
                summary.firstTimeServiceFeeMinimum = type.firstTimeServiceFeeMinimum;
                summary.firstTimeServiceFeeMaximum = type.firstTimeServiceFeeMaximum;
            }

            return booking;
        }
        #endregion

        #region Constraints queries
        /// <summary>
        /// Checks if the service professional has its marketplace payment account active,
        /// meaning that there is an active merchantAccount at Braintree for the user.
        /// This method says nothing about the payment being optionally enabled for
        /// bookNow buttons in a per jobTitle basis (to be done at #590 on a new method),
        /// but that depends on this to be true.
        /// </summary>
        /// <param name="serviceProfessionalID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="bookCode"></param>
        /// <returns></returns>
        private static bool IsMarketplacePaymentAccountActive(int serviceProfessionalID)
        {
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(@"
                    SELECT dbo.isMarketplacePaymentAccountActive(@0)
                ", serviceProfessionalID);
            }
        }
        private static bool IsValidBookCode(int serviceProfessionalID, string bookCode)
        {
            using (var db = new LcDatabase())
            {
                // If there is a book-code
                if (bookCode != null)
                {
                    // Check that match the provider book-code
                    return (
                        null != db.QueryValue(@"
                            SELECT 'found' as A FROM Users 
                            WHERE UserID = @0 AND BookCode like @1
                        ", serviceProfessionalID, bookCode)
                    );
                }
                else
                {
                    return false;
                }
            }
        }
        private static bool IsFirstTimeBooking(int serviceProfessionalID, int clientID)
        {
            using (var db = new LcDatabase())
            {
                // Find if there is almost one booking already between both users
                // Limiting the valid bookings to the ones in next statuses
                var statuses = String.Join(",",
                    ((short)LcEnum.BookingStatus.confirmed).ToString(),
                    ((short)LcEnum.BookingStatus.servicePerformed).ToString(),
                    ((short)LcEnum.BookingStatus.completed).ToString()
                );
                var sql = @"
                    SELECT TOP 1 CASE
                        WHEN EXISTS (SELECT * FROM Booking As B 
                            WHERE B.BookingStatusID IN (" + statuses + @") AND B.ClientUserID = @0 AND B.ServiceProfessionalUserID = @1)
                        THEN Cast(0 as bit)
                        ELSE Cast(1 as bit) END
                ";
                return (bool)db.QueryValue(sql, clientID, serviceProfessionalID);
            }
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
                paymentMethodID,
                cancellationPaymentTransactionID,
                clientPayment,
                serviceProfessionalPaid,
                serviceProfessionalPPFeePaid,
                loconomicsPaid,
                loconomicsPPFeePaid,

                instantBooking,
                firstTimeBooking,
                sendReminder,
                sendPromotional,
                recurrent,
                multiSession,
                pricingAdjustmentApplied,
                paymentEnabled,
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
                    AND
                -- An status valid to be included in the listing
                -- request, confirmed, performed, completed, dispute
                B.BookingStatusID IN (2, 6, 7, 8, 9)
        ";
        const string sqlGetItemForUser = sqlGetItem + @"
            AND (B.clientUserID = @1 OR B.serviceProfessionalUserID = @1)
        ";
        #endregion

        public static Booking Get(int BookingID, bool fillLinks, bool internalUse = false, int? UserID = null)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var sql = UserID.HasValue ? sqlGetItemForUser : sqlGetItem;
                var b = FromDB(db.QuerySingle(sql, BookingID, UserID), internalUse, UserID);
                if (b != null && fillLinks)
                    b.FillLinks();
                return b;
            }
        }
        public static IEnumerable<Booking> GetList(int UserID, DateTime StartTime, DateTime EndTime, bool fillLinks)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlGetList, UserID, StartTime, EndTime).Select<dynamic, Booking>(booking =>
                 {
                     var b = FromDB(booking, false, UserID);
                     if (b != null && fillLinks)
                         b.FillLinks();
                     return b;
                 });
            }
        }

        #region Queries
        /// <summary>
        /// Returns a list of bookings that are in status 'incomplete' and ready to become timedout
        /// </summary>
        /// <param name="dbShared"></param>
        /// <returns></returns>
        public static IEnumerable<Booking> QueryIncomplete2TimedoutBookings(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared)) {
                return db.Query(@"
                    SELECT  *
                    FROM    Booking
                    WHERE   BookingStatusID = @0
                             AND
                            -- Not expired previously: it has dates info still
                            (ServiceDateID is not null OR AlternativeDate1ID is not null OR AlternativeDate2ID is not null)
                             AND
                            -- is old enough to be considered not active: 1 day
                            UpdatedDate < dateadd(d, -1, getdate())
                ", (int)LcEnum.BookingStatus.incomplete).Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        /// <summary>
        /// Returns a list of bookings with payment enabled and waiting for client to be charged for the service
        /// price.
        /// Used by scheduled task to automatically trigger the payment process to charge client almost 1 hour after
        /// service ended
        /// </summary>
        /// <param name="dbShared"></param>
        /// <returns></returns>
        public static IEnumerable<Booking> QueryPendingOfClientChargeBookings(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                var validStatuses = String.Join(",", new List<int> {
                    (int)LcEnum.BookingStatus.confirmed,
                    (int)LcEnum.BookingStatus.servicePerformed
                });

                return db.Query(@"
                    SELECT  B.*
                    FROM    Booking As B
                             INNER JOIN
                            CalendarEvents As E
                              ON B.ServiceDateID = E.Id
                    WHERE   
                            -- With payment enabled
                            B.PaymentEnabled = 1
                             AND
                            B.PaymentCollected = 1
                             AND
                            B.BookingStatusID IN (" + validStatuses + @")
                             AND
                            -- almost 1 hour after service ended (more than that is fine)
                            getdate() >= dateadd(hh, 1, E.EndTime)
                            /* AND
                             getdate() < dateadd(hh, 2, E.EndTime)
                            */

                             AND
                            -- Still not charged
                            B.ClientPayment is null
                ").Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        /// <summary>
        /// When a booking with payment is confirmed (instant booking or after confirm request), 
        /// the payment is authorized with the exception of services for more than 7 days in advance,
        /// that ones are postponed because of authorization expirations.
        /// This query returns that bookings on a secure time frame to avoid expirations and prevent
        /// take action if any problem: 48 hours before the service start.
        /// </summary>
        /// <param name="dbShared"></param>
        /// <returns></returns>
        public static IEnumerable<Booking> QueryPostponedPaymentAuthorizations(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                var validStatuses = String.Join(",", new List<int> {
                    (int)LcEnum.BookingStatus.confirmed,
                    (int)LcEnum.BookingStatus.servicePerformed
                });

                return db.Query(@"
                SELECT  B.*
                FROM    Booking As B
                         INNER JOIN
                        CalendarEvents As E
                          ON B.ServiceDateID = E.Id
                WHERE   
                        -- With payment enabled
                        B.PaymentEnabled = 1
                         AND
                        B.PaymentCollected = 1
                         AND
                        -- Still not charged or authorized
                        B.ClientPayment is null
                         AND
                        B.PaymentAuthorized = 0
                         AND
                        BookingStatusID IN (" + validStatuses + @")
                         AND
                        -- at 48 hours before service starts (after that is fine)
                        getdate() >= dateadd(hh, -48, E.StartTime)
                        /* AND
                         getdate() < dateadd(hh, -49, E.StartTime)
                        */
                ").Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        #region SQLs QueryPendingOfPaymentRelease
        private const string sqlPendingOfPaymentReleaseForVeteranServiceProfessionals = @"
            SELECT  B.*
            FROM    Booking As B
                        INNER JOIN
                    CalendarEvents As E
                        ON B.ServiceDateID = E.Id
            WHERE   PaymentEnabled = 1
                     AND
                    B.PaymentCollected = 1
                     AND
                    BookingStatusID = @0
                        AND
                    -- at 24 hours, 1 day, after service ended (more than that is fine)
                    getdate() >= dateadd(hh, 24, E.EndTime)
                    /* AND
                        getdate() < dateadd(hh, 25, E.EndTime)
                    */
                        AND
                    (SELECT count(*)
                        FROM Booking As B2
                        WHERE
                        B2.ServiceProfessionalUserID = B.ServiceProfessionalUserID
                         AND
                        B2.BookingStatusID = @1
                    ) > 0 -- There are complete bookings (almost 1)
        ";
        private const string sqlPendingOfPaymentReleaseForNewServiceProfessionals = @"
            SELECT  B.*
            FROM    Booking As B
                        INNER JOIN
                    CalendarEvents As E
                        ON B.ServiceDateID = E.Id
            WHERE   PaymentEnabled = 1
                     AND
                    B.PaymentCollected = 1
                     AND
                    BookingStatusID = @0
                        AND
                    -- at 120 hours, 5 days, after service ended (more than that is fine)
                    getdate() >= dateadd(hh, 120, E.EndTime)
                    /* AND
                        getdate() < dateadd(hh, 121, E.EndTime)
                    */
                        AND
                    (SELECT count(*)
                        FROM Booking As B2
                        WHERE
                        B2.ServiceProfessionalUserID = B.ServiceProfessionalUserID
                         AND
                        B2.BookingStatusID = @1
                    ) = 0 -- There is no complete bookings
        ";
        private const string sqlPendingOfPaymentReleaseForServiceProfessionals = @"
            SELECT  B.*
            FROM    Booking As B
                        INNER JOIN
                    CalendarEvents As E
                        ON B.ServiceDateID = E.Id
            WHERE   PaymentEnabled = 1
                     AND
                    B.PaymentCollected = 1
                     AND
                    BookingStatusID = @0
                        AND
                    -- at 1 hour 15 min, after service ended (more than that is fine)
                    getdate() >= dateadd(hh, 1.25, E.EndTime)
                    /* AND
                        getdate() < dateadd(hh, 2.25, E.EndTime)
                    */
        ";
        #endregion
        public static IEnumerable<Booking> QueryPendingOfPaymentReleaseBookings(bool? forNewServiceProfessionals, Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                var sql = 
                    forNewServiceProfessionals.HasValue ?
                    forNewServiceProfessionals.Value ?
                    sqlPendingOfPaymentReleaseForNewServiceProfessionals :
                    sqlPendingOfPaymentReleaseForVeteranServiceProfessionals :
                    sqlPendingOfPaymentReleaseForServiceProfessionals;

                return db.Query(sql, (int)LcEnum.BookingStatus.servicePerformed, (int)LcEnum.BookingStatus.completed)
                .Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        /// <summary>
        /// Return a list of bookings in Confirmed status that are ready to update to status ServicePerformed.
        /// Conditions: being confirmed (not other statuses allowed) and between the service endTime.
        /// (before #844, was at 48H after service endTime)
        /// </summary>
        /// <param name="dbShared"></param>
        /// <returns></returns>
        public static IEnumerable<Booking> QueryConfirmed2ServicePerformedBookings(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                var validStatuses = String.Join(",", new List<int> {
                    (int)LcEnum.BookingStatus.confirmed,
                    (int)LcEnum.BookingStatus.servicePerformed,
                    (int)LcEnum.BookingStatus.completed
                });

                return db.Query(@"
                    SELECT  B.*
                    FROM    Booking As B
                             INNER JOIN
                            CalendarEvents As E
                              ON B.ServiceDateID = E.Id
                    WHERE   BookingStatusID = @0
                             AND
                            -- at 48 hours after service ended (more than 48 hours is fine)
                            getdate() >= E.EndTime -- dateadd(hh, 0, E.EndTime)
                            /* AND
                             getdate() < dateadd(hh, 1, E.EndTime)
                            */
                ", (int)LcEnum.BookingStatus.confirmed).Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        /// <summary>
        /// List bookings in status Request that must update as requestExpired because of
        /// * If:: Provider didn't reply
        /// * If:: Request not updated/changed
        /// </summary>
        /// <param name="dbShared"></param>
        /// <returns></returns>
        public static IEnumerable<Booking> QueryRequest2ExpiredBookings(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                var validStatuses = String.Join(",", new List<int> {
                    (int)LcEnum.BookingStatus.confirmed,
                    (int)LcEnum.BookingStatus.servicePerformed,
                    (int)LcEnum.BookingStatus.completed
                });

                return db.Query(@"
                    SELECT  *
                    FROM    Booking
                    WHERE   BookingStatusID = @1
                             AND
                            -- passed x hours from request or some change (some provider communication or customer change)
                            UpdatedDate < dateadd(hh, 0 - @0, getdate())
                ", ConfirmationLimitInHours, (int)LcEnum.BookingStatus.request)
                 .Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }

        #region SQL PendingOfCompleteWithoutPaymentBookings
        private const string sqlPendingOfCompleteWithoutPaymentBookings = @"
            SELECT  B.*
            FROM    Booking As B
                        INNER JOIN
                    CalendarEvents As E
                        ON B.ServiceDateID = E.Id
            WHERE   PaymentEnabled = 0
                     AND
                    BookingStatusID = @0
                        AND
                    -- at 1 hour 15 min, after service ended (more than that is fine)
                    getdate() >= dateadd(hh, 1.25, E.EndTime)
                    /* AND
                        getdate() < dateadd(hh, 2.25, E.EndTime)
                    */
        ";
        #endregion
        public static IEnumerable<Booking> QueryPendingOfCompleteWithoutPaymentBookings(Database dbShared = null)
        {
            using (var db = new LcDatabase(dbShared))
            {
                return db.Query(sqlPendingOfCompleteWithoutPaymentBookings, (int)LcEnum.BookingStatus.servicePerformed)
                .Select<dynamic, Booking>(x => FromDB(x, true));
            }
        }
        #endregion

        #region Links
        /// <summary>
        /// Load from database all the links data
        /// </summary>
        public void FillLinks()
        {
            FillPricingSummary();
            FillUserJobTitle();
            FillServiceDates();
            FillServiceAddress();
        }

        public void FillPricingSummary()
        {
            pricingSummary = PricingSummary.Get(pricingSummaryID, pricingSummaryRevision);
            pricingSummary.FillLinks();
        }

        public void FillServiceAddress()
        {
            if (serviceAddressID.HasValue)
            {
                var users = new int[] { serviceProfessionalUserID, clientUserID };
                serviceAddress = Address.GetAddress(serviceAddressID.Value, users.AsEnumerable<int>());
            }
            else
            {
                serviceAddress = null;
            }
        }

        /// <summary>
        /// Fills the data about the service professional and its profile for the job title in the booking.
        /// IMPORTANT: Be aware that different rules apply the information load when the booking is created by the service professional,
        /// so it's important to set the bookingType before call this; to avoid mistakes, the bookingTypeID must be set or an exception is throw.
        /// </summary>
        internal void FillUserJobTitle()
        {
            if (!Enum.IsDefined(typeof(LcEnum.BookingType), bookingTypeID))
                throw new Exception("BookingTypeID must be set before calling FillUserJobTitle");

            var isServiceProfessionalBooking = bookingTypeID == (int)LcEnum.BookingType.serviceProfessionalBooking;
            userJobTitle = LcRest.PublicUserJobTitle.Get(serviceProfessionalUserID, languageID, countryID, jobTitleID, isServiceProfessionalBooking);
        }

        /// <summary>
        /// Fill the serviceDate and alternativeDate fields based on its ID (if there is one).
        /// </summary>
        public void FillServiceDates()
        {
            if (serviceDateID.HasValue)
                serviceDate = EventDates.Get(serviceDateID.Value);
            else
                serviceDate = null;
            if (alternativeDate1ID.HasValue)
                alternativeDate1 = EventDates.Get(alternativeDate1ID.Value);
            else
                alternativeDate1 = null;
            if (alternativeDate2ID.HasValue)
                alternativeDate2 = EventDates.Get(alternativeDate2ID.Value);
            else
                alternativeDate2 = null;
        }
        #endregion
        #endregion

        #region Set
        #region SQL
        /// <summary>
        /// Not all fields can be set when inserting, others
        /// are calculated. Generated BookingID is returned
        /// </summary>
        private const string sqlInsBooking = @"
            DECLARE @BookingID int

            INSERT INTO Booking (
                [ClientUserID]
                ,[ServiceProfessionalUserID]
                ,[JobTitleID]
                ,[LanguageID]
                ,[CountryID]
                ,[BookingStatusID]
                ,[BookingTypeID]
                ,[CancellationPolicyID]
                ,[ParentBookingID]

                ,[ServiceAddressID]
                ,[ServiceDateID]
                ,[AlternativeDate1ID]
                ,[AlternativeDate2ID]
                ,[PricingSummaryID]
                ,[PricingSummaryRevision]
                ,[PaymentTransactionID]
                ,[PaymentLastFourCardNumberDigits]
                ,[paymentMethodID]
                ,[CancellationPaymentTransactionID]
                
                ,[InstantBooking]
                ,[FirstTimeBooking]
                ,[SendReminder]
                ,[SendPromotional]
                ,[Recurrent]
                ,[MultiSession]
                
                ,[PaymentEnabled]
                ,[PaymentCollected]
                ,[PaymentAuthorized]
                ,[AwaitingResponseFromUserID]
                
                ,[SpecialRequests]
                ,[PreNotesToClient]
                ,[PreNotesToSelf]
                
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
            ) VALUES (
                @0, -- client
                @1, -- service professional
                @2, -- job title
                @3, -- lang
                @4, -- country,
                @5, -- status
                @6, -- type
                @7, -- policy
                @8, -- parent
                @9, @10, @11, @12, @13, @14, @15, @16, @17, @18,
                -- instant.. 
                @19, @20, @21, @22, @23, @24,
                @25, @26, @27, @28,
                @29, @30, @31,
                getdate(), getdate(), 'sys'
            )
            SET @BookingID = @@Identity

            -- Update client user profile to be a client (if is not still, maybe is only service professional)
            UPDATE Users SET IsCustomer = 1
            WHERE UserID = @0 AND IsCustomer <> 1

            -- Out
            SELECT  @BookingID As BookingID
        ";

        /// <summary>
        /// Generic update allowed to a service professional on a booking (there
        /// are extra constraints enforced by code not SQL).
        /// </summary>
        private const string sqlUpdBookingByServiceProfessional = @"
            UPDATE Booking SET
                [ServiceAddressID] = @1
                ,ServiceDateID = @2
                ,AlternativeDate1ID = @3
                ,AlternativeDate2ID = @4
                ,PricingSummaryRevision = @5
                ,PreNotesToClient = @6
                ,PreNotesToSelf = @7
                ,PostNotesToClient = @8
                ,PostNotesToSelf = @9
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
        /// <summary>
        /// Generic update allowed to a client on a booking (there
        /// are extra constraints enforced by code not SQL).
        /// </summary>
        private const string sqlUpdBookingByClient = @"
            UPDATE Booking SET
                [ServiceAddressID] = @1
                ,ServiceDateID = @2
                ,PricingSummaryRevision = @3
                ,SpecialRequests = @4
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
        /// <summary>
        /// Update SQL for internal processes about payment
        /// info and status
        /// </summary>
        private const string sqlUpdBookingPayment = @"
            UPDATE Booking SET
                PaymentTransactionID = @1
                ,PaymentCollected = @2
                ,PaymentAuthorized = @3
                ,PaymentLastFourCardNumberDigits = @4
                ,paymentMethodID = @5
                ,cancellationPaymentTransactionID = @6
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
        /// <summary>
        /// Update SQL for internal processes about status
        /// </summary>
        private const string sqlUpdateStatus = @"
            UPDATE Booking SET
                BookingStatusID = @1
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
        private const string sqlUpdClientPayment = @"
            UPDATE  Booking
            SET     ClientPayment = @1
            WHERE   BookingId = @0
        ";
        private const string sqlUpdPaidFields = @"
            UPDATE  Booking
            SET     ServiceProfessionalPPFeePaid = @1,
                    ServiceProfessionalPaid = @2,
                    LoconomicsPaid = @3,
                    LoconomicsPPFeePaid = @4
            WHERE   BookingId = @0
        ";
        /// <summary>
        /// Update SQL for internal processes, setting a booking as timedout.
        /// Right now that means to remove references to eventIDs, that must
        /// be removed
        /// </summary>
        private const string sqlUpdBookingAsTimedout = @"
            DECLARE @ServiceAddressID int
            DECLARE @d1 int
            DECLARE @d2 int
            DECLARE @d3 int

            -- Get Service Address ID to be (maybe) removed later
            SELECT  @ServiceAddressID = ServiceAddressID,
                    @d1 = ServiceDateID ,
                    @d2 = AlternativeDate1ID,
                    @d3 = AlternativeDate2ID
            FROM    Booking
            WHERE   BookingID = @0

            UPDATE Booking SET
                ServiceDateID = null
                ,AlternativeDate1ID = null
                ,AlternativeDate2ID = null
                ,ServiceAddressID = null
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0

            -- Removing Service Address, if is not an user saved location (it has not AddressName)
            DELETE FROM ServiceAddress
            WHERE AddressID = @ServiceAddressID
                    AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @ServiceAddressID AND AddressName is null) = 1
            DELETE FROM Address
            WHERE AddressID = @ServiceAddressID
                    AND
                    AddressName is null
        ";
        private const string sqlDeleteBooking = @"
            DECLARE @ServiceAddressID int
            DECLARE @d1 int
            DECLARE @d2 int
            DECLARE @d3 int
            DECLARE @ps int

            -- Get Service Address ID to be (maybe) removed later
            SELECT  @ServiceAddressID = ServiceAddressID,
                    @d1 = ServiceDateID ,
                    @d2 = AlternativeDate1ID,
                    @d3 = AlternativeDate2ID,
                    @ps = PricingSummaryID
            FROM    Booking
            WHERE   BookingID = @0

            DELETE FROM Booking
            WHERE BookingID = @0

            DELETE FROM PricingSummaryDetail
            WHERE PricingSummaryID = @ps
            DELETE FROM PricingSummary
            WHERE PricingSummaryID = @ps

            -- Removing CalendarEvents:
            DELETE FROM CalendarEvents
            WHERE ID IN (@d1, @d2, @d3)

            -- Removing Service Address, if is not an user saved location (it has not AddressName)
            DELETE FROM ServiceAddress
            WHERE AddressID = @ServiceAddressID
                    AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @ServiceAddressID AND AddressName is null) = 1
            DELETE FROM Address
            WHERE AddressID = @ServiceAddressID
                    AND
                    AddressName is null
        ";

        #region SQL Invalidate booking
        const string sqlInvalidateBooking = @"
            -- Parameters
            DECLARE @BookingID int, @BookingStatusID int
            SET @BookingID = @0
            SET @BookingStatusID = @1

            DECLARE @ServiceAddressID int
            DECLARE @d1 int
            DECLARE @d2 int
            DECLARE @d3 int
            
            BEGIN TRAN

            BEGIN TRY   

                -- Get Service Address ID to be (maybe) removed later
                SELECT  @ServiceAddressID = ServiceAddressID,
                        @d1 = ServiceDateID ,
                        @d2 = AlternativeDate1ID,
                        @d3 = AlternativeDate2ID
                FROM    Booking
                WHERE   BookingID = @BookingID

                /*
                    * Updating Booking status, and removing references to the 
                    * user selected dates and address
                    */
                UPDATE  Booking
                SET     BookingStatusID = @BookingStatusID,
                        -- ServiceDateID = null,
                        -- AlternativeDate1ID = null,
                        -- AlternativeDate2ID = null,
                        ServiceAddressID = null,
                        clientPayment = @2,
                        serviceProfessionalPaid = @3,
                        serviceProfessionalPPFeePaid = @4,
                        loconomicsPaid = @5,
                        loconomicsPPFeePaid = @6,
                        pricingSummaryRevision = @7,
                        cancellationPaymentTransactionID = @8
                WHERE   BookingID = @BookingID

                -- Removing CalendarEvents:
                -- DELETE FROM CalendarEvents
                -- WHERE ID IN (@d1, @d2, @d3)
                UPDATE CalendarEvents
                SET Deleted = getdate()
                WHERE ID IN (@d1, @d2, @d3)

                -- Removing Service Address, if is not an user saved location (it has not AddressName)
                DELETE FROM ServiceAddress
                WHERE AddressID = @ServiceAddressID
                        AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @ServiceAddressID AND AddressName is null) = 1
                DELETE FROM Address
                WHERE AddressID = @ServiceAddressID
                        AND
                        AddressName is null

                COMMIT TRAN
            END TRY
            BEGIN CATCH
                IF @@TRANCOUNT > 0
                    ROLLBACK TRAN
                -- We return error number and message
                SELECT (Cast(ERROR_NUMBER() as varchar) + ':' + ERROR_MESSAGE()) As ErrorMessage
            END CATCH
        ";
        #endregion
        #endregion

        /// <summary>
        /// Allows to create or update a booking. No constraints enforced,
        /// except by the allowed fields to be specified on: creation, update by service professional,
        /// update by client.
        /// On updates, is better to have loaded the data before do changes and request update
        /// to don't override unchanged content with null.
        /// Specific methods exists for some kind of updates.
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="sharedDb"></param>
        public static void Set(Booking booking, int byUserID = 0, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                var lastFour = String.IsNullOrWhiteSpace(booking.paymentLastFourCardNumberDigits) ? null :
                    LcEncryptor.Encrypt(ASP.LcHelpers.GetLastStringChars(booking.paymentLastFourCardNumberDigits, 4));

                if (booking.bookingID == 0)
                {
                    booking.bookingID = db.QueryValue(sqlInsBooking,
                        booking.clientUserID,
                        booking.serviceProfessionalUserID,
                        booking.jobTitleID,
                        booking.languageID,
                        booking.countryID,
                        booking.bookingStatusID,
                        booking.bookingTypeID,
                        booking.cancellationPolicyID,
                        booking.parentBookingID,

                        booking.serviceAddressID,
                        booking.serviceDateID,
                        booking.alternativeDate1ID,
                        booking.alternativeDate2ID,
                        booking.pricingSummaryID,
                        booking.pricingSummaryRevision,
                        booking.paymentTransactionID,
                        lastFour,
                        booking.paymentMethodID,
                        booking.cancellationPaymentTransactionID,

                        booking.instantBooking,
                        booking.firstTimeBooking,
                        booking.sendReminder,
                        booking.sendPromotional,
                        booking.recurrent,
                        booking.multiSession,

                        booking.paymentEnabled,
                        booking.paymentCollected,
                        booking.paymentAuthorized,
                        booking.awaitingResponseFromUserID,

                        booking.specialRequests,
                        booking.preNotesToClient,
                        booking.preNotesToSelf
                    );
                }
                else
                {
                    var byServiceProfessional = byUserID == booking.serviceProfessionalUserID;
                    var byClient = byUserID == booking.clientUserID;
                    if (byServiceProfessional)
                    {
                        db.Execute(sqlUpdBookingByServiceProfessional,
                            booking.bookingID,
                            booking.serviceAddressID,
                            booking.serviceDateID,
                            booking.alternativeDate1ID,
                            booking.alternativeDate2ID,
                            booking.pricingSummaryRevision,
                            booking.preNotesToClient,
                            booking.preNotesToSelf,
                            booking.postNotesToClient,
                            booking.postNotesToSelf
                        );
                    }
                    else if (byClient)
                    {
                        db.Execute(sqlUpdBookingByClient,
                            booking.bookingID,
                            booking.serviceAddressID,
                            booking.serviceDateID,
                            booking.pricingSummaryRevision,
                            booking.specialRequests
                        );
                    }
                    else
                    {
                        throw new ConstraintException("Booking update not allowed");
                    }
                }
            }
        }

        public static void SetPaymentState(Booking booking, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                var lastFour = String.IsNullOrWhiteSpace(booking.paymentLastFourCardNumberDigits) ? null :
                    LcEncryptor.Encrypt(ASP.LcHelpers.GetLastStringChars(booking.paymentLastFourCardNumberDigits, 4));
                
                db.Execute(sqlUpdBookingPayment,
                    booking.bookingID,
                    booking.paymentTransactionID,
                    booking.paymentCollected,
                    booking.paymentAuthorized,
                    lastFour,
                    booking.paymentMethodID,
                    booking.cancellationPaymentTransactionID
                );
            }
        }

        /// <summary>
        /// Persist on database the booking fields for prices finally paid by client
        /// after complete the client payment process (charge customer, settling transaction).
        /// It's based on information
        /// </summary>
        /// <param name="booking"></param>
        public static void SetClientPayment(Booking booking)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlUpdClientPayment,
                    booking.bookingID,
                    booking.clientPayment
                );
            }
        }

        /// <summary>
        /// Persist on database the booking fields for prices finally paid by service professional
        /// and Loconomics (fields with suffix *Paid).
        /// See SetClientPayment for client related fields.
        /// </summary>
        /// <param name="booking"></param>
        public static void SetPaidFields(Booking booking)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlUpdPaidFields,
                    booking.bookingID,
                    booking.serviceProfessionalPPFeePaid,
                    booking.serviceProfessionalPaid,
                    booking.loconomicsPaid,
                    booking.loconomicsPPFeePaid
                );
            }
        }

        public static void SetStatus(Booking booking, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.Execute(sqlUpdateStatus,
                    booking.bookingID,
                    booking.bookingStatusID
                );
            }
        }

        /// <summary>
        /// Update given booking at database to a state that is considered 'timedout'.
        /// Right now there is not an explicit 'timedout' status, but there are other changes to do:
        /// removing the Events registered, so they
        /// do not take time from the service professional (they are 'tentative' from its
        /// creation to prevent collisions).
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="sharedDb"></param>
        public static void SetAsTimedout(Booking booking, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.Execute(sqlUpdBookingAsTimedout, booking.bookingID);
                if (booking.serviceDateID.HasValue)
                    LcCalendar.DelUserAppointment(booking.serviceProfessionalUserID, booking.serviceDateID.Value);
                if (booking.alternativeDate1ID.HasValue)
                    LcCalendar.DelUserAppointment(booking.serviceProfessionalUserID, booking.alternativeDate1ID.Value);
                if (booking.alternativeDate2ID.HasValue)
                    LcCalendar.DelUserAppointment(booking.serviceProfessionalUserID, booking.alternativeDate2ID.Value);
            }
        }

        public static void SetAsInvalidated(Booking booking, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                var result = (string)db.QueryValue(
                    sqlInvalidateBooking,
                    booking.bookingID,
                    booking.bookingStatusID,
                    booking.clientPayment,
                    booking.serviceProfessionalPaid,
                    booking.serviceProfessionalPPFeePaid,
                    booking.loconomicsPaid,
                    booking.loconomicsPPFeePaid,
                    booking.pricingSummaryRevision,
                    booking.cancellationPaymentTransactionID
                );
                if (!String.IsNullOrEmpty(result))
                    throw new Exception(result);
            }
        }

        /// <summary>
        /// Deletes the Booking, it's pricingSummary (all revisions),
        /// related specifically created records for serviceAddress
        /// and calendarEvents.
        /// IMPORTANT: Does NOT manages inbox Messages/Threads created
        /// for the booking, since this method is intended for internal
        /// use when booking is in an intermiadate, incomplete, state
        /// and no messages where created/sent still.
        /// </summary>
        /// <param name="booking"></param>
        private static void DeleteBooking(Booking booking)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(
                    sqlDeleteBooking,
                    booking.bookingID
                );
            }
        }
        #endregion

        #region Calculations
        private void CalculateClientPayment()
        {
            if (pricingSummary == null)
                FillPricingSummary();

            clientPayment = pricingSummary.totalPrice ?? 0;
        }
        private void CalculatePaidFields()
        {
            if (pricingSummary == null)
                FillPricingSummary();

            if (!pricingSummary.totalPrice.HasValue || !pricingSummary.clientServiceFeePrice.HasValue)
                throw new Exception("Impossible to calculate payment without pricing summary values");

            serviceProfessionalPaid = (
                pricingSummary.totalPrice.Value - (
                    pricingSummary.paymentProcessingFeeFixed +
                    pricingSummary.paymentProcessingFeePercentage * (pricingSummary.totalPrice.Value - pricingSummary.clientServiceFeePrice.Value) +
                    pricingSummary.clientServiceFeePrice.Value
                )
            );
            serviceProfessionalPPFeePaid = (
                pricingSummary.paymentProcessingFeeFixed +
                pricingSummary.paymentProcessingFeePercentage * (pricingSummary.totalPrice.Value - pricingSummary.clientServiceFeePrice.Value)
            );
            loconomicsPaid = (
                pricingSummary.clientServiceFeePrice.Value - pricingSummary.paymentProcessingFeePercentage * pricingSummary.clientServiceFeePrice
            );
            loconomicsPPFeePaid = (
                pricingSummary.paymentProcessingFeePercentage * pricingSummary.clientServiceFeePrice.Value
            );
        }
        #endregion

        #region Instance methods
        /// <summary>
        /// Helper for in memory creation and calculation of the Pricing Summary 
        /// attached to the current booking isntance, given the services to include.
        /// It's must be saved later on database.
        /// The pricingSummary must exists as an instance with the correct fees values in it.
        /// 
        /// </summary>
        /// <param name="services"></param>
        /// <returns>It returns if the jobTitleID changed because of the given services.
        /// Note that if not all services belongs to the same jobTitleID, an ContraintException
        /// will be throw</returns>
        private bool CreatePricing(IEnumerable<int> services)
        {
            pricingSummary.pricingSummaryID = pricingSummaryID;
            pricingSummary.pricingSummaryRevision = pricingSummaryRevision;

            var jobTitleID = pricingSummary.SetDetailServices(serviceProfessionalUserID, services);

            pricingSummary.CalculateDetails();
            pricingSummary.CalculateFees();

            var result = jobTitleID != this.jobTitleID;
            this.jobTitleID = jobTitleID;
            return result;
        }

        /// <summary>
        /// Update the CalendarEvent to include contact data from
        /// the booking (must be in the database to work).
        /// </summary>
        private void UpdateEventDetails(Database sharedDb = null)
        {
            using(var db = new LcDatabase(sharedDb)) {
                var description = GetBookingEventDescription();
                var location = GetBookingLocationAsOneLineText();
                db.Execute(@"
                    UPDATE  CalendarEvents
                    SET     Description = @1,
                            Location = @2
                    WHERE   Id = @0
                ", this.serviceDateID, description, location);
            }
        }

        /// <summary>
        /// Get the location/address full information in one line of plain-text, to be used
        /// for example as a CalendarEvent.Location
        /// </summary>
        /// <param name="BookingID"></param>
        /// <returns></returns>
        private string GetBookingLocationAsOneLineText()
        {
            if (serviceAddress == null)
                FillServiceAddress();
            if (String.IsNullOrEmpty(serviceAddress.stateProvinceCode))
                // There is no address:
                return "";
            // Else, build the address one-line:
            return String.Format("{0} {1} - {2} ({4}) {5}{6}",
                serviceAddress.addressLine1,
                serviceAddress.addressLine2,
                serviceAddress.city,
                serviceAddress.stateProvinceName,
                serviceAddress.stateProvinceCode,
                serviceAddress.postalCode,
                !String.IsNullOrEmpty(serviceAddress.specialInstructions) ? string.Format(" ({0})", serviceAddress.specialInstructions) : ""
            );
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        private string GetBookingEventDescription()
        {
            // We need customer full name and phones:
            var customer = LcData.UserInfo.GetUserRowWithContactData(clientUserID);
            var phones = customer.MobilePhone ?? customer.AlternatePhone;
            if (!string.IsNullOrEmpty(customer.MobilePhone) &&
                !string.IsNullOrEmpty(customer.AlternatePhone))
            {
                phones = customer.MobilePhone + ", " + customer.AlternatePhone;
            }
            var sb = new System.Text.StringBuilder();
            sb.AppendFormat("{0} {1}'s phone number: {2}\n", customer.FirstName, customer.LastName, phones);
            sb.AppendLine("Pricing summary:");
            sb.AppendLine(LcRest.PricingSummary.GetOneLineDescription(pricingSummary));
            sb.AppendLine("Special instructions:");
            sb.AppendLine(specialRequests);
            // Previous ends in new-line but we add another new-line to get an empty line, and the phone:
            sb.AppendLine("\nCall Loconomics for help: (415) 735-6025");
            sb.AppendLine("Full details at " + LcUrl.LangUrl + LcEmailTemplate.BookingEmailInfo.GetBookingUrl(bookingID));
            return sb.ToString();
        }
        #endregion

        #region Payment related
        /** PAYMENT PHASES
         *  1- CollectPayment
         *  2- AuthorizeTransaction
         *  3- SettleTransaction
         *  4- ReleasePayment
         *  
         *  A booking confirmation or instant booking runs ProcessConfirmedBookingPayment 
         *    that runs AuhorizeTransaction is less than 7 days for service.
         *  A booking cancellation executes a RefundPayment based on cancellation policy, replacing step 2 or 3 of the process.
         *  A booking denial executes a RefundPayment with full refund, replacing step 2 or 3 of the process.
         **/
        /// <summary>
        /// The emulation allows to shortcut Braintree, for local dev environments where is
        /// not possible even to use Braintree Sandbox
        /// </summary>
        private readonly bool TESTING_EMULATEBRAINTREE = ASP.LcHelpers.Channel == "localdev";

        /// <summary>
        /// It adds payment information to the current booking,
        /// performing the needed tasks and saving information at database and Braintree.
        /// This means to save payment/card details for later,
        /// and save transactionID, last-four and related flags on our database.
        /// I the flag paymentEnabled is false, throws an exception because service professional cannot receive payments
        /// throw Braintree is choosen to do not enabled it.
        /// If the flag paymentCollected is true already or there is a transactionID, throws an exception because a second
        /// payment cannot be done; the instance must have updated info to ensure this check is secure
        /// and avoids double payment.
        /// Throws any error from Braintree or LcPayment API.
        /// </summary>
        /// <param name="savePayment">Lets the user choose if save and remember this payment method at Braintre for later
        /// use (can be fetched with the API /me/payment-methods). When using a presaved paymentMethodID, passing this
        /// flag as true and the input data will update the saved data.</param>
        /// <param name="paymentData">The data for the payment method to use, pre-saved or new</param>
        public Dictionary<string, string> CollectPayment(LcPayment.InputPaymentMethod paymentData, bool savePayment)
        {
            if (!paymentEnabled)
                throw new ConstraintException("Payment not enabled for this booking");
            if (paymentCollected || !String.IsNullOrEmpty(paymentMethodID))
                throw new ConstraintException("Payment already collected for this booking");
            
            // The input paymentID must be one generated by Braintree, reset any (malicious?) attempt
            // to provide a special temp ID generated by this method
            if (paymentData.IsTemporaryID())
                paymentData.paymentMethodID = null;

            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT, AFTER CONTSTRAINTS");

            try
            {
                // The steps on emulation allows a quick view of what the overall process does and data being set.
                if (TESTING_EMULATEBRAINTREE)
                {
                    paymentTransactionID = null;
                    cancellationPaymentTransactionID = null;
                    paymentMethodID = LcPayment.CreateFakePaymentMethodId();
                    paymentLastFourCardNumberDigits = null;
                    paymentCollected = true;
                    paymentAuthorized = false;
                }
                else
                {
                    BraintreeGateway gateway = LcPayment.NewBraintreeGateway();
                    // Find or create Customer on Braintree
                    var client = LcPayment.GetOrCreateBraintreeCustomer(clientUserID);

                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT, Braintree preparation, client " + clientUserID);

                    // Quick way for saved payment method that does not needs to be updated
                    var hasID = !String.IsNullOrWhiteSpace(paymentData.paymentMethodID);
                    if (hasID && !savePayment)
                    {
                        // Just double check payment exists to avoid mistake/malicious attempts:
                        if (!paymentData.ExistsOnVault())
                        {
                            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: Chosen payment method has expired");
                            // Since we have not input data to save, we can only throw an error
                            // invalidSavedPaymentMethod
                            throw new ConstraintException("Chosen payment method has expired");
                        }
                    }
                    else
                    {
                        // Creates or updates a payment method with the given data

                        // We create a temp ID if needed
                        // (when an ID is provided, thats used -and validated and autogenerated if is not found while saving-,
                        // and an empty ID for a payment to save is just left empty to be autogenerated as a persistent payment method)
                        if (!hasID && !savePayment)
                        {
                            paymentData.paymentMethodID = LcPayment.TempSavedCardPrefix + ASP.LcHelpers.Channel + "_" + bookingID.ToString();
                        }

                        // Validate
                        var validationResults = paymentData.Validate();
                        if (validationResults.Count > 0)
                        {
                            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: validation errors, before delete booking");

                            // Remove
                            DeleteBooking(this);

                            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: validation errors, before return them");

                            return validationResults;
                        }

                        // Save on Braintree secure Vault
                        // It updates the paymentMethodID if a new one was generated
                        var saveCardError = paymentData.SaveInVault(client.Id);
                        if (!String.IsNullOrEmpty(saveCardError))
                        {
                            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: saveCardError: " + saveCardError);
                            // paymentDataError
                            throw new ConstraintException(saveCardError);
                        }
                    }

                    // We have a valid payment ID at this moment, save it on the booking
                    paymentMethodID = paymentData.paymentMethodID;
                    // Set card number (is processed later while saving to ensure only 4 and encrypted are persisted)
                    paymentLastFourCardNumberDigits = paymentData.cardNumber;
                    // Flags
                    paymentCollected = true;
                    paymentAuthorized = false;
                    paymentTransactionID = null;
                    cancellationPaymentTransactionID = null;

                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: finished Braintree tasks");
                }
            }
            catch (Exception ex)
            {
                //ASP.LcHelpers.DebugLogger.LogEx("COLLECT PAYMENT CATCHES Braintree", ex);

                // Impossible to collect payment, or some Braintree validation error
                DeleteBooking(this);

                //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT CATCHES Braintree error, after delete booking befor rethrow");

                // Re-throw exception
                throw ex;
            }

            try
            {
                //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT: Will save booking status after success collecting");

                // Update status (since from it's creation it keeps as 'incomplete'):
                bookingStatusID = (int)(instantBooking ? LcEnum.BookingStatus.confirmed : LcEnum.BookingStatus.request);
                // Persist on database:
                SetPaymentState(this);
                SetStatus(this);
                // Send communications (it was avoided on it's creation, waiting for this to be successfully)
                var send = LcMessaging.SendBooking.For(bookingID);
                if (instantBooking)
                    send.InstantBookingConfirmed();
                else
                    send.BookingRequest();

                //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT: success booking save status");
            }
            catch (Exception ex)
            {
                //ASP.LcHelpers.DebugLogger.LogEx("COLLECT PAYMENT CATCHES", ex);
                try
                {
                    // Communicate Loconomics Stuff
                    var jsbooking = Newtonsoft.Json.JsonConvert.SerializeObject(this);
                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT CATCH, TO NOTIFY STUFF, jsbooking: " + jsbooking);
                    LcMessaging.NotifyError("Payment collected for a booking, but booking at database could not update status", "Booking.CollectPayment", "Booking: " + jsbooking);
                }
                catch { }

                // re-throw exception
                throw ex;
            }
            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT SUCCESS, NO ERRORS!");
            // No errors:
            return null;
        }

        /// <summary>
        /// This step must be run after a booking with payment is confirmed (instant or by request).
        /// Try to authorize the payment through the payment processor, but only if the service date
        /// is in the authorization time frame (7 days), otherwise left it expecing the scheduled task
        /// to perform the authorization.
        /// It returns if the task was done or not.
        /// Is not done if out the time frame, is not a confirmed booking, no serviceDate, no paymentCollected
        /// </summary>
        /// <returns></returns>
        public bool ProcessConfirmedBookingPayment()
        {
            if (bookingStatusID != (int)LcEnum.BookingStatus.confirmed ||
                !serviceDateID.HasValue ||
                !paymentCollected)
                return false;
            
            FillServiceDates();
            if ((serviceDate.startTime - DateTime.Now) < TimeSpan.FromDays(7)) {
                return AuthorizeTransaction();
            }

            return false;
        }

        /// <summary>
        /// It performs a transaction to authorize, without charge/settle,
        /// the amount on the saved payment method.
        /// This process ensures the money is available for the later moment the charge happens (withing the authorization
        /// period, the worse case 7 days) using 'SettleBookingTransaction', or manage preventively any error that arises.
        /// The transactionID generated (if any) is updated on database properly.
        /// </summary>
        /// <returns>Returns if the task was performed or not, without error.
        /// If the task cannot be performed because an error, is throwed.
        /// There are cases where the authorization does not apply, like when the transaction was already run, and returns
        /// false as a good result. If is expected to have a cardToken and is empty, throws an error.
        /// If the authorization through Braintree fails, throw the error</returns>
        public bool AuthorizeTransaction()
        {
            if (!paymentEnabled)
                return false; // throw new ConstraintException("Payment not enabled for this booking");
            if (!paymentCollected || String.IsNullOrEmpty(paymentMethodID))
                throw new ConstraintException("Payment not collected for this booking, cannot be authorized");
            if (paymentAuthorized)
                throw new ConstraintException("Payment authorized for this booking already");

            if (LcPayment.IsFakePaymentMethod(paymentMethodID))
            {
                paymentTransactionID = LcPayment.CreateFakeTransactionId();
                return true;
            }
            else
            {
                // We need pricing info, if not preloaded
                if (pricingSummary == null)
                    FillPricingSummary();

                // Transaction authorization, so NOT charge/settle now
                paymentTransactionID = LcPayment.AuthorizeBookingTransaction(this);
                paymentAuthorized = true;

                SetPaymentState(this);

                return true;
            }
        }

        /// <summary>
        /// Request payment from client payment method to Braintree. It manages if was previously authorized or not.
        /// AKA: ChargePaymentToClient
        /// </summary>
        /// <returns></returns>
        public bool SettleTransaction()
        {
            if (!paymentEnabled)
                return false; // throw new ConstraintException("Payment not enabled for this booking");
            if (!paymentCollected || String.IsNullOrEmpty(paymentMethodID))
                throw new ConstraintException("Payment not collected for this booking, cannot be settle");

            if (!paymentAuthorized)
            {
                // First, request payment authorization from collected payment method (AKA saved credit card)
                AuthorizeTransaction();
            }

            // Require payment from authorized transaction
            var settleError = LcPayment.SettleTransaction(paymentTransactionID);
            if (!String.IsNullOrEmpty(settleError))
                throw new Exception(settleError);

            // Update booking database information, setting price payed by customer
            CalculateClientPayment();
            SetClientPayment(this);

            return true;
        }

        /// <summary>
        /// Release the payment from the current booking to the service professional.
        /// Payment must be enabled and collected or will skipt returning false.
        /// Payment must be previously settle in order to run successfully, or error from Braintree
        /// will happens.
        /// Its the final step in the payment process.
        /// </summary>
        /// <returns></returns>
        public bool ReleasePayment()
        {
            if (!paymentEnabled)
                return false; // throw new ConstraintException("Payment not enabled for this booking");
            if (!paymentCollected || String.IsNullOrEmpty(paymentMethodID))
                throw new ConstraintException("Payment not collected for this booking, cannot be released");

            if (!paymentAuthorized)
            {
                // First authorize an settle
                SettleTransaction();
            }

            var errmsg = LcPayment.ReleaseTransactionFromEscrow(paymentTransactionID);
            if (!String.IsNullOrEmpty(errmsg))
                throw new Exception(errmsg);

            SetBookingAsCompleted();

            return true;
        }

        /// <summary>
        /// "Perform Payment Cancellation" / "Perform Cancellation Payment"
        /// Runs all the operations needed to cancel/decline/avoid the pending payment of the booking,
        /// usually *voiding* the pending, authorized, transaction or asking for *full refund* if already settle, to Braintree;
        /// and sometimes running a new transaction to charge to the client some cancellation fees, on other cases may be nothing
        /// so no new transaction is performed.
        /// For temporarly saved payment methods, there is no actual transaction to void/refund, so only is charged with 
        /// cancellation fee on the cases it needs to, and is removed when it finishes.
        /// 
        /// The task runs the cancellation calculation needed, that depends on the booking state (the new cancel/decline/expire state)
        /// and other set-ups to choose what fees to apply.
        /// </summary>
        /// <returns></returns>
        public void RefundPayment()
        {
            CalculateCancellation();

            if (paymentEnabled && paymentCollected)
            { 
                // If we have a payment transaction, refund/void it first:
                if (paymentAuthorized)
                {
                    // We have a transaction that can be in state: authorized, settled, or intermiedate states.
                    // We need to cancel the authorization or perform a full refund on settled.
                    // FULL REFUND
                    var result = LcPayment.FullRefundTransaction(paymentTransactionID);
                    if (!String.IsNullOrEmpty(result))
                    {
                        throw new Exception(result);
                    }
                }
                // ON ELSE: we have just a payment method collected, we just go to the last step anyway

                cancellationPaymentTransactionID = LcPayment.BookingCancellationPaymentFromCard(this);
            }

            // Save cancellation info to database
            using (var db = new LcDatabase())
            {
                db.Execute("BEGIN TRANSACTION");
                try
                {
                    // Persists changes in the pricing (cancellation fees and new totals) generating
                    // a new revision
                    var ps = PricingSummary.Set(pricingSummary, db.Db);
                    // Update booking revision to new one
                    this.pricingSummaryRevision = ps.pricingSummaryRevision;
                    // Save all changes in database and further "invalidation/clean-up" tasks:
                    SetAsInvalidated(this, db.Db);
                    db.Execute("COMMIT TRANSACTION");
                }
                catch (Exception ex)
                {
                    LcMessaging.NotifyError("Booking payment was refunded and/or cancellation fee applied, but database couldn't get updated", "", "");
                    throw ex;
                }
            }
        }
        #endregion

        #region Cancellation Policy
        /// <summary>
        /// Utility that checks if the booking is in 'cancelled' state
        /// and cancellation was performed by the client in a booking
        /// he/she generated.
        /// </summary>
        bool isCancelledByClient
        {
            get
            {
                return
                    this.bookingStatusID == (int)LcEnum.BookingStatus.cancelled &&
                    this.bookingTypeID != (int)LcEnum.BookingType.serviceProfessionalBooking;
            }
        }
        /// <summary>
        /// Applies the cancellation policy rules on the current booking,
        /// depending on status, type and cancellation policy
        /// and updating the pricingSummary values about cancellation,
        /// but not saving them in database.
        /// </summary>
        public void CalculateCancellation()
        {
            if (pricingSummary == null)
                FillPricingSummary();

            pricingSummary.cancellationDate = DateTime.Now;

            if (isCancelledByClient)
            {
                var policy = CancellationPolicy.Get(cancellationPolicyID, languageID, countryID);
                if (serviceDate == null)
                    FillServiceDates();

                var cancellationLimitDate = serviceDate.startTime.AddHours(0 - policy.hoursRequired);
                if (DateTime.Now < cancellationLimitDate)
                {
                    // BEFORE cancellation limit
                    pricingSummary.cancellationFeeCharged = (pricingSummary.subtotalPrice ?? 0) * policy.cancellationFeeBefore;
                }
                else
                {
                    // AFTER cancellation limit
                    pricingSummary.cancellationFeeCharged = (pricingSummary.subtotalPrice ?? 0) * policy.cancellationFeeAfter;
                }

                // keeps same subtotal and clientServiceFee
                // Recalculate total
                pricingSummary.totalPrice = pricingSummary.cancellationFeeCharged + pricingSummary.clientServiceFeePrice;
                // Recalculate other values using standard calculations:
                pricingSummary.CalculateServiceFee();
                CalculateClientPayment();
                CalculatePaidFields();
            }
            else {
                // Not cancelled by client, can be:
                // - cancelled by the professional (its a service professional booking)
                // - declined by the professional
                // - expired booking
                // Then: no policy apply, just no cancellation fee (aka 'full refund')
                pricingSummary.cancellationFeeCharged = 0;
                // keeps sutbottal
                // And Update totals to pay, all 0
                pricingSummary.clientServiceFeePrice = 0;
                pricingSummary.totalPrice = 0;
                pricingSummary.serviceFeeAmount = 0;
                clientPayment = 0;
                serviceProfessionalPaid = 0;
                serviceProfessionalPPFeePaid = 0;
                loconomicsPaid = 0;
                loconomicsPPFeePaid = 0;
            }
        }
        #endregion

        #region System Manipulations
        public void SetBookingAsCompleted()
        {
            if (bookingStatusID != (int)LcEnum.BookingStatus.servicePerformed)
                return;

            // Update booking information with final paid amounts
            // (it use pricing fees, will be 0 fees and pricing totals for no-payment bookings)
            CalculatePaidFields();
            SetPaidFields(this);

            // Booking is complete
            bookingStatusID = (int)LcEnum.BookingStatus.completed;
            SetStatus(this);
        }
        /// <summary>
        /// Perform tasks to expire this booking, making any refund task if needed
        /// and persisting changes to database.
        /// </summary>
        public void ExpireBooking()
        {
            // Constraint
            if (bookingStatusID != (int)LcEnum.BookingStatus.incomplete &&
                bookingStatusID != (int)LcEnum.BookingStatus.request)
            {
                throw new Exception("Booking cannot set as expired. Status: " + bookingStatusID.ToString());
            }

            if (this.pricingSummary == null)
                this.FillPricingSummary();

            bookingStatusID = (int)LcEnum.BookingStatus.requestExpired;

            this.RefundPayment();
        }
        #endregion

        #region Service Professional Manipulations
        /// <summary>
        /// 
        /// </summary>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="clientUserID"></param>
        /// <param name="serviceAddressID"></param>
        /// <param name="startTime"></param>
        /// <param name="services"></param>
        /// <param name="preNotesToClient"></param>
        /// <param name="preNotesToSelf"></param>
        /// <param name="allowBookUnavailableTime">This value allows (when true) to avoid the check of availability
        /// for the given time, letting the freelancer to book any time even if unavailable (this must be asked
        /// and warned in the UI).</param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static Booking InsServiceProfessionalBooking(
            int clientUserID,
            int serviceProfessionalUserID,
            int jobTitleID,
            int serviceAddressID,
            DateTime startTime,
            IEnumerable<int> services,
            string preNotesToClient,
            string preNotesToSelf,
            bool allowBookUnavailableTime,
            int languageID,
            int countryID
        )
        {
            using (var db = new LcDatabase())
            {
                // 0: previous data and checks
                var provider = LcData.UserInfo.GetUserRowWithContactData(serviceProfessionalUserID);
                var customer = LcData.UserInfo.GetUserRow(clientUserID);

                if (provider == null)
                    throw new ConstraintException("Impossible to retrieve the service professional information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the client information. It exists?");
                if (services == null)
                    throw new ConstraintException("Create a booking require select almost one service");

                // 1º: start booking, calculate pricing and timing by checking services included
                var booking = NewFor(clientUserID, serviceProfessionalUserID, jobTitleID, languageID, countryID, null, true);
                if (booking == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                if (booking.CreatePricing(services))
                    throw new ConstraintException("Chosen services does not belongs to the Job Title");

                // 2º: Preparing event date-times, checking availability and creating event
                var endTime = startTime.AddMinutes((double)(booking.pricingSummary.firstSessionDurationMinutes ?? 0));
                // Because this API is only for providers, we avoid the advance time from the checking
                var isAvailable = allowBookUnavailableTime || LcCalendar.CheckUserAvailability(serviceProfessionalUserID, startTime, endTime, true);
                if (!isAvailable)
                    throw new ConstraintException("The chosen time is not available, it conflicts with a recent appointment!");

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services for {1}", booking.userJobTitle.jobTitleSingularName, ASP.LcHelpers.GetUserDisplayName(customer));

                // Transaction begins
                db.Execute("BEGIN TRANSACTION");

                // Create event
                var serviceDateID = (int)db.QueryValue(LcCalendar.sqlInsBookingEvent,
                    serviceProfessionalUserID,
                    LcEnum.CalendarAvailabilityType.busy,
                    eventSummary, // summary
                    "", // initial empty description (current tools to generate it require the booking to exists in database)
                    startTime,
                    endTime,
                    timeZone
                );

                // 3º: Save pricing
                // save Summary on db, will set the ID and Revision on the returned summary
                // and save details with updated IDs too
                booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                booking.pricingSummaryID = booking.pricingSummary.pricingSummaryID;
                booking.pricingSummaryRevision = booking.pricingSummary.pricingSummaryRevision;

                // 4º: persisting booking on database
                booking.bookingStatusID = (int)LcEnum.BookingStatus.confirmed;
                booking.serviceAddressID = serviceAddressID;
                booking.serviceDateID = serviceDateID;
                booking.preNotesToClient = preNotesToClient;
                booking.preNotesToSelf = preNotesToSelf;
                Booking.Set(booking, serviceProfessionalUserID, db.Db);

                // Persisting all or nothing:
                db.Execute("COMMIT TRANSACTION");

                // LAST:
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    booking.UpdateEventDetails(db.Db);
                }
                catch {}

                LcMessaging.SendBooking.ServiceProfessionalBooking.For(booking.bookingID).InstantBookingConfirmed();

                return booking;
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingID"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="serviceAddressID"></param>
        /// <param name="startTime"></param>
        /// <param name="services"></param>
        /// <param name="preNotesToClient"></param>
        /// <param name="preNotesToSelf"></param>
        /// <param name="postNotesToClient"></param>
        /// <param name="postNotesToSelf"></param>
        /// <param name="allowBookUnavailableTime"></param>
        /// <returns></returns>
        public static bool UpdServiceProfessionalBooking(
            int bookingID,
            int serviceProfessionalUserID,
            int serviceAddressID,
            DateTime startTime,
            IEnumerable<int> services,
            string preNotesToClient,
            string preNotesToSelf,
            string postNotesToClient,
            string postNotesToSelf,
            bool allowBookUnavailableTime)
        {
            using (var db = new LcDatabase())
            {
                // 0: previous data and checks
                var booking = LcRest.Booking.Get(bookingID, false, false, serviceProfessionalUserID);
                if (booking == null || booking.serviceProfessionalUserID != serviceProfessionalUserID)
                    return false;

                // NOTE: Service Professional Editing Rules
                // Can change Pricing only if is a BookNow Booking withOUT payment collected OR is a service
                // professional booking
                var canChangePricing = 
                    booking.bookingTypeID == (int)LcEnum.BookingType.serviceProfessionalBooking || (
                        booking.bookingTypeID == (int)LcEnum.BookingType.bookNowBooking &&
                        !booking.paymentCollected
                    )
                ;
                // ON ANY CASE: professional can update time(s), location, notes (this limitations are forced
                // in the Booking.Set method for any update done by the service professional).

                var provider = LcData.UserInfo.GetUserRowWithContactData(serviceProfessionalUserID);
                var customer = LcData.UserInfo.GetUserRow(booking.clientUserID);

                if (provider == null)
                    throw new ConstraintException("Impossible to retrieve the service professional information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the client information. It exists?");
                if (services == null)
                    throw new ConstraintException("Create a booking require select almost one service");

                booking.FillUserJobTitle();
                if (booking.userJobTitle == null)
                    throw new ConstraintException("Impossible to update the booking for that Job Title.");

                // 1º: calculating pricing and timing by checking services included
                if (canChangePricing && booking.CreatePricing(services))
                    throw new ConstraintException("Impossible to change the services of a booking to another Job Title");

                // 2º: Dates update? Checking availability and updating event dates if changed
                var endTime = startTime.AddMinutes((double)(booking.pricingSummary.firstSessionDurationMinutes ?? 0));
                // Only if dates changed:
                booking.FillServiceDates();
                if (booking.serviceDate.startTime != startTime && booking.serviceDate.endTime != endTime)
                {
                    // Because this API is only for providers, we avoid the advance time from the checking
                    var isAvailable = allowBookUnavailableTime || LcCalendar.DoubleCheckEventAvailability(booking.serviceDateID.Value, startTime, endTime, true);
                    if (!isAvailable)
                        throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");

                    // Transaction begins
                    db.Execute("BEGIN TRANSACTION");

                    // Update event
                    db.Execute(LcCalendar.sqlUpdBookingEvent, booking.serviceDateID, startTime, endTime, null, null, null);
                }
                else
                {
                    // Transaction begins
                    db.Execute("BEGIN TRANSACTION");
                }

                if (canChangePricing)
                {
                    // 3º: Updating pricing estimate records
                    // save Summary on db, will set the ID and Revision on the returned summary
                    // and save details with updated IDs too
                    booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                    // Get new Revision so is persisted on Booking.Set later
                    booking.pricingSummaryRevision = booking.pricingSummary.pricingSummaryRevision;
                }

                // 4º: persisting booking on database
                booking.serviceAddressID = serviceAddressID;
                booking.preNotesToClient = preNotesToClient;
                booking.preNotesToSelf = preNotesToSelf;
                booking.postNotesToClient = postNotesToClient;
                booking.postNotesToSelf = postNotesToSelf;
                Booking.Set(booking, serviceProfessionalUserID, db.Db);

                // Persisting all or nothing:
                db.Execute("COMMIT TRANSACTION");

                // LAST:
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    booking.UpdateEventDetails(db.Db);
                }
                catch { }

                LcMessaging.SendBooking.For(booking.bookingID).BookingUpdatedByServiceProfessional();

                return true;
            }
        }

        #region SQL Confirm Booking
        const string sqlConfirmBooking = @"
            -- Parameters
            DECLARE @BookingID int
            SET @BookingID = @0            
            DECLARE @ConfirmedDateID int
            SET @ConfirmedDateID = @1

            BEGIN TRY
                BEGIN TRAN

                /* 
                 * Soft Delete not needed CalendarEvents:
                 */
                UPDATE CalendarEvents
                SET Deleted = getdate()
                WHERE ID IN (
                    SELECT TOP 1 ServiceDateID FROM Booking
                    WHERE BookingID = @BookingID AND ServiceDateID <> @ConfirmedDateID
                    UNION
                    SELECT TOP 1 AlternativeDate1ID FROM Booking
                    WHERE BookingID = @BookingID AND AlternativeDate1ID <> @ConfirmedDateID
                    UNION
                    SELECT TOP 1 AlternativeDate2ID FROM Booking
                    WHERE BookingID = @BookingID AND AlternativeDate2ID <> @ConfirmedDateID
                )

                /*
                 * Update Availability of the CalendarEvent record for the ConfirmedDateID,
                 * from 'tentative' to 'busy'
                 */
                UPDATE  CalendarEvents
                SET     CalendarAvailabilityTypeID = 2
                WHERE   Id = @ConfirmedDateID

                /*
                 * Updating Booking status, set selected serviceDate and remove
                 * alternative ones
                 */
                UPDATE  Booking
                SET     BookingStatusID = 6, -- confirmed
                        ServiceDateID = @ConfirmedDateID,
                        AlternativeDate1ID = null,
                        AlternativeDate2ID = null
                WHERE   BookingID = @BookingID

                COMMIT TRAN
            END TRY
            BEGIN CATCH
                IF @@TRANCOUNT > 0
                    ROLLBACK TRAN
                -- We return error number and message
                SELECT (Cast(ERROR_NUMBER() as varchar) + ':' + ERROR_MESSAGE()) As ErrorMessage
            END CATCH
        ";
        #endregion

        /// <summary>
        /// Method that allows a Service Professional to confirm a Booking in
        /// state 'Booking Request' using the specified date type
        /// </summary>
        /// <param name="dateType">A string value from: PREFERRED, ALTERNATIVE1, ALTERNATIVE2;
        /// that date/event from the booking request will be confirmed.</param>
        /// <returns></returns>
        public bool ConfirmBookingRequest(string dateType)
        {
            // Constraint
            if (bookingStatusID != (int)LcEnum.BookingStatus.request)
            {
                throw new ConstraintException("Booking cannot be confirmed. Status: " + bookingStatusID.ToString());
            }

            int? dateID = null;
            switch (dateType.ToUpper())
            {
                case "PREFERRED":
                    dateID = serviceDateID;
                    break;
                case "ALTERNATIVE1":
                    dateID = alternativeDate1ID;
                    break;
                case "ALTERNATIVE2":
                    dateID = alternativeDate2ID;
                    break;
            }
            if (!dateID.HasValue)
            {
                throw new ConstraintException("A valid date must be choosen to confirm the booking request");
            }

            // Disabled *excessive* double check: client only can choose an available time and professional knows what is confirming
            // AND it's buggy for this concrete case, a booking request, since the double check takes care only of one event at a time,
            // while it must discard all three events choosen in the request to avoid that one of the times collides with the other one
            // (commented at #735, as the case of a first time of 12:00-13:00 and second of 12:30-13:30, checking any of them will fail
            // because of the other one overlapping it).
            /*if (!LcCalendar.DoubleCheckEventAvailability(dateID.Value, null, null, true))
            {
                // Text: message to be showed to provider and must care that the time was available when selected
                // but is not now because a (very) recent change (race condition).
                throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");
            }*/

            using (var db = new LcDatabase())
            {
                // Save confirmation data
                var err = (string)db.QueryValue(sqlConfirmBooking, bookingID, dateID.Value);
                if (!String.IsNullOrEmpty(err))
                {
                    throw new ConstraintException(err);
                }
                // Set in-memory object as confirmed too in order to...
                bookingStatusID = (int)LcEnum.BookingStatus.confirmed;
                serviceDateID = dateID.Value;
                // ..process the payment options of the booking, if any
                ProcessConfirmedBookingPayment();

                // LAST:
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    UpdateEventDetails(db.Db);
                }
                catch { }
            }

            LcMessaging.SendBooking.For(bookingID).BookingRequestConfirmed();

            // Success
            return true;
        }
        /// <summary>
        /// Performs a booking cancellation by a service professional, save at database and send messages
        /// </summary>
        public void CancelBookingByServiceProfessional()
        {
            // Constraint
            if (bookingStatusID != (int)LcEnum.BookingStatus.confirmed ||
                bookingTypeID != (int)LcEnum.BookingType.serviceProfessionalBooking)
            {
                throw new Exception("Booking cannot be cancelled. Status: " + bookingStatusID.ToString() +
                    " Type: " + bookingTypeID.ToString()
                );
            }

            if (this.pricingSummary == null)
                this.FillPricingSummary();

            bookingStatusID = (int)LcEnum.BookingStatus.cancelled;

            this.RefundPayment();

            LcMessaging.SendBooking.For(bookingID).BookingCancelledByServiceProfessional();
        }
        /// <summary>
        /// Performs a booking denied/decline by a service professional,
        /// save it at database and send messages
        /// </summary>
        public void DeclineBooking()
        {
            // Constraint
            if (bookingStatusID != (int)LcEnum.BookingStatus.request ||
                bookingTypeID == (int)LcEnum.BookingType.serviceProfessionalBooking)
            {
                throw new Exception("Booking cannot be declined. Status: " + bookingStatusID.ToString() +
                    " Type: " + bookingTypeID.ToString()
                );
            }

            if (this.pricingSummary == null)
                this.FillPricingSummary();

            bookingStatusID = (int)LcEnum.BookingStatus.denied;

            this.RefundPayment();
            // Remove relationship (will internally do it only if no other bookings active)
            Client.DeleteServiceProfessionalClient(serviceProfessionalUserID, clientUserID);

            LcMessaging.SendBooking.For(bookingID).BookingRequestDeclined();
        }
        #endregion

        #region Client Manipulations
        /// <summary>
        /// Utility for client bookings, to check service professional availability for the given input
        /// data, thow a ConstraintException if not available and returns the calculated endTime if available.
        /// It takes care of the advanceTime
        /// </summary>
        /// <param name="startTime"></param>
        /// <param name="serviceDurationMinutes"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <returns></returns>
        private static DateTime CheckAvailability(DateTime startTime, decimal? serviceDurationMinutes, int serviceProfessionalUserID)
        {
            var endTime = startTime.AddMinutes((double)(serviceDurationMinutes ?? 0));
            // Because this API is only for providers, we avoid the advance time from the checking
            var isAvailable = LcCalendar.CheckUserAvailability(serviceProfessionalUserID, startTime, endTime, false);
            if (!isAvailable)
                throw new ConstraintException(String.Format("The time {0} is not available, it conflicts with a recent appointment!", startTime));

            return endTime;
        }
        /// <summary>
        /// Create an save a client booking.
        /// </summary>
        /// <param name="clientUserID"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="serviceAddressID"></param>
        /// <param name="serviceStartTime"></param>
        /// <param name="alternative1StartTime"></param>
        /// <param name="alternative2StartTime"></param>
        /// <param name="services"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static Booking InsClientBooking(
            int clientUserID,
            int serviceProfessionalUserID,
            int jobTitleID,
            Address serviceAddress,
            DateTime serviceStartTime,
            DateTime? alternative1StartTime,
            DateTime? alternative2StartTime,
            IEnumerable<int> services,
            int languageID,
            int countryID,
            string bookCode
        )
        {
            using (var db = new LcDatabase())
            {
                // 0: previous data and checks
                var provider = LcData.UserInfo.GetUserRowWithContactData(serviceProfessionalUserID);
                var customer = LcData.UserInfo.GetUserRow(clientUserID);

                if (provider == null)
                    throw new ConstraintException("Impossible to retrieve the service professional information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the client information. It exists?");
                if (services == null)
                    throw new ConstraintException("Create a booking require select almost one service");

                // 1º: start booking, calculate pricing and timing by checking services included
                var booking = NewFor(clientUserID, serviceProfessionalUserID, jobTitleID, languageID, countryID, bookCode);
                if (booking == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // Booking type enforced by this API, required before calculate correctly the pricing:
                if (booking.CreatePricing(services))
                    throw new ConstraintException("Choosen services does not belongs to the Job Title");

                // 2º: Preparing event date-times, checking availability and creating event
                var serviceEndTime = CheckAvailability(serviceStartTime, booking.pricingSummary.firstSessionDurationMinutes, serviceProfessionalUserID);
                DateTime? alternative1EndTime = null;
                DateTime? alternative2EndTime = null;
                if (!booking.instantBooking)
                {
                    alternative1EndTime = alternative1StartTime.HasValue ? (DateTime?)CheckAvailability(alternative1StartTime.Value, booking.pricingSummary.firstSessionDurationMinutes, serviceProfessionalUserID) : null;
                    alternative2EndTime = alternative2StartTime.HasValue ? (DateTime?)CheckAvailability(alternative2StartTime.Value, booking.pricingSummary.firstSessionDurationMinutes, serviceProfessionalUserID) : null;
                }

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services by {1}", booking.userJobTitle.jobTitleSingularName, ASP.LcHelpers.GetUserDisplayName(provider));

                // Transaction begins
                db.Execute("BEGIN TRANSACTION");

                // Create events
                booking.serviceDateID = (int)db.QueryValue(LcCalendar.sqlInsBookingEvent,
                    serviceProfessionalUserID,
                    booking.instantBooking ? LcEnum.CalendarAvailabilityType.busy : LcEnum.CalendarAvailabilityType.tentative,
                    eventSummary, // summary
                    "", // initial empty description (current tools to generate it require the booking to exists in database)
                    serviceStartTime,
                    serviceEndTime,
                    timeZone
                );
                if (!booking.instantBooking)
                {
                    if (alternative1EndTime.HasValue)
                    {
                        booking.alternativeDate1ID = (int)db.QueryValue(LcCalendar.sqlInsBookingEvent,
                            serviceProfessionalUserID,
                            LcEnum.CalendarAvailabilityType.tentative,
                            eventSummary, // summary
                            "", // initial empty description (current tools to generate it require the booking to exists in database)
                            alternative1StartTime,
                            alternative1EndTime,
                            timeZone
                        );
                    }
                    if (alternative2EndTime.HasValue)
                    {
                        booking.alternativeDate2ID = (int)db.QueryValue(LcCalendar.sqlInsBookingEvent,
                            serviceProfessionalUserID,
                            LcEnum.CalendarAvailabilityType.tentative,
                            eventSummary, // summary
                            "", // initial empty description (current tools to generate it require the booking to exists in database)
                            alternative2StartTime,
                            alternative2EndTime,
                            timeZone
                        );
                    }
                }

                // 3º: Save pricing
                // save Summary on db, will set the ID and Revision on the returned summary
                // and save details with updated IDs too
                booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                booking.pricingSummaryID = booking.pricingSummary.pricingSummaryID;
                booking.pricingSummaryRevision = booking.pricingSummary.pricingSummaryRevision;

                // 4º: Validate addressID or save the new one provided
                if (!serviceAddress.IsNewAddress())
                {
                    // Validate the address is one from client or service professional
                    if (!Address.ItBelongsTo(serviceAddress.addressID, booking.clientUserID, booking.serviceProfessionalUserID))
                    {
                        throw new ConstraintException("Selected location is not valid.");
                    }
                    else
                    {
                        booking.serviceAddressID = serviceAddress.addressID;
                    }
                }
                else
                {
                    // Save new client address for the service
                    serviceAddress.userID = clientUserID;
                    // Is a client service address, where perform a service but not related to
                    // a job title but as customer
                    serviceAddress.kind = Address.AddressKind.Service;
                    serviceAddress.isServiceLocation = true;
                    serviceAddress.jobTitleID = Address.NotAJobTitleID;
                    // Save and get ID (passed in the connection to be in the same transaction)
                    booking.serviceAddressID = Address.SetAddress(serviceAddress, db.Db);
                }

                // 5º: persisting booking on database
                // Explicitly set incomplete status when payment is enabled (since payment info was not added still, it requires
                // a call to another method after this).
                // On no payment, depends on instantBooking
                var mustSendEmail = false;
                if (booking.paymentEnabled)
                {
                    booking.bookingStatusID = (int)LcEnum.BookingStatus.incomplete;
                }
                else
                {
                    mustSendEmail = true;
                    booking.bookingStatusID = (int)(booking.instantBooking ? LcEnum.BookingStatus.confirmed : LcEnum.BookingStatus.request);
                }
                Booking.Set(booking, clientUserID, db.Db);
                if (booking.firstTimeBooking)
                {
                    // Create client-professional relationship. Without this, professional cannot fetch information about the client
                    Client.SetServiceProfessionalClient(booking.serviceProfessionalUserID, new Client
                    {
                        clientUserID = booking.clientUserID
                    }, db.Db);
                }

                // Persisting all or nothing:
                db.Execute("COMMIT TRANSACTION");

                // LAST:
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    booking.UpdateEventDetails(db.Db);
                }
                catch {}

                // We only send email if booking is ready for that; when there is payment
                // we wait to collectPayment, there the email is sent if success, and the bookingStatus changes too.
                if (mustSendEmail)
                {
                    var send = LcMessaging.SendBooking.For(booking.bookingID);
                    if (booking.instantBooking)
                        send.InstantBookingConfirmed();
                    else
                        send.BookingRequest();
                }

                return booking;
            }
        }
        /// <summary>
        /// Performs a booking cancellation by a client, save at database and send messages
        /// </summary>
        public void CancelBookingByClient()
        {
            // Constraint
            if ((bookingStatusID != (int)LcEnum.BookingStatus.confirmed &&
                bookingStatusID != (int)LcEnum.BookingStatus.request) ||
                bookingTypeID == (int)LcEnum.BookingType.serviceProfessionalBooking)
            {
                throw new Exception("Booking cannot be cancelled. Status: " + bookingStatusID.ToString() +
                    " Type: " + bookingTypeID.ToString()
                );
            }

            if (this.pricingSummary == null)
                this.FillPricingSummary();

            bookingStatusID = (int)LcEnum.BookingStatus.cancelled;

            this.RefundPayment();

            LcMessaging.SendBooking.For(bookingID).BookingCancelledByClient();
        }
        #endregion
    }
}