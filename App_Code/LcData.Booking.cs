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
                    ,PP.ProviderPackagePrice As Price
                    ,PP.ProviderPackageServiceDuration As ServiceDuration
                    ,PP.FirstTimeClientsOnly
                    ,PP.NumberOfSessions
                    ,P.PriceEstimate
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
                    P.TimeEstimate As Time, P.PriceEstimate As Price
            FROM    PricingEstimateDetail As P
                     INNER JOIN
                    PricingOption As V
                      ON V.PricingOptionID = P.PricingOptionID
            WHERE   P.PricingEstimateID = @0
                     AND V.LanguageID = @1 AND V.CountryId = @2
        ";
        public const string sqlGetPricingVarsInPricingEstimate = @"
            SELECT  V.CustomerPricingVariableDisplayText As Name, P.CustomerPricingDataInput As Quantity,
                    P.TimeEstimate As Time, P.PriceEstimate As Price
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
                         INNER JOIN
                        Address As L
                          ON R.AddressID = L.AddressID
                         INNER JOIN
                        ServiceAddress As SA
                          ON L.AddressID = SA.AddressID
                         INNER JOIN
                        Users As LU
                          ON L.UserID = LU.UserID
                         INNER JOIN
                        StateProvince As SP
                          ON SP.StateProvinceID = L.StateProvinceID
                         INNER JOIN
                        PostalCode As PC
                          ON PC.PostalCodeID = L.PostalCodeID
                         INNER JOIN
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

                        P.ServiceDuration, coalesce(P.HourlyPrice, 0) As HourlyPrice,
                        P.SubtotalPrice, P.FeePrice, P.TotalPrice
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
                result += iprint + pak.Name + " (" + pak.CustomerPricingDataInput + ")";
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
                // First: get booking request TransactionID (if there is -or is not a virtual testing id-) to do a refund
                string tranID = db.QueryValue(sqlGetTransactionID, BookingRequestID);
                if (!String.IsNullOrEmpty(tranID) && !tranID.StartsWith("TEST:"))
                {
                    var result = LcPayment.RefundTransaction(tranID);
                    if (result != null)
                        return (dynamic)new { Error = -9999, ErrorMessage = result };
                }

                // Invalidate in database the booking request:    
                return db.QuerySingle(sqlInvalidateBookingRequest,
                    BookingRequestID,
                    BookingRequestStatusID);
            }
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
                         VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, getdate(), getdate(), 'sys')
        ";
        public const string sqlInsBookingRequest = @"
                INSERT INTO BookingRequest
                           ([BookingTypeID]
                           ,[CustomerUserID]
                           ,[ProviderUserID]
                           ,[PositionID]
                           ,[PricingEstimateID]
                           ,[BookingRequestStatusID]
                           ,[SpecialRequests]
                           ,[CreatedDate]
                           ,[UpdatedDate]
                           ,[ModifiedBy])
                    VALUES (1, @0, @1, @2, @3, 1, @4, getdate(), getdate(), 'sys')

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
                int pricingEstimateID,
                string specialRequests)
        {
            int bookingRequestID = 0;
            using (var db = Database.Open("sqlloco"))
            {
                bookingRequestID = (int)db.QueryValue(sqlInsBookingRequest,
                    customerUserID, providerUserID, positionID,
                    pricingEstimateID,
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
