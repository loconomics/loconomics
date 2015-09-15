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
        public bool paymentEnabled;
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
        private dynamic userJobTitle;
        #endregion

        #region Instances
        private Booking() { }

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

                preNotesToSelf = (forServiceProfessional ? booking.preNotesToSelf : ""),
                postNotesToSelf = (forServiceProfessional ? booking.postNotesToSelf : ""),

                reviewedByServiceProfessional = booking.reviewedByServiceProfessional,
                reviewedByClient = booking.reviewedByClient
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
        public static Booking NewFor(int clientID, int serviceProfessionalID, int jobTitleID, int langID, int countryID, string bookCode)
        {
            var booking = new Booking();
            booking.clientUserID = clientID;
            booking.serviceProfessionalUserID = serviceProfessionalID;
            booking.jobTitleID = jobTitleID;
            booking.languageID = langID;
            booking.countryID = countryID;

            // Check service-job exists and enabled, and get its public preferences
            booking.FillUserJobTitle();
            if (booking.userJobTitle == null)
            {
                // Cannot create booking, returns null as meaning 'not found'
                return null;
            }

            // Only supports auto-detect client BookNow and Marketplace bookings. ServiceProfessional booking must be overwritted on its own API and
            // other types are not yet implemented
            booking.bookingTypeID = (int)(IsValidBookCode(serviceProfessionalID, bookCode) ? LcEnum.BookingType.bookNowBooking : LcEnum.BookingType.marketplaceBooking);

            // Check payment enabled on the
            // Payment is required for client bookings, but avoided on bookNow bookings.
            // TODO Per #590, a new check by job-title and bookNow preference may be required, allowing
            // optionally enabling payment through bookNow.
            booking.paymentEnabled = false;
            if (booking.bookingTypeID != (int)LcEnum.BookingType.bookNowBooking)
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
            FillPricingSummary();
            FillUserJobTitle();
        }

        public void FillPricingSummary()
        {
            pricingSummary = PricingSummary.Get(pricingSummaryID, pricingSummaryRevision);
            pricingSummary.FillLinks();
        }

        /// <summary>
        /// TODO: Adapt API to return a REST class rather than dynamic
        /// </summary>
        public void FillUserJobTitle()
        {
            var data = LcData.JobTitle.GetPublicUserJobTitles(serviceProfessionalUserID, languageID, countryID, jobTitleID);
            if (data == null || data.Count == 0)
            {
                userJobTitle = null;
            }
            else
            {
                userJobTitle = data[0];
            }
        }
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
                @9, @10, @11, @12, @13, @14, @15, @16,
                -- instant.. 
                @17, @18, @19, @20, @21, @22,
                @23, @24, @25, @26
                @27, @28, @29,
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
                ,[ServiceAddressID] = @1
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
                ,[ServiceAddressID] = @1
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
                ,BookingStatusID = @1
                ,PaymentTransactionID = @2
                ,PaymentCollected = @3
                ,PaymentAuthorized = @4
                ,PaymentLastFourCardNumberDigits = @5
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
        /// <summary>
        /// Update SQL for internal processes about status
        /// </summary>
        private const string sqlUpdateStatus = @"
            UPDATE Booking SET
                ,BookingStatusID = @1
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingID = @0
        ";
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

        public static void SetPaymentStatus(Booking booking, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                var lastFour = String.IsNullOrWhiteSpace(booking.paymentLastFourCardNumberDigits) ? null :
                    LcEncryptor.Encrypt(ASP.LcHelpers.GetLastStringChars(booking.paymentLastFourCardNumberDigits, 4));
                
                db.Execute(sqlUpdBookingPayment,
                    booking.bookingID,
                    booking.bookingStatusID,
                    booking.paymentTransactionID,
                    booking.paymentCollected,
                    booking.paymentAuthorized,
                    lastFour
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
        #endregion

        #region Instance methods
        /// <summary>
        /// Helper for in memory creation and calculation of the Pricing Summary 
        /// attached to the current booking isntance, given the services to include.
        /// It's must be saved later on database.
        /// 
        /// TODO Complete PricingSummary TODOs
        /// </summary>
        /// <param name="services"></param>
        /// <returns>It returns if the jobTitleID changed because of the given services.
        /// Note that if not all services belongs to the same jobTitleID, an ContraintException
        /// will be throw</returns>
        private bool CreatePricing(IEnumerable<int> services)
        {
            var summary = new PricingSummary
            {
                pricingSummaryID = pricingSummaryID,
                pricingSummaryRevision = pricingSummaryRevision
            };

            var jobTitleID = summary.SetDetailServices(serviceProfessionalUserID, services);
            summary.CalculateDetails();
            summary.CalculateFees(BookingType.Get(this.bookingTypeID), this.firstTimeBooking);

            pricingSummary = summary;

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
                var description = LcData.Booking.GetBookingEventDescription(this.bookingID);
                var location = LcData.Booking.GetBookingLocationAsOneLineText(this.bookingID);
                db.Execute(@"
                    UPDATE  CalendarEvents
                    SET     Description = @1,
                            Location = @2
                    WHERE   Id = @0
                ", this.serviceDateID, description, location);
            }
        }

        /// <summary>
        /// The emulation allows to shortcut Braintree, for local dev environments where is
        /// not possible even to use Braintree Sandbox
        /// </summary>
        private const bool TESTING_EMULATEBRAINTREE = ASP.LcHelpers.Channel == "localdev";

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
            if (paymentCollected || !String.IsNullOrEmpty(paymentTransactionID))
                throw new ConstraintException("Payment already collected for this booking");
            
            // The input paymentID must be one generated by Braintree, reset any (malicious) attempt
            // to provide a special temp ID generated by this method
            if (paymentData.IsTemporaryID())
                paymentData.paymentMethodID = null;

            // The steps on emulation allows a quick view of what the overall process does and data set.
            if (TESTING_EMULATEBRAINTREE)
            {
                paymentTransactionID = LcPayment.CreateFakeTransactionId();
                paymentLastFourCardNumberDigits = null;
                paymentCollected = true;
                paymentAuthorized = false;
            }
            else
            {
                BraintreeGateway gateway = LcPayment.NewBraintreeGateway();
                // Find or create Customer on Braintree
                var client = LcPayment.GetOrCreateBraintreeCustomer(clientUserID);

                // Quick way for saved pyament method that does not needs to be updated
                var hasID = !String.IsNullOrWhiteSpace(paymentData.paymentMethodID);
                if (hasID && !savePayment)
                {
                    // Just double check payment exists to avoid mistake/malicious attempts:
                    if (!paymentData.ExistsOnVault())
                    {
                        // Since we have not input data to save, we can only throw an error
                        // invalidSavedPaymentMethod
                        throw new ConstraintException("Choosen payment method have expired");
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
                        return validationResults;

                    // Save on Braintree secure Vault
                    // It updates the ID if a new one was generated
                    var saveCardError = paymentData.SaveInVault(client.Id);
                    if (!String.IsNullOrEmpty(saveCardError))
                    {
                        // paymentDataError
                        throw new ConstraintException(saveCardError);
                    }
                }

                // We have a valid payment ID at this moment, create the transactionID with that
                paymentTransactionID = LcPayment.TransactionIdIsCardPrefix + paymentData.paymentMethodID;
                // Set card number (is processed later while saving to ensure only 4 and encrypted are persisted)
                paymentLastFourCardNumberDigits = paymentData.cardNumber;
                // Flags
                paymentCollected = true;
                paymentAuthorized = false;
            }

            // Update status:
            bookingStatusID = (int)(instantBooking ? LcEnum.BookingStatus.confirmed : LcEnum.BookingStatus.request);
            // Persist on database:
            SetPaymentStatus(this);
            // No errors:
            return null;
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
                var booking = NewFor(clientUserID, serviceProfessionalUserID, jobTitleID, languageID, countryID, null);
                if (booking == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // Booking type enforced by this API, required before calculate correctly the pricing:
                booking.bookingTypeID = (int)LcEnum.BookingType.serviceProfessionalBooking;
                if (booking.CreatePricing(services))
                    throw new ConstraintException("Choosen services does not belongs to the Job Title");

                // 2º: Preparing event date-times, checking availability and creating event
                var endTime = startTime.AddMinutes((double)(booking.pricingSummary.serviceDurationMinutes ?? 0));
                // Because this API is only for providers, we avoid the advance time from the checking
                var isAvailable = allowBookUnavailableTime || LcCalendar.CheckUserAvailability(serviceProfessionalUserID, startTime, endTime, true);
                if (!isAvailable)
                    throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services for {1}", booking.userJobTitle.PositionSingular, ASP.LcHelpers.GetUserDisplayName(customer));

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
                booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                // save Details, they are updated with latest ID and Revision
                PricingSummary.SetDetails(booking.pricingSummary, db.Db);

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

                return booking;
            }
        }
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
                var booking = LcRest.Booking.Get(bookingID, false, serviceProfessionalUserID);
                if (booking == null)
                    return false;

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
                if (booking.CreatePricing(services))
                    throw new ConstraintException("Impossible to change the services of a booking to another Job Title");

                // 2º: Dates update? Checking availability and updating event dates if changed
                var endTime = startTime.AddMinutes((double)(booking.pricingSummary.serviceDurationMinutes ?? 0));
                // Only if dates changed:
                var eventInfo = LcCalendar.GetBasicEventInfo(booking.serviceDateID.Value, db.Db);
                if (eventInfo.StartTime != startTime && eventInfo.EndTime != endTime)
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

                // 3º: Updating pricing estimate records
                // save Summary on db, will set the ID and Revision on the returned summary
                booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                // save Details, they are updated with latest ID and Revision
                PricingSummary.SetDetails(booking.pricingSummary, db.Db);

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

                return true;
            }
        }
        #endregion

        #region Client Manipulations
        /// <summary>
        /// Utility for client bookings, to check service professional availability for the given input
        /// data, thow a ConstraintException if not available and returns the calculated endTime if available.
        /// </summary>
        /// <param name="startTime"></param>
        /// <param name="serviceDurationMinutes"></param>
        /// <param name="serviceProfessionalUserID"></param>
        /// <returns></returns>
        private static DateTime CheckAvailability(DateTime startTime, decimal? serviceDurationMinutes, int serviceProfessionalUserID)
        {
            var endTime = startTime.AddMinutes((double)(serviceDurationMinutes ?? 0));
            // Because this API is only for providers, we avoid the advance time from the checking
            var isAvailable = LcCalendar.CheckUserAvailability(serviceProfessionalUserID, startTime, endTime, true);
            if (!isAvailable)
                throw new ConstraintException(String.Format("The time {0} is not available, it conflicts with a recent appointment!", startTime));

            return endTime;
        }
        /// <summary>
        /// Create an save a client booking.
        /// TODO Payment info.
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
            int serviceAddressID,
            DateTime serviceStartTime,
            DateTime? alternative1StartTime,
            DateTime? alternative2StartTime,
            IEnumerable<int> services,
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
                var booking = NewFor(clientUserID, serviceProfessionalUserID, jobTitleID, languageID, countryID, null);
                if (booking == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // Booking type enforced by this API, required before calculate correctly the pricing:
                if (booking.CreatePricing(services))
                    throw new ConstraintException("Choosen services does not belongs to the Job Title");

                // 2º: Preparing event date-times, checking availability and creating event
                var serviceEndTime = CheckAvailability(serviceStartTime, booking.pricingSummary.serviceDurationMinutes, serviceProfessionalUserID);
                DateTime? alternative1EndTime = null;
                DateTime? alternative2EndTime = null;
                if (!booking.instantBooking)
                {
                    alternative1EndTime = alternative1StartTime.HasValue ? (DateTime?)CheckAvailability(alternative1StartTime.Value, booking.pricingSummary.serviceDurationMinutes, serviceProfessionalUserID) : null;
                    alternative2EndTime = alternative2StartTime.HasValue ? (DateTime?)CheckAvailability(alternative2StartTime.Value, booking.pricingSummary.serviceDurationMinutes, serviceProfessionalUserID) : null;
                }

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services by {1}", booking.userJobTitle.PositionSingular, ASP.LcHelpers.GetUserDisplayName(provider));

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
                booking.pricingSummary = PricingSummary.Set(booking.pricingSummary, db.Db);
                // save Details, they are updated with latest ID and Revision
                PricingSummary.SetDetails(booking.pricingSummary, db.Db);

                // 4º: persisting booking on database
                // Explicitly set incomplete status when payment is enabled (since payment info was not added still, it requires
                // a call to another method after this).
                // On no payment, depends on instantBooking
                if (booking.paymentEnabled)
                {
                    booking.bookingStatusID = (int)LcEnum.BookingStatus.incomplete;
                }
                else
                {
                    booking.bookingStatusID = (int)(booking.instantBooking ? LcEnum.BookingStatus.confirmed : LcEnum.BookingStatus.request);
                }
                booking.serviceAddressID = serviceAddressID;
                Booking.Set(booking, clientUserID, db.Db);

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

                return booking;
            }
        }
        #endregion
    }
}