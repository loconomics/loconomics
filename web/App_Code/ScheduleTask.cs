using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Text;

/// <summary>
/// ScheduleTask: from cshtml page to class to be able to acces internal shared properties and methods.
/// Needs more refactor.
/// </summary>
public class ScheduleTask
{
    /// <summary>
    /// Runs all tasks if the conditions for each are met.
    /// </summary>
    /// <returns>Logged string</returns>
    public static string Run()
    {
        var logger = new LcLogger("ScheduledTask");
        var elapsedTime = DateTime.Now;

        /*
         * Bookings
         */

        int messages = 0, items = 0;
        int totalmessages = 0, totalitems = 0;

        var sqlAddBookingMessagingLog = "UPDATE Booking SET MessagingLog = coalesce(MessagingLog, '') + @1 WHERE BookingID=@0";

        using (var db = Database.Open("sqlloco"))
        {
            /*
             * Check:: Booking timed out
             * If:: A not complete booking request exist without changes from more than 1 day
             * Action:: Invalidate the booking tentative events
             */
            messages = 0;
            items = 0;
            foreach (var b in LcRest.Booking.QueryIncomplete2TimedoutBookings(db))
            {
                try
                {
                    LcRest.Booking.SetAsTimedout(b, db);
                    items++;
                }
                catch (Exception ex)
                {
                    logger.LogEx("Booking Timed-out", ex);
                }
            }
            logger.Log("Total invalidated as TimedOut Booking: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: Booking Request expiration
             * If:: Provider didn't reply
             * If:: Request not updated/changed
             * Action:: Set as expired, un-authorize/return money to customer, notify
             */
            messages = 0;
            items = 0;
            foreach (var b in LcRest.Booking.QueryRequest2ExpiredBookings(db))
            {
                try
                {
                    // RequestStatusID:6:expired
                    var result = LcData.Booking.InvalidateBookingRequest(b.bookingID, (int)LcEnum.BookingStatus.requestExpired);
                    if (result.Error == 0)
                    {
                        // Send message
                        LcMessaging.SendBookingRequestInvalidation(b.bookingID, 1, 19);

                        // Update MessagingLog for the booking request
                        db.Execute(sqlAddBookingMessagingLog, b.bookingID, "[Booking Request Expiration]");
                    }

                    items++;
                    messages += 2;
                }
                catch (Exception ex)
                {
                    logger.LogEx("Requests Expired", ex);
                }
            }
            logger.Log("Total invalidated as Expired Booking Requests: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: [24H Service Reminder] Booking will be on 24Hours
             * If:: Confirmated bookings not cancelled
             * If:: Current time is 24 hours before Confirmed Service StarTime
             * Action:: send a booking reminder email
             */
            messages = 0;
            items = 0;
            foreach (var b in db.Query(@"
                SELECT  BookingID
                FROM    Booking As B
                         INNER JOIN
                        CalendarEvents As E
                          ON B.ServiceDateID = E.Id
                WHERE   BookingStatusID = @0
                         AND
                        -- at 24 hours before service starts (between 25 and 24 hours)
                        getdate() > dateadd(hh, -25, E.StartTime)
                         AND
                        getdate() <= dateadd(hh, -24, E.StartTime)
                         AND
                        B.MessagingLog not like '%[24H Service Reminder]%'
            ", (int)LcEnum.BookingStatus.confirmed))
            {
                try
                {
                    // Send message
                    LcMessaging.SendBookingUpdate(b.BookingID, 's', 'b', "service");

                    // Update MessagingLog for the booking
                    db.Execute(sqlAddBookingMessagingLog, b.BookingID, "[24H Service Reminder]");

                    items++;
                    messages += 2;
                }
                catch (Exception ex)
                {
                    logger.LogEx("Booking 24H Reminders", ex);
                }
            }
            logger.Log("Total of Booking 24H Reminders: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: [8AM Review Reminder] Booking Review Reminder Next day after service at 8AM
             * If:: Confirmed bookings not cancelled
             * If:: User did not the review still
             * If:: Current time is 8AM on the day after the Confirmed Service EndTime
             * Action:: send a booking review reminder email
             */
            messages = 0;
            items = 0;
            var confirmedPerformedCompletedStatuses = String.Join(",", new List<int> { (int)LcEnum.BookingStatus.confirmed, (int)LcEnum.BookingStatus.servicePerformed, (int)LcEnum.BookingStatus.completed });
            foreach (var b in db.Query(@"
                SELECT  B.BookingID,
                        CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URP
                            WHERE URP.BookingID = B.BookingID
                                AND
                                URP.ProviderUserID = B.ServiceProfessionalUserID
                                AND 
                                URP.PositionID = 0
                        ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByProvider,
                        CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URC
                            WHERE URC.BookingID = B.BookingID
                                AND
                                URC.CustomerUserID = B.ClientUserID
                                AND 
                                URC.PositionID = B.JobTitleID
                        ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByCustomer
                FROM    Booking As B
                         INNER JOIN
                        CalendarEvents As E
                          ON B.ServiceDateID = E.Id
                WHERE   B.BookingStatusID  IN (" + String.Join(",", new List<int> { (int)LcEnum.BookingStatus.confirmed, (int)LcEnum.BookingStatus.servicePerformed, (int)LcEnum.BookingStatus.completed }) + @")
                         AND
                        -- at 8AM hours
                        datepart(hh, getdate()) = 8
                         AND
                        -- of the day after the service
                        Cast(dateadd(d, -1, getdate()) As Date) = Cast(E.EndTime As Date)
                         AND
                        B.MessagingLog not like '%[8AM Review Reminder]%'
            "))
            {
                try
                {
                    // We need check that there was not reviews already (why send a reminder for something
                    // already done? just we avoid that!).
                    // If both users did its reviews, nothing to send
                    if (b.ReviewedByProvider && b.ReviewedByCustomer)
                    {
                        // Next booking
                        continue;
                    }
                    char messageFor =
                        b.ReviewedByProvider ? 'c' :
                        b.ReviewedByCustomer ? 'p' :
                        'b';

                    // Send message
                    LcMessaging.SendBookingUpdate(b.BookingID, 's', messageFor, "review-firstreminder");

                    // Update MessagingLog for the booking
                    db.Execute(sqlAddBookingMessagingLog, b.BookingID, "[8AM Review Reminder]");

                    items++;
                    if (messageFor == 'c' || messageFor == 'p')
                    {
                        messages++;
                    }
                    else
                    {
                        messages += 2;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogEx("Booking Review Reminders Next 8AM", ex);
                }
            }
            logger.Log("Total of Booking Review Reminders Next 8AM: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: [1W Review Reminder] Booking Review Reminder 1Week after service
             * If:: Confirmed bookings not cancelled, non stoped manully, maybe is set as performed already
             * If:: User did not the review still
             * If:: Past 1 Week from service
             * Action:: send a booking review reminder email
             */
            messages = 0;
            items = 0;
            foreach (var b in db.Query(@"
                SELECT  B.BookingID,
                        CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URP
                            WHERE URP.BookingID = B.BookingID
                                AND
                                URP.ProviderUserID = B.ServiceProfessionalUserID
                                AND 
                                URP.PositionID = 0
                        ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByProvider,
                        CAST(CASE WHEN (SELECT count(*) FROM UserReviews As URC
                            WHERE URC.BookingID = B.BookingID
                                AND
                                URC.CustomerUserID = B.ClientUserID
                                AND 
                                URC.PositionID = B.JobTitleID
                        ) = 0 THEN 0 ELSE 1 END As bit) As ReviewedByCustomer
                FROM    Booking As B
                         INNER JOIN
                        CalendarEvents As E
                          ON B.ServiceDateID = E.Id
                WHERE   B.BookingStatusID IN (" +
                        String.Join(",", new List<int> { (int)LcEnum.BookingStatus.confirmed, (int)LcEnum.BookingStatus.servicePerformed, (int)LcEnum.BookingStatus.completed }) + @")
                         AND
                        -- at 1 Week=168 hours, after service ended (between 168 and 175 hours -6 hours of margin-)
                        getdate() >= dateadd(hh, 168, E.EndTime)
                         AND
                        getdate() < dateadd(hh, 175, E.EndTime)
                         AND
                        B.MessagingLog not like '%[1W Review Reminder]%'
            "))
            {
                try
                {
                    // We need check that there was not reviews already (why send a reminder for something
                    // already done? just we avoid that!).
                    // If both users did its reviews, nothing to send
                    if (b.ReviewedByProvider && b.ReviewedByCustomer)
                    {
                        // Next booking
                        continue;
                    }
                    char messageFor =
                        b.ReviewedByProvider ? 'c' :
                        b.ReviewedByCustomer ? 'p' :
                        'b';

                    // Send message
                    LcMessaging.SendBookingUpdate(b.BookingID, 's', messageFor, "review");

                    // Update MessagingLog for the booking
                    db.Execute(sqlAddBookingMessagingLog, b.BookingID, "[1W Review Reminder]");

                    items++;
                    if (messageFor == 'c' || messageFor == 'p')
                    {
                        messages++;
                    }
                    else
                    {
                        messages += 2;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogEx("Booking Review Reminders 1W", ex);
                }
            }
            logger.Log("Total of Booking Review Reminders 1W: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: Service Performed: 48H passed from Service
             * If:: Confirmated bookings only, not cancelled, not set as performed, complete or dispute
             * If:: Current time is 48 hours after Confirmed Service EndTime
             * Action:: set booking status as 'service-performed'
             */
            messages = 0;
            items = 0;
            {
                foreach (var b in LcRest.Booking.QueryConfirmed2ServicePerformedBookings(db))
                {
                    try
                    {

                        // Set as servicePerformed
                        b.bookingStatusID = (int)LcEnum.BookingStatus.servicePerformed;
                        LcRest.Booking.SetStatus(b, db);

                        // Send messages

                        // Notify customer and provider with an updated booking details:
                        LcMessaging.SendBookingUpdate(b.bookingID, 's', 'b', null, 20);

                        // Update MessagingLog for the booking
                        db.Execute(sqlAddBookingMessagingLog, b.bookingID, "[48H Service Performed]");

                        items++;
                        // Before Marketplace: messages += 3;
                        messages += 2;
                    }
                    catch (Exception ex)
                    {
                        logger.LogEx("Booking 48H Service Performed", ex);
                    }
                }
            }
            logger.Log("Total of Booking 48H Service Performed: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: Release Payment for New Providers: 5 full days after the service is performed
             * If:: If provider is a new provider (it has not previous completed bookings)
             * If:: Performed bookings only, without pricing adjustment
             * If:: Current time is 5 days after Confirmed Service EndTime
             * Action:: set booking status as 'performed without pricing adjustment',
             *          send a message to the provider notifying that payment is released.
             */
            messages = 0;
            items = 0;
            {
                foreach (var b in LcRest.Booking.QueryPendingOfPaymentReleaseBookings(true, db))
                {
                    try
                    {
                        // Release the payment
                        try
                        {
                            if (b.ReleasePayment())
                            {
                                items++;

                                // Send messages

                                // Notify customer and provider with an updated booking details:
                                LcMessaging.SendBookingUpdate(b.bookingID, 's', 'b', null, 21);

                                // Update MessagingLog for the booking
                                db.Execute(sqlAddBookingMessagingLog, b.bookingID, "[Release Payment 120H New Provider]");

                                messages += 2;
                            }
                        }
                        catch (Exception ex)
                        {

                            var errTitle = "Booking Release Payment after 120H for new providers";
                            var errDesc = String.Format(
                                "BookingID: {0}, TransactionID: {1}. Not payed on [Release Payment 120H New Provider], error on Braintree 'release transaction from escrow': {2}",
                                b.bookingID,
                                b.paymentTransactionID,
                                ex.Message
                            );

                            LcMessaging.NotifyError(errTitle, "/ScheduleTask", errDesc);

                            logger.Log("Error on: " + errTitle + "; " + errDesc);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogEx("Booking Release Payment after 120H for new providers", ex);
                    }
                }
            }
            logger.Log("Total of Booking Release Payment after 120H for new providers: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;


            /*
             * Check:: Release Payment for Service Complete: 1 day after the service is performed
             * If:: Provider has already completed bookings (is not a new provider)
             * If:: Performed bookings only, without pricing adjustment
             * If:: Current time is 5 days after Confirmed Service EndTime
             * Action:: set booking status as 'performed without pricing adjustment',
             *          send a message to the provider notifying that payment is released.
             */
            messages = 0;
            items = 0;
            {
                foreach (var b in LcRest.Booking.QueryPendingOfPaymentReleaseBookings(false, db))
                {
                    try
                    {
                        // Release the payment
                        try
                        {
                            if (b.ReleasePayment())
                            {
                                items++;

                                // Send messages

                                // Notify customer and provider with an updated booking details:
                                LcMessaging.SendBookingUpdate(b.bookingID, 's', 'b', null, 21);

                                // Update MessagingLog for the booking
                                db.Execute(sqlAddBookingMessagingLog, b.bookingID, "[Release Payment 24H]");

                                messages += 2;
                            }
                        }
                        catch (Exception ex)
                        {

                            var errTitle = "Booking Release Payment after 120H for new providers";
                            var errDesc = String.Format(
                                "BookingID: {0}, TransactionID: {1}. Not payed on [Release Payment 24H], error on Braintree 'release transaction from escrow': {2}",
                                b.bookingID,
                                b.paymentTransactionID,
                                ex.Message
                            );

                            LcMessaging.NotifyError(errTitle, "/ScheduleTask", errDesc);

                            logger.Log("Error on: " + errTitle + "; " + errDesc);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogEx("Booking Release Payment 24H", ex);
                    }
                }
            }
            logger.Log("Total of Booking Release Payment after 24H: {0}, messages sent: {1}", items, messages);
            totalitems += items;
            totalmessages += messages;

            /*
             * Check:: Authorize postponed transactions 48hours previous to service start-time
             * If:: Confirmated or performed bookings only, not cancelled or in dispute or completed (completed may be
             * and old booking already paid
             * If:: Current time is 48 hours before Confirmed Service StartTime
             * If:: BookingRequest PaymentTransactionID is a Card token rather than an actual TransactionID
             * If:: Customer was still not charged / transaction was not submitted for settlement ([TotalPricePaidByCustomer] is null)
             * Action:: authorize booking transaction
             */
            items = 0;
            {
                foreach (var b in LcRest.Booking.QueryPostponedPaymentAuthorizations(db))
                {
                    try
                    {

                        // Create transaction authorizing charge (but actually not charging still)
                        // for saved customer credit card and update DB.
                        try
                        {
                            if (b.AuthorizeTransaction())
                            {
                                items++;
                            }
                        }
                        catch (Exception ex)
                        {

                            var errTitle = "Booking Authorize Postponed Transactions, 48h before Service Starts";
                            var errDesc = String.Format(
                                "BookingID: {0}, TransactionID: {1} Payment not allowed, error on Braintree 'sale transaction, authorizing only': {2}",
                                b.bookingID,
                                b.paymentTransactionID,
                                ex.Message
                            );

                            LcMessaging.NotifyError(errTitle, "/ScheduleTask", errDesc);

                            logger.Log("Error on: " + errTitle + "; " + errDesc);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogEx("Booking Authorize Postponed Transactions, 48h before Service Starts", ex);
                    }
                }
            }
            logger.Log("Total of Booking Authorize Postponed Transactions, 48h before Service Starts: {0}", items);
            totalitems += items;

            /*
             * Check:: Charge Customer the day of the service
             * If:: Confirmated or performed bookings only, not cancelled or in dispute or completed (completed may be
             * and old booking already paid
             * If:: Current time is the 1 hour after the End Service, or later
             * If:: Customer was still not charged / transaction was not submitted for settlement ([TotalPricePaidByCustomer] is null)
             * Action:: settle booking transaction
             *          set [TotalPricePaidByCustomer] and [TotalServiceFeesPaidByCustomer] values
             */
            items = 0;
            {
                // Get bookings affected by conditions

                foreach (var b in LcRest.Booking.QueryPendingOfClientChargeBookings(db))
                {
                    try
                    {

                        // Charge customer and update DB
                        try
                        {
                            if (b.SettleTransaction())
                            {
                                items++;
                            }
                        }
                        catch (Exception ex)
                        {
                            var errTitle = "Booking Charge Customer, Receive Payment";
                            var errDesc = String.Format(
                                "BookingID: {0}, TransactionID: {1} Payment not received, error on Braintree 'settle transaction': {2}",
                                b.bookingID,
                                b.paymentTransactionID,
                                ex.Message
                            );

                            LcMessaging.NotifyError(errTitle, "/ScheduleTask", errDesc);

                            logger.Log("Error on: " + errTitle + "; " + errDesc);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogEx("Booking Charge Customer, Receive Payment", ex);
                    }
                }
            }
            logger.Log("Total of Booking Charge Customer, Receive Payment: {0}", items);
            totalitems += items;

            // Ending work with database
        }

        logger.Log("Elapsed time {0}, for {1} bookings affected and {2} messages sent", DateTime.Now - elapsedTime, totalitems, totalmessages);


        /*
         * iCalendar
         */
        DateTime partialElapsedTime = DateTime.Now;

        int successCalendars = 0,
            failedCalendars = 0;

        foreach (var err in LcCalendar.BulkImport())
        {
            if (err == null)
            {
                successCalendars++;
            }
            else
            {
                failedCalendars++;
                logger.LogEx("Import Calendar", err);
            }
        }

        logger.Log("Elapsed time {0}, for {1} user calendars imported, {2} failed", DateTime.Now - partialElapsedTime, successCalendars, failedCalendars);


        /*
         * Task Ended
         */
        logger.Log("Total Elapsed time {0}", DateTime.Now - elapsedTime);

        string logresult = logger.ToString();
        // Finishing: save log on disk, per month rotation
        //try {
        logger.Save();
        //}catch { }

        return logresult;
    }
}