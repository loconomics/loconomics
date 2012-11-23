using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

public static partial class LcData
{
    /// <summary>
    /// Methods to get data related with Bookings
    /// </summary>
    public static class Booking
    {
        #region Query bookings
        #region SQLs
        public const string sqlGetBookingRequestPricingEstimate = @"
            SELECT  PricingEstimateID
            FROM    BookingRequest
            WHERE   BookingRequestID = @0
        ";
        public const string sqlGetPricingPackagesInPricingEstimate = @"
            SELECT  PP.ProviderPackageID
                    ,PP.ProviderPackageName As Name
                    ,PP.ProviderPackageDescription As Description

                    --,PP.ProviderPackagePrice As Price
                    --,PP.ProviderPackageServiceDuration As ServiceDuration
                    ,P.ServiceDuration
                    ,P.TotalPrice As Price

                    ,PP.FirstTimeClientsOnly
                    ,PP.NumberOfSessions
                    ,P.CustomerPricingDataInput
            FROM    PricingEstimateDetail As P
                     INNER JOIN
                    ProviderPackage As PP
                      ON PP.ProviderPackageID = P.ProviderPackageID
            WHERE   P.PricingEstimateID = @0
                        AND 
                    PP.LanguageID = @1 AND PP.CountryID = @2
        ";
        public const string sqlGetPricingOptionsInPricingEstimate = @"
            SELECT  V.CustomerPricingOptionDisplayText As Name, P.CustomerPricingDataInput As Quantity,
                    P.ServiceDuration As Time, P.TotalPrice As Price
            FROM    PricingEstimateDetail As P
                     INNER JOIN
                    PricingOption As V
                      ON V.PricingOptionID = P.PricingOptionID
            WHERE   P.PricingEstimateID = @0
                     AND V.LanguageID = @1 AND V.CountryId = @2
        ";
        public const string sqlGetPricingVarsInPricingEstimate = @"
            SELECT  V.CustomerPricingVariableDisplayText As Name, P.CustomerPricingDataInput As Quantity,
                    P.ServiceDuration As Time, P.TotalPrice As Price
            FROM    PricingEstimateDetail As P
                     INNER JOIN
                    PricingVariable As V
                      ON V.PricingVariableID = P.PricingVariableID
            WHERE   P.PricingEstimateID = @0
                     AND V.LanguageID = @1 AND V.CountryId = @2
        ";
        public const string sqlGetServicesIncludedInPricingEstimate = @"
            SELECT  S.Name
            FROM    PricingEstimateDetail As P
                     INNER JOIN
                    ServiceAttribute As S
                      ON S.ServiceAttributeID = P.ServiceAttributeID
                        -- Avoid show service attributes related to options
                        AND P.PricingOptionID = 0
            WHERE   P.PricingEstimateID = @0
                     AND S.LanguageID = @1 AND S.CountryId = @2
        ";
        #endregion

        /// <summary>
        /// Get a dynamic record with the most basic info from 
        /// a Booking: CustomerUserID, ProviderUserID, PositionID,
        /// BookingID, BookingStatusID, BookingRequestID
        /// </summary>
        /// <param name="BookingID"></param>
        /// <returns></returns>
        public static dynamic GetBookingBasicInfo(int BookingID)
        {
            var sqlGetBooking = @"
                SELECT  R.CustomerUserID, R.ProviderUserID,
                        R.PositionID, B.BookingID, B.BookingStatusID,
                        R.BookingRequestID
                FROM    Booking As B
                         INNER JOIN
                        BookingRequest As R
                          ON R.BookingRequestID = B.BookingRequestID
                WHERE   BookingID = @0
            ";
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(sqlGetBooking, BookingID);
            }
        }
        public static dynamic GetBooking(int BookingID)
        {
            var sqlGetBooking = @"
                SELECT  R.BookingRequestID,
                        B.BookingID,
                        R.ProviderUserID,
                        R.CustomerUserID,
                        R.PositionID,
                        R.PricingEstimateID,
                        R.BookingRequestStatusID,
                        B.BookingStatusID,

                        UC.FirstName As CustomerFirstName,
                        UC.LastName As CustomerLastName,

                        UP.FirstName As ProviderFirstName,
                        UP.LastName As ProviderLastName,

                        DATEADD(day, 7, E.EndTime) As PaymentDate,
                        (SELECT TOP 1 LastThreeAccountDigits FROM ProviderPaymentPreference
                         WHERE ProviderPaymentPreference.ProviderUserID = R.ProviderUserID)
                         As PaymentProviderAccountLastDigits,
                        R.PaymentLastFourCardNumberDigits As PaymentCustomerCardLastDigits,

                        E.StartTime,
                        E.EndTime,
                        E.TimeZone,
                        Pos.PositionSingular,
                        Pr.TotalPrice,
                        Pr.ServiceDuration,
                    
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
                         INNER JOIN
                        Users As UC
                          ON UC.UserID = R.CustomerUserID
                         INNER JOIN
                        Users As UP
                          ON UP.UserID = R.ProviderUserID
                         LEFT JOIN
                        CalendarEvents As E
                          ON E.Id = B.ConfirmedDateID
                         INNER JOIN
                        Positions As Pos
                          ON Pos.PositionID = R.PositionID
					        AND Pos.LanguageID = @1 AND Pos.CountryID = @2
                WHERE   B.BookingID = @0
            ";
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(sqlGetBooking, BookingID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }
        }
        public static dynamic GetBookingForUser(int BookingID, int UserID, bool IsAdmin)
        {
            var sqlGetBooking = @"
                SELECT  R.BookingRequestID,
                        B.BookingID,
                        R.ProviderUserID,
                        R.CustomerUserID,
                        R.PricingEstimateID,
                        R.SpecialRequests,
                        R.UpdatedDate,
                        R.BookingRequestStatusID,
                        B.BookingStatusID,
                        R.PositionID,

                        DATEADD(day, 7, E.EndTime) As PaymentDate,
                        (SELECT TOP 1 LastThreeAccountDigits FROM ProviderPaymentPreference
                         WHERE ProviderPaymentPreference.ProviderUserID = R.ProviderUserID)
                         As PaymentProviderAccountLastDigits,
                        R.PaymentLastFourCardNumberDigits As PaymentCustomerCardLastDigits,

                        Pos.PositionSingular,

                        L.UserID As LocationUserID,
                        LU.FirstName As LocationUserFirstName,
                        L.AddressName As LocationName,
                        L.AddressLine1, L.AddressLine2,
                        L.City,
                        SP.StateProvinceName, SP.StateProvinceCode,
                        PC.PostalCode,

                        E.StartTime As ConfirmedDateStart, E.EndTime As ConfirmedDateEnd,

                        P.ServiceDuration, P.HourlyPrice, P.SubtotalPrice, P.FeePrice, P.TotalPrice,

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
                FROM    BookingRequest As R
                         INNER JOIN
                        Booking As B
                          ON R.BookingRequestID = B.BookingRequestID
                         INNER JOIN
                        PricingEstimate As P
                          ON P.PricingEstimateID = R.PricingEstimateID
                         LEFT JOIN
                        Address As L
                          ON R.AddressID = L.AddressID
                         LEFT JOIN
                        ServiceAddress As SA
                          ON L.AddressID = SA.AddressID
                         LEFT JOIN
                        Users As LU
                          ON L.UserID = LU.UserID
                         LEFT JOIN
                        StateProvince As SP
                          ON SP.StateProvinceID = L.StateProvinceID
                         LEFT JOIN
                        PostalCode As PC
                          ON PC.PostalCodeID = L.PostalCodeID
                         LEFT JOIN
                        CalendarEvents As E
                          ON E.ID = B.ConfirmedDateID
                         INNER JOIN
                        Positions As Pos
                          ON Pos.PositionID = R.PositionID
					        AND Pos.LanguageID = @2 AND Pos.CountryID = @3
                WHERE   B.BookingID = @0
                         AND
                        (R.ProviderUserID = @1 OR R.CustomerUserID = @1 OR 1=@4)
            ";
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(sqlGetBooking, BookingID, UserID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(),
                    IsAdmin);
            }
        }
        public static dynamic GetBookingRequestForUser(int BookingRequestID, int UserID, bool IsAdmin)
        {
            var sqlGetBookingRequest = @"
                SELECT  R.BookingRequestID,
                        0 As BookingID,
                        R.ProviderUserID,
                        R.CustomerUserID,
                        R.PricingEstimateID,
                        R.SpecialRequests,
                        R.UpdatedDate,
                        R.BookingRequestStatusID,
                        R.PositionID,

                        DATEADD(day, 7, E1.EndTime) As PaymentDate,
                        (SELECT TOP 1 LastThreeAccountDigits FROM ProviderPaymentPreference
                         WHERE ProviderPaymentPreference.ProviderUserID = R.ProviderUserID)
                         As PaymentProviderAccountLastDigits,
                        R.PaymentLastFourCardNumberDigits As PaymentCustomerCardLastDigits,

                        Pos.PositionSingular,

                        L.AddressLine1, L.AddressLine2, L.City, L.PostalCodeID, L.CountryID,
                        SP.StateProvinceName, SP.StateProvinceCode,

                        E1.StartTime As PreferredDateStart, E1.EndTime As PreferredDateEnd,
                        E2.StartTime As AlternativeDate1Start, E2.EndTime As AlternativeDate1End,
                        E3.StartTime As AlternativeDate2Start, E3.EndTime As AlternativeDate2End,

                        coalesce(P.ServiceDuration, 0) As ServiceDuration,
                        coalesce(P.HourlyPrice, 0) As HourlyPrice,
                        coalesce(P.SubtotalPrice, 0) As SubtotalPrice,
                        coalesce(P.FeePrice, 0) As FeePrice,
                        coalesce(P.TotalPrice, 0) As TotalPrice
                FROM    BookingRequest As R
                         INNER JOIN
                        PricingEstimate As P
                          ON P.PricingEstimateID = R.PricingEstimateID
                         LEFT JOIN
                        Address As L
                          ON R.AddressID = L.AddressID
                        -- LEFT JOIN
                        --ServiceAddress As SA
                        --  ON L.AddressID = SA.AddressID
                         LEFT JOIN
                        CalendarEvents As E1
                          ON E1.ID = R.PreferredDateID
                         LEFT JOIN
                        CalendarEvents As E2
                          ON E2.ID = R.AlternativeDate1ID
                         LEFT JOIN
                        CalendarEvents As E3
                          ON E3.ID = R.AlternativeDate2ID
                         INNER JOIN
                        Positions As Pos
                          ON Pos.PositionID = R.PositionID
					        AND Pos.LanguageID = @2 AND Pos.CountryID = @3
                         LEFT JOIN
                        StateProvince As SP
                          ON SP.StateProvinceID = L.StateProvinceID
                WHERE   R.BookingRequestID = @0
                         AND
                        (R.ProviderUserID = @1 OR R.CustomerUserID = @1 OR 1=@4)
            ";
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(sqlGetBookingRequest, BookingRequestID, UserID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(),
                    IsAdmin);
            }
        }

        #region Pricing Summary
        public static dynamic GetPricingSummary(dynamic summaryData)
        {
            var pricingSummary = new LcPricingModel.PricingSummaryData();
            pricingSummary.ServiceDuration = summaryData.ServiceDuration;
            pricingSummary.SubtotalPrice = summaryData.SubtotalPrice;
            pricingSummary.FeePrice = summaryData.FeePrice;
            pricingSummary.TotalPrice = summaryData.TotalPrice;
            return pricingSummary;
        }
        public static dynamic GetPricingDetailsGroups(int PricingEstimateID)
        {
            var sql = @"
                SELECT  S.*
                        ,G.InternalGroupName
                        ,G.SelectionTitle
                        ,G.SummaryTitle
                        ,G.DynamicSummaryTitle
                FROM (
                SELECT
                        P.PricingGroupID
                        ,sum(P.ServiceDuration) As ServiceDuration
                        ,sum(P.HourlyPrice) As HourlyPrice
                        ,sum(P.SubtotalPrice) As SubtotalPrice
                        ,sum(P.FeePrice) As FeePrice
                        ,sum(P.TotalPrice) As TotalPrice
                FROM
                    PricingEstimateDetail As P
                WHERE   p.PricingEstimateID = @0
                GROUP BY P.PricingGroupID
                HAVING sum(P.TotalPrice) <> 0
                ) As S
                 INNER JOIN
                PricingGroups As G
                  ON S.PricingGroupID = G.PricingGroupID
                WHERE
                    G.LanguageID = @1
                    AND G.CountryID = @2
            ";
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sql, PricingEstimateID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }
        }
        public static Dictionary<string, LcPricingModel.PricingSummaryData> GetPricingSummaryGroups(int PricingEstimateID, dynamic bookingData = null)
        {
            dynamic pricingGroups = GetPricingDetailsGroups(PricingEstimateID);
            var pricingSummaryGroups = new Dictionary<string, LcPricingModel.PricingSummaryData>();
            if (pricingGroups != null)
                foreach (var g in pricingGroups)
                {
                    var s = new LcPricingModel.PricingSummaryData();
                    var concept = g.SummaryTitle;
                    switch ((int)g.PricingGroupID)
                    {
                        case 4: // packages
                            concept = g.DynamicSummaryTitle.Replace("{package}", GetBookingRequestPackages(0, PricingEstimateID));
                            break;
                        case 2: // variables
                            if (bookingData != null)
                                concept = g.DynamicSummaryTitle.Replace("{position}", bookingData.PositionSingular);
                            break;
                        case 5: // addons
                            concept = g.DynamicSummaryTitle;
                            break;
                    }
                    s.Concept = concept;
                    s.ServiceDuration = g.ServiceDuration;
                    s.SubtotalPrice = g.SubtotalPrice;
                    s.FeePrice = g.FeePrice;
                    s.TotalPrice = g.TotalPrice;
                    pricingSummaryGroups.Add(g.InternalGroupName, s);
                }
            return pricingSummaryGroups;
        }
        #endregion

        public static string GetBookingRequestDetails(int BookingRequestID, int pricingEstimateID = 0)
        {
            dynamic pvars, poptions;
            using (var db = Database.Open("sqlloco"))
            {
                if (pricingEstimateID == 0)
                {
                    pricingEstimateID = db.QueryValue(sqlGetBookingRequestPricingEstimate, BookingRequestID);
                }
                pvars = db.Query(sqlGetPricingVarsInPricingEstimate, pricingEstimateID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                poptions = db.Query(sqlGetPricingOptionsInPricingEstimate, pricingEstimateID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }

            int i = 0;
            string iprint = "";
            string result = "";
            foreach (var pitem in pvars)
            {
                if (i > 0)
                {
                    iprint = "; ";
                }
                i++;
                result += iprint + pitem.Name + " " + pitem.Quantity;
            }
            iprint = "";
            if (pvars.Count > 0)
            {
                iprint = "; ";
            }
            i = 0;
            foreach (var pitem in poptions)
            {
                if (i > 0)
                {
                    iprint = "; ";
                }
                i++;
                result += iprint + pitem.Name + "" + pitem.Quantity;
            }

            return result;
        }
        public static string GetBookingRequestServices(int bookingRequestID, int pricingEstimateID = 0)
        {
            dynamic services;
            using (var db = Database.Open("sqlloco"))
            {
                if (pricingEstimateID == 0)
                {
                    pricingEstimateID = db.QueryValue(sqlGetBookingRequestPricingEstimate, bookingRequestID);
                }
                services = db.Query(sqlGetServicesIncludedInPricingEstimate, pricingEstimateID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }

            int i = 0;
            string iprint = "";
            string result = "";
            foreach (var service in services)
            {
                if (i > 0)
                {
                    iprint = ", ";
                }
                i++;
                result += iprint + service.Name;
            }

            return result;
        }
        public static string GetBookingRequestPackages(int bookingRequestID, int pricingEstimateID = 0)
        {
            dynamic packages;
            using (var db = Database.Open("sqlloco"))
            {
                if (pricingEstimateID == 0)
                {
                    pricingEstimateID = db.QueryValue(sqlGetBookingRequestPricingEstimate, bookingRequestID);
                }
                packages = db.Query(sqlGetPricingPackagesInPricingEstimate, pricingEstimateID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }

            int i = 0;
            string iprint = "";
            string result = "";
            foreach (var pak in packages)
            {
                if (i > 0)
                {
                    iprint = ", ";
                }
                i++;
                result += iprint + pak.Name; // + " (" + pak.CustomerPricingDataInput + ")";
            }

            return result;
        }
        public static string GetBookingRequestSubject(int BookingRequestID)
        {
            var getBookingRequest = @"
                SELECT  TOP 1
                        P.PositionSingular,
                        E1.StartTime As PreferredDateStart, E1.EndTime As PreferredDateEnd
                FROM    BookingRequest As B
                         INNER JOIN
                        CalendarEvents As E1
                          ON E1.ID = B.PreferredDateID
                         INNER JOIN
                        Positions As P
                          ON P.PositionID = B.PositionID
                WHERE   B.BookingRequestID = @0
            ";
            dynamic summary = null;
            using (var db = Database.Open("sqlloco"))
            {
                summary = db.QuerySingle(getBookingRequest, BookingRequestID);
            }
            string result = "";
            if (summary != null)
            {
                result = summary.PositionSingular + " " +
                    summary.PreferredDateStart.ToLongDateString() + ", " +
                    summary.PreferredDateStart.ToShortTimeString() + " to " +
                    summary.PreferredDateEnd.ToShortTimeString();
            }
            return result;
        }
        public static string GetBookingSubject(int BookingID)
        {
            var getBookingRequest = @"
                SELECT  TOP 1
                        P.PositionSingular,
                        E1.StartTime As ConfirmedDateStart, E1.EndTime As ConfirmedDateEnd
                FROM    Booking As B
                         INNER JOIN
                        CalendarEvents As E1
                          ON E1.ID = B.ConfirmedDateID
                         INNER JOIN
                        BookingRequest As R
                          ON R.BookingRequestID = B.BookingRequestID
                         INNER JOIN
                        Positions As P
                          ON P.PositionID = R.PositionID
                WHERE   B.BookingID = @0
            ";
            dynamic summary = null;
            using (var db = Database.Open("sqlloco"))
            {
                summary = db.QuerySingle(getBookingRequest, BookingID);
            }
            string result = "";
            if (summary != null)
            {
                result = summary.PositionSingular + " " +
                    summary.ConfirmedDateStart.ToLongDateString() + ", " +
                    summary.ConfirmedDateStart.ToShortTimeString() + " to " +
                    summary.ConfirmedDateEnd.ToShortTimeString();
            }
            return result;
        }
        public static string GetBookingStatus(int BookingID)
        {
            var getBookingStatus = @"
                SELECT  BookingStatusName, BookingStatusDescription
                FROM    BookingStatus As BS
                         INNER JOIN
                        Booking As B
                          ON B.BookingStatusID = BS.BookingStatusID
                WHERE   B.BookingID = @0
            ";
            using (var db = Database.Open("sqlloco"))
            {
                var b = db.QuerySingle(getBookingStatus, BookingID);
                if (b != null)
                {
                    return b.BookingStatusDescription ?? b.BookingStatusName;
                }
            }
            return "";
        }
        #endregion

        #region Actions on bookings, modifications
        /// <summary>
        /// Invalide a Booking Request setting it as 'cancelled', 'declined',
        /// or 'expired', preserving the main data but removing some unneded
        /// data as the events-dates and the address (if this can be removed)
        /// and every reference to that events and address from the BookingRequest
        /// table.
        /// The desired new BookingStatusID must be provided, but is filtered and
        /// if is not a valid ID an exception is throw.
        /// If there is a TransactionID related to the BookingRequest, that transaction
        /// is refunded if needed.
        /// List of BookingRequestStatusID:
        /// BookingRequestStatusID	BookingRequestStatusName
        /// 3	timed out
        /// 4	cancelled
        /// 5	denied
        /// 6	expired
        /// 8	denied with alternatives
        /// </summary>
        /// <param name="BookingRequestID"></param>
        public static dynamic InvalidateBookingRequest(int BookingRequestID, int BookingRequestStatusID)
        {
            if (!(new int[] { 3, 4, 5, 6, 8 }).Contains<int>(BookingRequestStatusID))
            {
                throw new Exception(String.Format(
                    "BookingRequestStatusID '{0}' is not valid to invalidate the booking request",
                    BookingRequestStatusID));
            }

            var sqlGetTransactionID = @"
                SELECT  PaymentTransactionID
                FROM    BookingRequest
                WHERE   BookingRequestID = @0
            ";
            var sqlInvalidateBookingRequest = @"
                -- Parameters
                DECLARE @BookingRequestID int, @BookingRequestStatusID int
                SET @BookingRequestID = @0
                SET @BookingRequestStatusID = @1

                DECLARE @AddressID int

                BEGIN TRY
                    BEGIN TRAN

                    -- Get Service Address ID to be (maybe) removed later
                    SELECT  @AddressID = AddressID
                    FROM    BookingRequest
                    WHERE   BookingRequestID = @BookingRequestID

                    -- Removing CalendarEvents:
                    DELETE FROM CalendarEvents
                    WHERE ID IN (
                        SELECT TOP 1 PreferredDateID FROM BookingRequest
                        WHERE BookingRequestID = @BookingRequestID
                        UNION
                        SELECT TOP 1 AlternativeDate1ID FROM BookingRequest
                        WHERE BookingRequestID = @BookingRequestID
                        UNION
                        SELECT TOP 1 AlternativeDate2ID FROM BookingRequest
                        WHERE BookingRequestID = @BookingRequestID
                    )

                    /*
                     * Updating Booking Request status, and removing references to the 
                     * user selected dates.
                     */
                    UPDATE  BookingRequest
                    SET     BookingRequestStatusID = @BookingRequestStatusID,
                            PreferredDateID = null,
                            AlternativeDate1ID = null,
                            AlternativeDate2ID = null,
                            AddressID = null
                    WHERE   BookingRequestID = @BookingRequestID

                    -- Removing Service Address, if is not an user saved location (it has not AddressName)
                    DELETE FROM ServiceAddress
                    WHERE AddressID = @AddressID
                          AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @AddressID AND AddressName is null) = 1
                    DELETE FROM Address
                    WHERE AddressID = @AddressID
                           AND
                          AddressName is null

                    COMMIT TRAN

                    -- We return sucessful operation with Error=0
                    SELECT 0 As Error
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0
                        ROLLBACK TRAN
                    -- We return error number and message
                    SELECT ERROR_NUMBER() As Error, ERROR_MESSAGE() As ErrorMessage
                END CATCH
            ";
            using (var db = Database.Open("sqlloco"))
            {
                // Check cancellation policy and get quantities to refund
                var refund = GetCancellationAmountsForBookingRequest(BookingRequestID, BookingRequestStatusID, db);

                // Get booking request TransactionID
                string tranID = db.QueryValue(sqlGetTransactionID, BookingRequestID);

                // if there is a valid transactionID -or is not a virtual testing id-, do the refund
                if (!String.IsNullOrEmpty(tranID) && !tranID.StartsWith("TEST:"))
                {
                    string result = null;
                    // Different calls for total and partial refunds
                    if (refund.IsTotalRefund)
                    {
                        result = LcPayment.RefundTransaction(tranID);
                    }
                    else
                    {
                        // Partial refund could be given with zero amount to refund (because cancellation
                        // policy sets no refund), execute payment partial refund only with no zero values
                        if (refund.TotalRefunded != 0)
                            result = LcPayment.RefundTransaction(tranID, refund.TotalRefunded);
                    }

                    if (result != null)
                        return (dynamic)new { Error = -9999, ErrorMessage = result };
                }

                // All goes fine with payment proccessing, continue

                // Save refund quantities in booking PricingEstimateID
                SaveRefundAmounts(refund, db);

                // Invalidate in database the booking request:    
                return db.QuerySingle(sqlInvalidateBookingRequest,
                    BookingRequestID,
                    BookingRequestStatusID);
            }
        }
        public static dynamic InvalidateBooking(int BookingID, int BookingStatusID)
        {
            if (!(new int[] { 6, 7 }).Contains<int>(BookingStatusID))
            {
                throw new Exception(String.Format(
                    "BookingStatusID '{0}' is not valid to invalidate the booking",
                    BookingStatusID));
            }

            var sqlGetTransactionID = @"
                SELECT  PaymentTransactionID
                FROM    BookingRequest
                         INNER JOIN
                        Booking
                          ON BookingRequest.BookingRequestID = Booking.BookingRequestID
                WHERE   BookingID = @0
            ";
            var sqlInvalidateBooking = @"
                -- Parameters
                DECLARE @BookingID int, @BookingStatusID int
                SET @BookingID = @0
                SET @BookingStatusID = @1

                DECLARE @AddressID int
                DECLARE @BookingRequestID int

                SELECT @BookingRequestID = BookingRequestID
                FROM    Booking
                WHERE   BookingID = @BookingID

                BEGIN TRY
                    BEGIN TRAN

                    -- Get Service Address ID to be (maybe) removed later
                    SELECT  @AddressID = AddressID
                    FROM    BookingRequest
                             INNER JOIN
                            Booking
                              ON BookingRequest.BookingRequestID = Booking.BookingRequestID
                    WHERE   BookingID = @BookingID

                    -- Removing CalendarEvents:
                    DELETE FROM CalendarEvents
                    WHERE ID IN (
                        SELECT TOP 1 ConfirmedDateID FROM Booking
                        WHERE BookingID = @BookingID
                    )

                    /*
                     * Updating Booking status, and removing references to the 
                     * user selected dates.
                     */
                    UPDATE  Booking
                    SET     BookingStatusID = @BookingStatusID,
                            ConfirmedDateID = null
                    WHERE   BookingID = @BookingID
                    /*
                     * Updating Booking Request, removing reference to the address
                     */
                    UPDATE  BookingRequest
                    SET     AddressID = null
                    WHERE   BookingRequestID = @BookingRequestID

                    -- Removing Service Address, if is not an user saved location (it has not AddressName)
                    DELETE FROM ServiceAddress
                    WHERE AddressID = @AddressID
                          AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @AddressID AND AddressName is null) = 1
                    DELETE FROM Address
                    WHERE AddressID = @AddressID
                           AND
                          AddressName is null

                    COMMIT TRAN

                    -- We return sucessful operation with Error=0
                    SELECT 0 As Error
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0
                        ROLLBACK TRAN
                    -- We return error number and message
                    SELECT ERROR_NUMBER() As Error, ERROR_MESSAGE() As ErrorMessage
                END CATCH
            ";
            using (var db = Database.Open("sqlloco"))
            {
                // Check cancellation policy and get quantities to refund
                var refund = GetCancellationAmountsForBooking(BookingID, BookingStatusID, db);

                // Get booking request TransactionID
                string tranID = db.QueryValue(sqlGetTransactionID, BookingID);

                // if there is a valid transactionID -or is not a virtual testing id-, do the refund
                if (!String.IsNullOrEmpty(tranID) && !tranID.StartsWith("TEST:"))
                {
                    string result = null;
                    // Different calls for total and partial refunds
                    if (refund.IsTotalRefund)
                    {
                        result = LcPayment.RefundTransaction(tranID);
                    }
                    else
                    {
                        // Partial refund could be given with zero amount to refund (because cancellation
                        // policy sets no refund), execute payment partial refund only with no zero values
                        if (refund.TotalRefunded != 0)
                            result = LcPayment.RefundTransaction(tranID, refund.TotalRefunded);
                    }

                    if (result != null)
                        return (dynamic)new { Error = -9999, ErrorMessage = result };
                }

                // All goes fine with payment proccessing, continue

                // Save refund quantities in booking PricingEstimateID
                SaveRefundAmounts(refund, db);

                // Invalidate in database the booking:
                return db.QuerySingle(sqlInvalidateBooking,
                    BookingID,
                    BookingStatusID);
            }
        }
        public static void UpdateBookingTransactionID(string oldTranID, string newTranID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                db.Execute(@"
                    UPDATE  BookingRequest
                    SET     TransactionID = @1
                    WHERE   TransactionID = @0
                ", oldTranID, newTranID);
            }
        }
        #endregion

        #region Cancellation policy
        private const string sqlViewPricingAndPolicy = @"
            SELECT  R.PricingEstimateID
                    ,R.BookingRequestStatusID
                    ,R.CancellationPolicyID
                    ,C.HoursRequired
                    ,C.RefundIfCancelledBefore
                    ,C.RefundIfCancelledAfter
                    ,C.RefundOfLoconomicsFee
                    ,P.SubtotalPrice
                    ,P.TotalPrice
                    ,P.FeePrice
            FROM    BookingRequest As R
                        INNER JOIN CancellationPolicy As C
                        ON R.CancellationPolicyID = C.CAncellationPolicyID
                        INNER JOIN PricingEstimate As P
                        ON R.PricingEstimateID = P.PricingEstimateID
        ";
        public static dynamic GetCancellationAmountsForBookingRequest(int bookingRequestID, int changingToBookingRequestStatusID, Database db)
        {
            var fullRefund = false;
            var confirmedDate = System.Data.SqlTypes.SqlDateTime.MinValue;

            // If new desired BookingRequestStatusID is not 'cancelled by customer' (different of 4)
            // a total refund is done, no cancellation policy applies (is
            // cancelled by provider or system)
            if (changingToBookingRequestStatusID != 4)
            {
                fullRefund = true;
            }
            else
            {
                // Get confirmated booking date (start date and time):
                confirmedDate = db.QueryValue(@"
                    SELECT  E.StartTime
                    FROM    Booking As B
                                INNER JOIN CalendarEvents As E
                                ON B.ConfirmedDateID = E.Id
                    WHERE   B.BookingRequestID = @0
                ", bookingRequestID);
                // TODO: Just now (issue #142, 20121122), a booking request cannot be
                // cancelled by customer, this code will not execute, BUT if
                // someday need be work, confirmedDate must be retrieve some valid
                // date, because is not still confirmed, confirmedDate will be NULL
                // get the nearest proposed date (in bookingrequest table)
                // Next code is to avoid calls to null value:
                if (confirmedDate.IsNull)
                    confirmedDate = System.Data.SqlTypes.SqlDateTime.MinValue;
            }

            var b = db.QuerySingle(sqlViewPricingAndPolicy + @"
                WHERE   BookingRequestID = @0
            ", bookingRequestID);

            return GetCancellationAmountsFor(b, confirmedDate.Value, fullRefund, db);
        }
        public static dynamic GetCancellationAmountsForBooking(int bookingID, int changingToBookingStatusID, Database db)
        {
            var fullRefund = false;
            var confirmedDate = System.Data.SqlTypes.SqlDateTime.MinValue.Value;

            // If new desired BookingStatusID is not 'cancelled by customer' (different of 6)
            // a total refund is done, no cancellation policy applies (is
            // cancelled by provider or system)
            if (changingToBookingStatusID != 6)
            {
                fullRefund = true;
            }
            else
            {
                // Get confirmated booking date (start date and time):
                confirmedDate = (DateTime)db.QueryValue(@"
                    SELECT  E.StartTime
                    FROM    Booking As B
                                INNER JOIN CalendarEvents As E
                                ON B.ConfirmedDateID = E.Id
                    WHERE   B.BookingID = @0
                ", bookingID);
            }

            var b = db.QuerySingle(sqlViewPricingAndPolicy + @"
                     INNER JOIN Booking As B
                      ON B.BookingRequestID = R.BookingRequestID
                WHERE   BookingID = @0
            ", bookingID);

            return GetCancellationAmountsFor(b, confirmedDate, fullRefund, db);
        }
        public static dynamic GetCancellationAmountsFor(dynamic pricingAndPolicy, DateTime confirmedDate, bool fullRefund, Database db)
        {
            dynamic result = null;

            if (fullRefund)
            {
                // TOTAL REFUND
                result = new
                {
                    PricingEstimateID = pricingAndPolicy.PricingEstimateID,
                    IsTotalRefund = true,
                    SubtotalRefunded = pricingAndPolicy.SubtotalPrice,
                    FeeRefunded = pricingAndPolicy.FeePrice,
                    TotalRefunded = pricingAndPolicy.TotalPrice,
                    DateRefunded = DateTime.Now
                };
            }
            else
            {
                // PARTIAL REFUND OR NO REFUND, based Cancellation Policy
                if (DateTime.Now < confirmedDate.AddHours(0 - pricingAndPolicy.HoursRequired))
                {
                    // BEFORE limit date
                    decimal subr = (decimal)pricingAndPolicy.SubtotalPrice * (decimal)pricingAndPolicy.RefundIfCancelledBefore,
                        feer = (decimal)pricingAndPolicy.FeePrice * (decimal)pricingAndPolicy.RefundOfLoconomicsFee;
                    result = new
                    {
                        PricingEstimateID = pricingAndPolicy.PricingEstimateID,
                        IsTotalRefund = false,
                        SubtotalRefunded = subr,
                        FeeRefunded = feer,
                        TotalRefunded = subr + feer,
                        DateRefunded = DateTime.Now
                    };
                }
                else
                {
                    // AFTER limit date
                    decimal subr = (decimal)pricingAndPolicy.SubtotalPrice * (decimal)pricingAndPolicy.RefundIfCancelledAfter;
                    result = new
                    {
                        PricingEstimateID = pricingAndPolicy.PricingEstimateID,
                        IsTotalRefund = false,
                        SubtotalRefunded = subr,
                        // Fees never are refunded after limit date
                        FeeRefunded = 0,
                        TotalRefunded = subr,
                        DateRefunded = DateTime.Now
                    };
                }
            }

            return result;
        }
        /// <summary>
        /// Update PricingEstimate with the data give at refunData, that contains
        /// exactly the struct returned by GetCancellationAmountsFor method, with
        /// PricingEstimateID, date and amounts refunded
        /// </summary>
        /// <param name="refundData"></param>
        /// <param name="db"></param>
        public static void SaveRefundAmounts(dynamic refundData, Database db = null)
        {
            var ownDb = false;
            if (db == null)
            {
                ownDb = true;
                db = Database.Open("sqlloco");
            }

            db.Execute(@"
                UPDATE  PricingEstimate
                SET     SubtotalRefunded = @1
                        ,FeeRefunded = @2
                        ,TotalRefunded = @3
                        ,DateRefunded = @4
                WHERE   PricingEstimateID = @0
                ",
                refundData.PricingEstimateID,
                refundData.SubtotalRefunded,
                refundData.FeeRefunded,
                refundData.TotalRefunded,
                refundData.DateRefunded
            );

            if (ownDb)
                db.Dispose();
        }
        #endregion

        #region Create Booking Request (Wizard)

        #region SQLs
        /// <summary>
        ///        /* sql example to implement custom auto increment in a secure mode (but with possible deadlocks)
        ///            BEGIN TRAN
        ///                SELECT @id = MAX(id) + 1 FROM Table1 WITH (UPDLOCK, HOLDLOCK)
        ///                INSERT INTO Table1(id, data_field)
        ///                VALUES (@id ,'[blob of data]')
        ///            COMMIT TRAN
        ///         */
        /// </summary>
        public const string sqlInsEstimate = @"
                    BEGIN TRAN

                        -- Getting a new ID if was not provided one
                        DECLARE @id int, @revision int
                        SET @id = @0
                        SET @revision = @1

                        If @id <= 0 BEGIN
                            SELECT @id = MAX(PricingEstimateID) + 1 FROM PricingEstimate WITH (UPDLOCK, HOLDLOCK)
                            SET @revision = 1
                        END

                        IF @id is null 
                            SET @id = 1

                        INSERT INTO [pricingestimate]
                                   ([PricingEstimateID]
                                   ,[PricingEstimateRevision]
                                   ,[PricingTypeID]
                                   ,[ServiceDuration]
                                   ,[HourlyPrice]
                                   ,[SubtotalPrice]
                                   ,[FeePrice]
                                   ,[TotalPrice]
                                   ,[CreatedDate]
                                   ,[UpdatedDate]
                                   ,[ModifiedBy]
                                   ,[Active])
                             VALUES
                                   (@id, @revision, @2, @3, @4, @5, @6, @7, getdate(), getdate(), 'sys', 1)

                        SELECT @id As PricingEstimateID, @revision As PricingEstimateRevision
                    COMMIT TRAN
        ";
        public const string sqlInsEstimateDetails = @"
                    INSERT INTO [pricingestimatedetail]
                               ([PricingEstimateID]
                               ,[PricingEstimateRevision]

                               ,PricingGroupID

                               ,[PricingVariableID]
                               ,[PricingSurchargeID]
                               ,[PricingOptionID]
                               ,[ServiceAttributeID]
                               ,[ProviderPackageID]
                               ,[ProviderPricingDataInput]
                               ,[CustomerPricingDataInput]
                               ,[SystemPricingDataInput]

                               ,[ServiceDuration]
                               ,[HourlyPrice]
                               ,[SubtotalPrice]
                               ,[FeePrice]
                               ,[TotalPrice]

                               ,[CreatedDate]
                               ,[UpdatedDate]
                               ,[ModifiedBy])
                         VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, getdate(), getdate(), 'sys')
        ";
        private const string sqlInsBookingRequest = @"
                INSERT INTO BookingRequest
                           (
                           [CustomerUserID]
                           ,[ProviderUserID]
                           ,[PositionID]
                           ,[BookingTypeID]
                           ,[PricingEstimateID]
                           ,[BookingRequestStatusID]
                           ,[CancellationPolicyID]
                           ,[SpecialRequests]
                           ,[CreatedDate]
                           ,[UpdatedDate]
                           ,[ModifiedBy])
                    VALUES (@0, @1, @2, @3, @4, 1 /* created */, @5, @6, getdate(), getdate(), 'sys')

                -- Update customer user profile to be a customer (if is not still, maybe is only provider)
                UPDATE Users SET IsCustomer = 1
                WHERE UserID = @0 AND IsCustomer <> 1

                SELECT Cast(@@Identity As int) As BookingRequestID
        ";
        #endregion

        /// <summary>
        /// Create an estimate or a revision of the
        /// estimate given at estimateID (if is Zero, create one new).
        /// Returning an object with properties
        /// int:PricingEstimateID and int:PricingEstimateRevision
        /// </summary>
        /// <param name="estimateID"></param>
        /// <param name="revisionID"></param>
        /// <param name="pricingTypeID"></param>
        /// <param name="timeRequired"></param>
        /// <param name="hourPrice"></param>
        /// <param name="subtotalPrice"></param>
        /// <param name="feePrice"></param>
        /// <param name="totalPrice"></param>
        /// <returns></returns>
        public static dynamic CreatePricingEstimate(
            int estimateID,
            int revisionID,
            int pricingTypeID,
            decimal timeRequired,
            decimal hourPrice,
            decimal subtotalPrice,
            decimal feePrice,
            decimal totalPrice)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(LcData.Booking.sqlInsEstimate, estimateID, revisionID,
                    pricingTypeID, timeRequired, hourPrice, subtotalPrice, feePrice, totalPrice);
            }
        }

        public static int CreateRequest(
                int customerUserID,
                int providerUserID,
                int positionID,
                int bookingTypeID,
                int pricingEstimateID,
                int cancellationPolicyID,
                string specialRequests)
        {
            int bookingRequestID = 0;
            using (var db = Database.Open("sqlloco"))
            {
                bookingRequestID = (int)db.QueryValue(sqlInsBookingRequest,
                    customerUserID, providerUserID, positionID,
                    bookingTypeID,
                    pricingEstimateID,
                    cancellationPolicyID,
                    specialRequests
                );
            }

            // Saving it at user Session, for other 
            System.Web.HttpContext.Current.Session["BookingRequestID"] = bookingRequestID;

            return bookingRequestID;
        }

        public static dynamic GetFeeFor(int customerUserID, int providerUserID, int pricingTypeID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(@"
                    SELECT 
                        ServiceFeeAmount
                        ,ServiceFeeCurrency
                        ,ServiceFeePercentage
                        ,PaymentProcessingFee
                    FROM BookingType
                    WHERE BookingTypeID = (
                        SELECT TOP 1 CASE
                            WHEN EXISTS (SELECT * FROM BookingRequest As B 
                                WHERE B.BookingRequestStatusID = 7 AND B.CustomerUserID = @0 AND B.ProviderUserID = @1)
                            THEN 2
                            ELSE 1 END
                    )
                ", customerUserID, providerUserID, pricingTypeID);
            }
        }
        #endregion
    }
}
