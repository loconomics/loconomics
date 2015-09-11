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
                @23, @24, @25,
                @26, @27, @28,
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
                var lastFour = String.IsNullOrWhiteSpace(booking.paymentLastFourCardNumberDigits) ? null : LcEncryptor.Encrypt(booking.paymentLastFourCardNumberDigits);

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
            int serviceProfessionalUserID,
            int clientUserID,
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
                    throw new ConstraintException("Impossible to retrieve the provider information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the customer information. It exists?");
                if (services == null)
                    throw new ConstraintException("Create a booking require select almost one service");

                // 1º: calculating pricing and timing by checking services included
                var booking = new Booking();
                booking.CreatePricing(services);

                // 1-after Checks:
                var position = LcData.UserInfo.GetUserPos(serviceProfessionalUserID, booking.jobTitleID, languageID, countryID);
                if (position == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // 2º: Preparing event date-times, checking availability and creating event
                var endTime = startTime.AddMinutes((double)(booking.pricingSummary.serviceDurationMinutes ?? 0));
                // Because this API is only for providers, we avoid the advance time from the checking
                var isAvailable = allowBookUnavailableTime || LcCalendar.CheckUserAvailability(serviceProfessionalUserID, startTime, endTime, true);
                if (!isAvailable)
                    throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services for {1}", position.PositionSingular, ASP.LcHelpers.GetUserDisplayName(customer));

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
                booking.clientUserID = clientUserID;
                booking.serviceProfessionalUserID = serviceProfessionalUserID;
                booking.languageID = languageID;
                booking.countryID = countryID;
                booking.bookingTypeID = (int)LcEnum.BookingType.serviceProfessionalBooking;
                booking.serviceAddressID = serviceAddressID;
                booking.cancellationPolicyID = LcData.Booking.GetProviderCancellationPolicyID(serviceProfessionalUserID, booking.jobTitleID, db.Db);
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

                // 1º: calculating pricing and timing by checking services included
                if (booking.CreatePricing(services))
                    throw new ConstraintException("Impossible to change the services of a booking to another Job Title");

                // 1-after Checks:
                var position = LcData.UserInfo.GetUserPos(serviceProfessionalUserID, booking.jobTitleID, booking.languageID, booking.countryID);
                if (position == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

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

        #region Client Updates Manipulations
        #endregion
    }
}