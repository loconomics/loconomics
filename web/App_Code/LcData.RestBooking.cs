using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.WebPages;

/// <summary>
/// Descripción breve de LcData
/// </summary>
public static partial class LcData
{
	public static partial class Booking
	{
        #region SQL
        private const string sqlRestSelectBooking = @"
            SELECT
                B.BookingID,
                B.BookingRequestID,
                B.ConfirmedDateID,
                B.TotalPricePaidByCustomer,
                B.TotalServiceFeesPaidByCustomer,
                B.TotalPaidToProvider,
                B.TotalServiceFeesPaidByProvider,
                B.CreatedDate,
                B.UpdatedDate,
                B.BookingStatusID,
                B.PricingAdjustmentApplied,
                B.PreNotesToClient,
                B.PreNotesToSelf,
                B.PostNotesToClient,
                B.PostNotesToSelf,

                R.BookingTypeID,
                R.ProviderUserID,
                R.CustomerUserID,
                R.PositionID,
                R.PricingEstimateID,
                R.BookingRequestStatusID,
                R.SpecialRequests,
                R.CreatedDate As RCreatedDAte,
                R.UpdatedDate As RUpdatedDate,
                R.PreferredDateID,
                R.AlternativeDate1ID,
                R.AlternativeDate2ID,
                R.AddressID,
                R.CancellationPolicyID,
                R.InstantBooking,

                Pr.PricingEstimateRevision,
                Pr.ServiceDuration,
                Pr.FirstSessionDuration,
                Pr.SubtotalPrice,
                Pr.FeePrice,                        
                Pr.TotalPrice,
                Pr.PFeePrice,
                Pr.CreatedDate As PrCreatedDate,
                Pr.UpdatedDate As PrUpdatedDate,
                Pr.SubtotalRefunded,
                Pr.FeeRefunded,
                Pr.TotalRefunded,
                Pr.DateRefunded,

                E.StartTime,
                E.EndTime,
                E.TimeZone,

                CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URP
                    WHERE URP.BookingID = B.BookingID
                        AND
                        URP.ProviderUserID = R.ProviderUserID
                        AND 
                        URP.PositionID = 0
                ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByProvider,
                CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URC
                    WHERE URC.BookingID = B.BookingID
                        AND
                        URC.CustomerUserID = R.CustomerUserID
                        AND 
                        URC.PositionID = R.PositionID
                ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByCustomer

            FROM    Booking As B
                        INNER JOIN
                    BookingRequest As R
                          ON B.BookingRequestID = R.BookingRequestID
                         INNER JOIN
                    PricingEstimate As Pr
                          ON Pr.PricingEstimateID = R.PricingEstimateID
                            AND Pr.PricingEstimateRevision = (
                                SELECT  TOP 1 SubPr.PricingEstimateRevision
                                FROM    PricingEstimate As SubPr
                                WHERE   SubPr.PricingEstimateID = R.PricingEstimateID
                                ORDER BY PricingEstimateRevision DESC
                            )
                        INNER JOIN
                    CalendarEvents As E
                        ON E.Id = B.ConfirmedDateID
        ";
        private const string sqlRestGetPricingEstimateDetail = @"
            SELECT  ProviderPackageID,
                    ProviderPricingDataInput,
                    CustomerPricingDataInput,
                    HourlyPrice,
                    SubtotalPrice,
                    FeePrice,
                    TotalPrice,
                    ServiceDuration,
                    FirstSessionDuration,
                    CreatedDate,
                    UpdatedDate
            FROM    PricingEstimateDetail
            WHERE   PricingEstimateID = @0 AND PricingEstimateRevision = @1
        ";
        private const string sqlRestInsProviderBooking = @"
            DECLARE @BookingRequestID int

            INSERT INTO BookingRequest (
                [CustomerUserID]
                ,[ProviderUserID]
                ,[PositionID]
                ,[BookingTypeID]
                ,[PricingEstimateID]
                ,[AddressID]
                ,[BookingRequestStatusID]
                ,[CancellationPolicyID]
                ,[SpecialRequests]
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[InstantBooking]
            ) VALUES (
                @0, -- customer
                @1, -- provider
                @2, -- position
                @3, -- type
                @4, -- estimate,
                @5, -- address
                7, -- status: confirmed
                @6, -- cancellation
                '', -- special requests
                getdate(), getdate(), 'sys',
                1 -- instant
            )
            SET @BookingRequestID = @@Identity

            DECLARE @BookingID int
            INSERT INTO Booking (
                [BookingRequestID]
                ,[ConfirmedDateID]
                ,BookingStatusID
                ,CreatedDate
                ,UpdatedDate
                ,ModifiedBy
                ,PreNotesToClient
                ,PreNotesToSelf
            ) VALUES (
                @BookingRequestID,
                @7, -- date
                1, -- status: confirmed
                getdate(), getdate(), 'sys',
                @8, @9 -- notes to client and self
            )
            SET @BookingID = @@Identity

            -- Update customer user profile to be a customer (if is not still, maybe is only provider)
            UPDATE Users SET IsCustomer = 1
            WHERE UserID = @0 AND IsCustomer <> 1

            -- Out
            SELECT  @BookingRequestID As BookingRequestID,
                    @BookingID As BookingID
        ";
        private const string sqlRestUpdProviderBooking = @"
            DECLARE @bookingRequestID int
            DECLARE @bookingID int
            
            SET @bookingID = @0
            SELECT @bookingRequestID = BookingRequestID
            FROM Booking
            WHERE BookingID = @bookingID

            UPDATE BookingRequest SET
                [CustomerUserID] = @1
                ,[PositionID] = @2
                ,[AddressID] = @3
                ,[UpdatedDate] = getdate()
                ,[ModifiedBy] = 'sys'
            WHERE BookingRequestID = @bookingRequestID

            UPDATE Booking SET
                PreNotesToClient = @4
                ,PreNotesToSelf = @5
                ,PostNotesToClient = @6
                ,PostNotesToSelf = @7
                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
            WHERE BookingID = @bookingID

            -- Update customer user profile to be a customer (if is not still, maybe is only provider)
            UPDATE Users SET IsCustomer = 1
            WHERE UserID = @0 AND IsCustomer <> 1
        ";
        #endregion

        #region Classes
        public class RestPricingEstimateDetail
        {
            public RestPricingEstimateDetail() {}

            public int PricingEstimateID = 0;
            public int EstimateRevision = 0;
            public int freelancerPricingID;
            public string freelancerPricingDataInput;
            public string customerPricingDataInput;
            public decimal? hourlyPrice;
            public decimal? subtotalPrice;
            public decimal? feePrice;
            public decimal? totalPrice;
            public decimal? serviceDurationHours;
            public decimal? firstSessionDurationHours;
            public int PricingGroupID;
            public DateTime createdDate;
            public DateTime updatedDate;
        }
        public class RestPricingEstimate
        {
            public RestPricingEstimate() {}

            public int pricingEstimateID;
            public int pricingEstimateRevision;
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

            public IEnumerable<RestPricingEstimateDetail> details;
        }
        public class RestBookingRequest
        {
            public RestBookingRequest() {}

            public int bookingRequestID;
            public int bookingTypeID;
            public int customerUserID;
            public int freelancerUserID;
            public int jobTitleID;
            public int pricingEstimateID;
            public int bookingRequestStatusID;
            public string specialRequests;
            public DateTime createdDate;
            public DateTime updatedDate;
            public int? preferredDateID;
            public int? alternativeDate1ID;
            public int? alternativeDate2ID;
            public int? addressID;
            public int cancellationPolicyID;
            public bool instantBooking;

            public RestPricingEstimate pricingEstimate;
        }
        public class RestBooking
        {
            public RestBooking() { }

            public int bookingID;
            public int bookingRequestID;
            public int? confirmedDateID;
            public decimal? totalPricePaidByCustomer;
            public decimal? totalServiceFeesPaidByCustomer;
            public decimal? totalPaidToFreelancer;
            public decimal? totalServiceFeesPaidByFreelancer;
            public DateTime createdDate;
            public DateTime updatedDate;
            public int bookingStatusID;
            public bool pricingAdjustmentApplied;
            public string preNotesToClient;
            public string preNotesToSelf;
            public string postNotesToClient;
            public string postNotesToSelf;

            public bool reviewedByFreelancer;
            public bool reviewedByCustomer;

            public RestBookingRequest bookingRequest;
        }
        #endregion

        private static RestBooking CreateRestBookingObject(dynamic booking, Database db, int forUserID = 0)
        {
            if (booking == null) return null;

            var detailsData = (IEnumerable<dynamic>)db.Query(sqlRestGetPricingEstimateDetail, booking.PricingEstimateID, booking.PricingEstimateRevision);
            var details = detailsData.Select(detail => {
                return new RestPricingEstimateDetail {
                    PricingEstimateID = booking.PricingEstimateID,
                    EstimateRevision = booking.PricingEstimateRevision,
                    freelancerPricingID = detail.ProviderPackageID,
                    freelancerPricingDataInput = detail.ProviderPricingDataInput,
                    customerPricingDataInput = detail.customerPricingDataInput,
                    hourlyPrice = detail.HourlyPrice,
                    subtotalPrice = detail.SubtotalPrice,
                    feePrice = detail.FeePrice,
                    totalPrice = detail.TotalPrice,
                    serviceDurationHours = detail.ServiceDuration,
                    firstSessionDurationHours = detail.FirstSessionDuration,
                    createdDate = detail.createdDate,
                    updatedDate = detail.updatedDate
                };
            }).ToList();

            return new RestBooking
            {
                bookingID = booking.BookingID,
                bookingRequestID = booking.BookingRequestID,
                confirmedDateID = booking.ConfirmedDateID,
                totalPricePaidByCustomer = booking.TotalPricePaidByCustomer,
                totalServiceFeesPaidByCustomer = booking.TotalServiceFeesPaidByCustomer,
                totalPaidToFreelancer = booking.TotalPaidToProvider,
                totalServiceFeesPaidByFreelancer = booking.TotalServiceFeesPaidByProvider,
                createdDate = booking.CreatedDate,
                updatedDate = booking.UpdatedDate,
                bookingStatusID = booking.BookingStatusID,
                pricingAdjustmentApplied = booking.PricingAdjustmentApplied,

                preNotesToClient = booking.PreNotesToClient,
                preNotesToSelf = (forUserID > 0 && forUserID == booking.ProviderUserID ? booking.PreNotesToSelf : ""),
                postNotesToClient = booking.PostNotesToClient,
                postNotesToSelf = (forUserID > 0 && forUserID == booking.ProviderUserID ? booking.PostNotesToSelf : ""),

                reviewedByFreelancer = booking.ReviewedByProvider,
                reviewedByCustomer = booking.ReviewedByCustomer,

                bookingRequest = new RestBookingRequest
                {
                    bookingRequestID = booking.BookingRequestID,
                    bookingTypeID = booking.BookingTypeID,
                    customerUserID = booking.CustomerUserID,
                    freelancerUserID = booking.ProviderUserID,
                    jobTitleID = booking.PositionID,
                    pricingEstimateID = booking.PricingEstimateID,
                    bookingRequestStatusID = booking.BookingRequestStatusID,
                    specialRequests = booking.SpecialRequests,
                    createdDate = booking.RCreatedDate,
                    updatedDate = booking.RUpdatedDate,
                    preferredDateID = booking.PreferredDateID,
                    alternativeDate1ID = booking.AlternativeDate1ID,
                    alternativeDate2ID = booking.AlternativeDate2ID,
                    addressID = booking.AddressID,
                    cancellationPolicyID = booking.CancellationPolicyID,
                    instantBooking = booking.InstantBooking,

                    pricingEstimate = new RestPricingEstimate
                    {
                        pricingEstimateID = booking.PricingEstimateID,
                        pricingEstimateRevision = booking.PricingEstimateRevision,
                        serviceDurationHours = booking.ServiceDuration,
                        firstSessionDurationHours = booking.FirstSessionDuration,
                        subtotalPrice = booking.SubtotalPrice,
                        feePrice = booking.FeePrice,
                        totalPrice = booking.TotalPrice,
                        pFeePrice = booking.PFeePrice,
                        createdDate = booking.PrCreatedDate,
                        updatedDate = booking.PrUpdatedDate,
                        subtotalRefunded = booking.SubtotalRefunded,
                        feeRefunded = booking.FeeRefunded,
                        totalRefunded = booking.TotalRefunded,
                        dateRefunded = booking.DateRefunded,

                        details = details
                    }
                }
            };
        }
        public static RestBooking GetRestBooking(int BookingID, int UserID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return CreateRestBookingObject(db.QuerySingle(sqlRestSelectBooking + @"
                    WHERE B.BookingID = @0
                        AND (R.CustomerUserID = @1 OR R.ProviderUserID = @1)
                ", BookingID, UserID), db, UserID);
            }
        }
        public static IEnumerable<RestBooking> GetRestBookings(int UserID, DateTime StartTime, DateTime EndTime)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlRestSelectBooking + @"
                    WHERE 
                        (R.CustomerUserID = @0 OR R.ProviderUserID = @0)
                         AND
                        E.EndTime > @1
                         AND
                        E.StartTime < @2
                ", UserID, StartTime, EndTime).Select<dynamic, RestBooking>(booking => {
                     return CreateRestBookingObject(booking, db, UserID);
                }).ToList();
            }
        }

        /// <summary>
        /// TODO Incomplete attempt to create a full featured booking creation.
        /// Not as the simplified, this must be care of all the package/pricing specific rules, fees (even if zero sometimes).
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static dynamic InsRestProviderBooking(RestBooking booking)
        {
            // TODO save pricingEstimate

            using (var db = Database.Open("sqlloco"))
            {
                var ids = db.QuerySingle(sqlRestInsProviderBooking,
                    booking.bookingRequest.customerUserID,
                    booking.bookingRequest.freelancerUserID,
                    booking.bookingRequest.jobTitleID,
                    booking.bookingRequest.bookingTypeID, //TODO new booking Type ID fixed for Provider/REST creation?
                    booking.bookingRequest.pricingEstimateID,
                    booking.bookingRequest.addressID,
                    booking.bookingRequest.cancellationPolicyID,
                    booking.confirmedDateID
                );

                return ids;
            }
        }

        #region Simplified Provider Booking (App)
        public static int InsSimplifiedProviderBooking(
            int providerUserID,
            int customerUserID,
            int addressID,
            DateTime startTime,
            IEnumerable<int> services,
            string preNotesToClient,
            string preNotesToSelf
        )
        {
            using (var db = Database.Open("sqlloco"))
            {
                // 0: previous data and checks
                var provider = LcData.UserInfo.GetUserRowWithContactData(providerUserID);
                var customer = LcData.UserInfo.GetUserRow(customerUserID);

                if (provider == null)
                    throw new ConstraintException("Impossible to retrieve the provider information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the customer information. It exists?");
                if (services == null)
                    throw new ConstraintException("Create a booking require select almost one service");

                // 1º: calculating pricing and timing by checing services included
                var pricingCalculations = CalculateSimplifiedBookingPricing(services, providerUserID, db);
                var totalPrice = pricingCalculations.totalPrice;
                var totalDuration = pricingCalculations.totalDuration;
                var servicesData = pricingCalculations.servicesData;
                var positionID = pricingCalculations.positionID;

                // 1-after Checks:
                var position = LcData.UserInfo.GetUserPos(providerUserID, positionID);
                if (position == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // 2º: Creating event for the start date and calculated duration, checking availability
                var endTime = startTime.AddMinutes((double)totalDuration);
                var isAvailable = LcCalendar.CheckUserAvailability(providerUserID, startTime, endTime);
                if (!isAvailable)
                    throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");

                // Event data
                var timeZone = db.QueryValue(LcData.Address.sqlGetTimeZoneByPostalCodeID, provider.postalCodeID);
                string eventSummary = String.Format("{0} services for {1}", position.PositionSingular, ASP.LcHelpers.GetUserDisplayName(customer));

                // Transaction begins
                db.Execute("BEGIN TRANSACTION");

                var bookingDateID = (int)db.QueryValue(LcCalendar.sqlInsBookingEvent, providerUserID, 2 /* availability: busy */,
                    eventSummary, // summary
                    "", // initial empty description (current tools to generate it require the booking to exists in database)
                    startTime,
                    endTime,
                    timeZone
                );

                // 3º: Creating the pricing estimate records (summary and details) with the provided and calculated data
                var pricingEstimateID = SetPricingEstimate(0, pricingCalculations.totalDurationInHours, totalPrice, servicesData, db);

                // 4º: creating booking request and booking records
                var ids = db.QuerySingle(sqlRestInsProviderBooking,
                    customerUserID,
                    providerUserID,
                    positionID,
                    8, // Booking type for 'scheduling provider booking', no payment processing, no fees
                    // TODO: update the type, and all calculations, when implementing payment on the App
                    pricingEstimateID,
                    addressID,
                    LcData.Booking.GetProviderCancellationPolicyID(providerUserID, positionID, db),
                    bookingDateID,
                    preNotesToClient,
                    preNotesToSelf
                );

                // Persisting all or nothing:
                db.Execute("COMMIT TRANSACTION");

                // LAST: latest steps, optional or delayed for some reason
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    var description = LcData.Booking.GetBookingEventDescription(ids.BookingID);
                    var location = LcData.Booking.GetBookingLocationAsOneLineText(ids.BookingID);
                    db.Execute(@"
                            UPDATE  CalendarEvents
                            SET     Description = @1,
                                    Location = @2
                            WHERE   Id = @0
                        ", bookingDateID, description, location);
                }
                catch { }

                return ids.BookingID;
            }
        }

        /// <summary>
        /// It updates a booking created by a provider in the simplified way
        /// for use in the REST API from an App.
        /// It returns true if gets updated, false if the ID doesn't exists
        /// and throw exceptions on errors.
        /// </summary>
        /// <param name="bookingID"></param>
        /// <param name="providerUserID"></param>
        /// <param name="customerUserID"></param>
        /// <param name="addressID"></param>
        /// <param name="startTime"></param>
        /// <param name="services"></param>
        /// <param name="preNotesToClient"></param>
        /// <param name="preNotesToSelf"></param>
        /// <param name="postNotesToClient"></param>
        /// <param name="postNotesToSelf"></param>
        /// <returns></returns>
        public static bool UpdSimplifiedProviderBooking(
            int bookingID,
            int providerUserID,
            int customerUserID,
            int addressID,
            DateTime startTime,
            IEnumerable<int> services,
            string preNotesToClient,
            string preNotesToSelf,
            string postNotesToClient,
            string postNotesToSelf
        )
        {
            using (var db = Database.Open("sqlloco"))
            {
                // 0: previous data and checks
                var booking = GetRestBooking(bookingID, providerUserID);
                if (booking == null)
                    return false;

                var provider = LcData.UserInfo.GetUserRowWithContactData(providerUserID);
                var customer = LcData.UserInfo.GetUserRow(customerUserID);

                if (booking.bookingRequest.freelancerUserID != providerUserID)
                    throw new ConstraintException("Forbidden. Attempt to edit the booking of another provider");
                if (provider == null)
                    throw new ConstraintException("Impossible to retrieve the provider information. It exists?");
                if (customer == null)
                    throw new ConstraintException("Impossible to retrieve the customer information. It exists?");

                // 1º: calculating pricing and timing by checing services included
                var pricingCalculations = CalculateSimplifiedBookingPricing(services, providerUserID, db);
                var totalPrice = pricingCalculations.totalPrice;
                var totalDuration = pricingCalculations.totalDuration;
                var servicesData = pricingCalculations.servicesData;
                var positionID = pricingCalculations.positionID;

                // 1-after Checks:
                var position = LcData.UserInfo.GetUserPos(providerUserID, positionID);
                if (position == null)
                    throw new ConstraintException("Impossible to create a booking for that Job Title.");

                // 2º: Dates update? Checking availability and updating event dates if changed
                var endTime = startTime.AddMinutes((double)totalDuration);
                // Only if dates changed:
                var eventInfo = GetBasicEventInfo(booking.confirmedDateID.Value, db);
                if (eventInfo.StartTime != startTime && eventInfo.EndTime != endTime)
                {
                    if (!DoubleCheckEventAvailability(booking.confirmedDateID.Value, startTime, endTime))
                        throw new ConstraintException("The choosen time is not available, it conflicts with a recent appointment!");

                    // Transaction begins
                    db.Execute("BEGIN TRANSACTION");

                    // Update event
                    db.Execute(LcCalendar.sqlUpdBookingEvent, booking.confirmedDateID, startTime, endTime, null, null, null);
                }
                else
                {
                    // Transaction begins
                    db.Execute("BEGIN TRANSACTION");
                }

                // 3º: Updating pricing estimate records
                SetPricingEstimate(booking.bookingRequest.pricingEstimateID, pricingCalculations.totalDurationInHours, totalPrice, servicesData, db);

                // 4º: Updating booking request and booking records
                db.Execute(sqlRestUpdProviderBooking, bookingID, customerUserID, positionID, addressID,
                    preNotesToClient, preNotesToSelf,
                    postNotesToClient, postNotesToSelf);

                // Persist all or nothing:
                db.Execute("COMMIT TRANSACTION");

                // LAST: latest steps, optional or delayed for some reason
                // Update the CalendarEvent to include contact data,
                // but this is not so important as the rest because of that it goes
                // inside a try-catch, it doesn't matter if fails, is just a commodity
                // (customer and provider can access contact data from the booking).
                try
                {
                    string eventSummary = String.Format("{0} services for {1}", position.PositionSingular, ASP.LcHelpers.GetUserDisplayName(customer));
                    var description = LcData.Booking.GetBookingEventDescription(bookingID);
                    var location = LcData.Booking.GetBookingLocationAsOneLineText(bookingID);
                    db.Execute(@"
                            UPDATE  CalendarEvents
                            SET     Description = @1,
                                    Location = @2,
                                    Summary = @3
                            WHERE   Id = @0
                        ", booking.confirmedDateID, description, location, eventSummary);
                }
                catch { }
            }

            return true;
        }
        private static dynamic CalculateSimplifiedBookingPricing(IEnumerable<int> services, int providerUserID, Database db)
        {
            decimal totalPrice = 0,
                totalDuration = 0;
            var servicesData = new Dictionary<int, dynamic>();
            int positionID = 0;

            foreach (var serviceID in services)
            {
                var pricing = db.QuerySingle(@"
                    SELECT ProviderPackagePrice As Price,
                            ProviderPackageServiceDuration As Duration,
                            PositionID
                    FROM ProviderPackage
                    WHERE ProviderUserID = @0
                            AND ProviderPackageID = @1
                ", providerUserID, serviceID);

                if (pricing == null)
                    throw new ConstraintException("Impossible to retrieve information for the ServiceID: " + serviceID);

                // Get and double check position
                if (positionID == 0)
                {
                    positionID = pricing.PositionID;
                }
                else if (positionID != pricing.PositionID)
                {
                    // All services must be part of the same position
                    throw new ConstraintException("All choosen services must belong to the same Job Title");
                }

                totalPrice += (pricing.Price ?? 0);
                // In minutes:
                totalDuration += (pricing.Duration ?? 0);
                servicesData[serviceID] = new
                {
                    Price = pricing.Price ?? 0,
                    Duration = pricing.Duration ?? 0,
                    DurationHours = Math.Round((decimal)(pricing.Duration ?? 0) / 60, 2)
                };
            }

            return new {
                totalPrice = totalPrice,
                totalDuration = totalDuration,
                totalDurationInHours = Math.Round(totalDuration / 60, 2),
                servicesData = servicesData,
                positionID = positionID
            };
        }

        /// <summary>
        /// Create or update a Pricing Estimate, generating a new revision for each update (new records but sharing
        /// pricingEstimateID --the given one-- and increasing the revision).
        /// If the given pricingEstimateID is zero, a new pricing is created. At any time, the returned
        /// data is the pricingEstimateID (auto created or the same provided on updates).
        /// </summary>
        /// <param name="pricingEstimateID"></param>
        /// <param name="totalDuration"></param>
        /// <param name="totalPrice"></param>
        /// <param name="servicesData"></param>
        /// <param name="db"></param>
        /// <returns></returns>
        private static int SetPricingEstimate(int pricingEstimateID, decimal totalDurationHours, decimal totalPrice, Dictionary<int, dynamic> servicesData, Database db)
        {
            var pricingIDs = db.QuerySingle(@"
                DECLARE @id int
                DECLARE @revision int

                -- estimate ID by param, 0 for new, any other to create a new pricing revision for that existing one
                SET @id = @0
                    
                -- Getting the ID and Revision
                IF @id = 0 BEGIN
                    -- new id
                    SELECT @id = MAX(PricingEstimateID) + 1 FROM PricingEstimate WITH (UPDLOCK, HOLDLOCK)
                    -- first revision
                    SET @revision = 1
                END ELSE BEGIN
                    -- use updated id and get new revision
                    SELECT @revision = MAX(PricingEstimateRevision) + 1 FROM PricingEstimate WITH (UPDLOCK, HOLDLOCK)
                    WHERE PricingEstimateID = @id
                END

                -- Creating record
                INSERT INTO PricingEstimate (
                    PricingEstimateID,
                    PricingEstimateRevision,
                    ServiceDuration,
                    FirstSessionDuration,
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
                    @1, -- first session duration
                    @2, -- subtotal price
                    0, -- fee price
                    @2, -- total price
                    0, -- pfee price
                    getdate(), getdate(), 'sys', 1
                )

                SELECT @id As PricingEstimateID, @revision As PricingEstimateRevision
            ", pricingEstimateID, totalDurationHours, totalPrice);
            pricingEstimateID = pricingIDs.PricingEstimateID;
            var pricingEstimateRevision = pricingIDs.PricingEstimateRevision;

            foreach (var serviceID in servicesData.Keys)
            {
                var serviceData = servicesData[serviceID];
                var price = serviceData.Price ?? 0;
                var duration = serviceData.DurationHours ?? 0;

                db.Execute(@"
INSERT INTO PricingEstimateDetail (
PricingEstimateID,
PricingEstimateRevision,
ProviderPackageID,
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
@2, -- packageID
@3, -- subtotal
0, -- fees
@3, -- price
@4, -- duration
@4, -- first duration
getdate(), getdate(), 'sys',
0 -- unused pricing group id
)
                ", pricingEstimateID, pricingEstimateRevision, serviceID, price, duration);
            }

            return pricingEstimateID;
        }

        private static dynamic GetBasicEventInfo(int eventID, Database db)
        {
            return db.QuerySingle(@"
                 SELECT ID,
                        StartTime,
                        EndTime,
                        UserId,
                        CalendarAvailabilityTypeID
                FROM    CalendarEvents
                WHERE   ID = @0
            ", eventID);
        }

        /// <summary>
        /// Checks and returns the availability (true:available, false:not-available) for an eventID
        /// start and end time taking care to not use the event itself in the check. Optionally,
        /// different dates than the event ones can be checked out; the event dates will not be taken into consideration
        /// in this case too.
        /// Usefull to check availability on 'edit' actions, like editing a booking, so the already created event doesn't
        /// confuse the results.
        /// </summary>
        /// <param name="eventID"></param>
        /// <param name="db"></param>
        /// <param name="startTime"></param>
        /// <param name="endTime"></param>
        /// <returns></returns>
        public static bool DoubleCheckEventAvailability(int eventID, DateTime? startTime =  null, DateTime? endTime = null)
        {
            // We require an owned connection, to avoid conflict with other transactions
            using (var db = Database.Open("sqlloco"))
            {
                var dateInfo = GetBasicEventInfo(eventID, db);

                // Change the event to be 'transparent'(4) for a while to don't
                // affect the availability check.
                // And get the required information from the event to do the
                // availability check
                db.QuerySingle(@"
                UPDATE  CalendarEvents SET
                        CalendarAvailabilityTypeID = 4
                WHERE   ID = @0
                ", eventID);

                var checkStartTime = startTime ?? dateInfo.StartTime;
                var checkEndTime = endTime ?? dateInfo.EndTime;

                var isAvailable = LcCalendar.CheckUserAvailability(dateInfo.UserId, checkStartTime, checkEndTime);

                // restore event to its previous state, so gets 'untouched'
                db.Execute(@"
                UPDATE  CalendarEvents SET
                        CalendarAvailabilityTypeID = @1
                WHERE   ID = @0
                ", eventID, dateInfo.CalendarAvailabilityTypeID);

                return isAvailable;
            }
        }
        #endregion
	}
}