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
        private const string sqlRestInsProviderBooking = @"
            DECLARE @BookingRequestID int

            INSERT INTO BookingRequest (
                [CustomerUserID]
                ,[ProviderUserID]
                ,[PositionID]
                ,[BookingTypeID]
                ,[PricingSummaryID]
                ,[PricingSummaryRevision]
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
                @5, -- revision
                @6, -- address
                7, -- status: confirmed
                @7, -- cancellation
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
                @8, -- date
                1, -- status: confirmed
                getdate(), getdate(), 'sys',
                @9, @10 -- notes to client and self
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

        #region Simplified Provider Booking (App)
        /// <summary>
        /// 
        /// </summary>
        /// <param name="providerUserID"></param>
        /// <param name="customerUserID"></param>
        /// <param name="addressID"></param>
        /// <param name="startTime"></param>
        /// <param name="services"></param>
        /// <param name="preNotesToClient"></param>
        /// <param name="preNotesToSelf"></param>
        /// <param name="allowBookUnavailableTime">This value allows (when true) to avoid the check of availability
        /// for the given time, letting the freelancer to book any time even if unavailable (this must be asked
        /// and warned in the UI).</param>
        /// <returns></returns>
        public static int InsSimplifiedProviderBooking(
            int providerUserID,
            int customerUserID,
            int addressID,
            DateTime startTime,
            IEnumerable<int> services,
            string preNotesToClient,
            string preNotesToSelf,
            bool allowBookUnavailableTime
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
                // Because this API is only for providers, we avoid the advance time from the checking
                var isAvailable = allowBookUnavailableTime || LcCalendar.CheckUserAvailability(providerUserID, startTime, endTime, true);
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
                LcRest.PricingSummary summary = LcRest.PricingSummary.SetForServiceProfessionalBooking(0, (decimal)pricingCalculations.totalDurationInHours, (decimal)totalPrice, servicesData, db);

                // 4º: creating booking request and booking records
                var ids = db.QuerySingle(sqlRestInsProviderBooking,
                    customerUserID,
                    providerUserID,
                    positionID,
                    LcEnum.BookingType.serviceProfessionalBooking,
                    // TODO: review all calculations, when implementing payment and client booking
                    summary.pricingSummaryID,
                    summary.pricingSummaryRevision,
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
        /// <param name="allowBookUnavailableTime">This value allows (when true) to avoid the check of availability
        /// for the given time, letting the freelancer to book any time even if unavailable (this must be asked
        /// and warned in the UI).</param>
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
            string postNotesToSelf,
            bool allowBookUnavailableTime
        )
        {
            using (var db = Database.Open("sqlloco"))
            {
                // 0: previous data and checks
                var booking = LcRest.Booking.Get(bookingID, false, providerUserID);
                if (booking == null)
                    return false;

                var provider = LcData.UserInfo.GetUserRowWithContactData(providerUserID);
                var customer = LcData.UserInfo.GetUserRow(customerUserID);

                if (booking.serviceProfessionalUserID != providerUserID)
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
                var eventInfo = LcCalendar.GetBasicEventInfo(booking.serviceDateID.Value, db);
                if (eventInfo.StartTime != startTime && eventInfo.EndTime != endTime)
                {
                    // Because this API is only for providers, we avoid the advance time from the checking
                    if (!allowBookUnavailableTime && !LcCalendar.DoubleCheckEventAvailability(booking.serviceDateID.Value, startTime, endTime, true))
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
                LcRest.PricingSummary.SetForServiceProfessionalBooking(booking.pricingSummaryID, pricingCalculations.totalDurationInHours, totalPrice, servicesData, db);

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
                        ", booking.serviceDateID, description, location, eventSummary);
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

            foreach (var service in LcRest.ServiceProfessionalService.GetListByIds(providerUserID, services))
            {
                totalPrice += (service.price ?? 0);
                // In minutes:
                totalDuration += (service.serviceDurationMinutes);
                servicesData[service.serviceProfessionalServiceID] = new
                {
                    Price = service.price ?? 0,
                    Duration = service.serviceDurationMinutes,
                    DurationHours = Math.Round((decimal)service.serviceDurationMinutes / 60, 2)
                };
            }

            return new {
                totalPrice = totalPrice,
                totalDuration = totalDuration,
                totalDurationInHours = Math.Round(totalDuration / 60, 2),
                servicesData = servicesData
            };
        }
        #endregion
	}
}