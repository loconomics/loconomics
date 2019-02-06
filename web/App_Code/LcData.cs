using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Static class simplifying data access
/// </summary>
public static partial class LcData
{
    #region Locations
    public static string GetStateProvinceCode(int stateProvinceID)
    {
        var sqlGetStateCode = @"
            SELECT  StateProvinceCode
            FROM    StateProvince
            WHERE   StateProvinceID = @0
        ";
        using (var db = Database.Open("sqlloco"))
        {
            return db.QueryValue(sqlGetStateCode, stateProvinceID);
        }
    }
    
    /// <summary>
    /// Get the first user address of the given type from database.
    /// Useful for special address types that can be only one per user, but can be used with anyone.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="addressType"></param>
    /// <returns></returns>
    public static LcData.Address GetFirstUserAddressOfType(int userID, LcData.Address.AddressType addressType) {
        using (var db = Database.Open("sqlloco")) {
            var add = db.QuerySingle(
                LcData.sqlGetAddresses +
                " AND L.AddressTypeID = @1 ORDER BY L.UpdatedDate ASC",
                userID, (short)addressType
            );
            if (add != null)
                return new LcData.Address(add);
            return null;
        }
    }

    #region SQLs
    public const string sqlGetAddresses = @"
        SELECT  L.AddressID
                ,L.UserID
  
                ,L.AddressTypeID
                ,L.AddressName
                ,L.AddressLine1
                ,L.AddressLine2
                ,L.City
                ,L.StateProvinceID
                ,L.PostalCodeID
                ,L.CountryID
                ,L.Latitude
                ,L.Longitude
                ,L.GoogleMapsURL
                ,L.SpecialInstructions
                ,L.Active

                ,PC.PostalCode
                ,SP.StateProvinceCode
                ,SP.StateProvinceName

                ,AT.AddressType
                ,AT.UniquePerUser
        FROM    Address As L
                 INNER JOIN
                StateProvince As SP
                  ON L.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                PostalCode As PC
                  ON PC.PostalCodeID = L.PostalCodeID
                 INNER JOIN
                AddressType As AT
                  ON AT.AddressTypeID = L.AddressTypeID
        WHERE   L.UserID = @0
    ";
    public const string sqlSetAddress = @"
        DECLARE @AddressID int
        SET @AddressID = @0

        IF @AddressID = 0 BEGIN
            INSERT INTO [Address] (
                [UserID]
                ,[AddressTypeID]
                ,[AddressName]
                ,[AddressLine1]
                ,[AddressLine2]
                ,[City]
                ,[StateProvinceID]
                ,[PostalCodeID]
                ,[CountryID]
                ,[SpecialInstructions]
                ,[Latitude]
                ,[Longitude]
                ,[GoogleMapsURL]
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
                ,[CreatedBy]
            ) VALUES (
                @1, @9,
                @8, @2, @3, @4, @5, @6, @7, 
                @10,
                @11, @12, @13,
                getdate(), getdate(), 'sys', 1,
                @14
            )

            SET @AddressID = @@Identity

        END ELSE BEGIN
            /* Two steps update: normal fields first and then conditional update for the AddressTypeID field */
            UPDATE Address SET
                --AddressTypeId = @9
                AddressName = @8
                ,AddressLine1 = @2
                ,AddressLine2 = @3
                ,City = @4
                ,StateProvinceID = @5
                ,PostalCodeID = @6
                ,CountryID = @7
                ,SpecialInstructions = coalesce(@10, SpecialInstructions)
                ,Latitude = coalesce(@11, Latitude)
                ,Longitude = coalesce(@12, Longitude)
                ,GoogleMapsURL = coalesce(@13, GoogleMapsURL)
                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
                ,Active = 1
            WHERE
                AddressID = @AddressID AND UserID = @1

            /* Update AddressTypeID: only if previous AddressTypeID assigned is not one of the types 'UniquePerUser', that can be write on on insert -our rules- */
            IF (SELECT TOP 1 UniquePerUser FROM AddressType WHERE 
                AddressTypeID = (SELECT B.AddressTypeID FROM Address As B WHERE B.AddressID = @AddressID)
               ) = 0
                UPDATE Address SET
                    AddressTypeID = @9
                WHERE
                    AddressID = @AddressID AND UserID = @1
        END

        EXEC TestAlertPersonalInfo @1

        SELECT @AddressID As AddressID
    ";
    public const string sqlSetServiceAddress = @"
        BEGIN TRAN
    " + sqlSetAddress +
    @"

        -- If '@PreferredAddress' was set to true, first we set to false that field in all user service addresses
        IF @18 = 1
            UPDATE ServiceAddress SET
                PreferredAddress = 0
            WHERE
                UserID = @1 AND PositionID = @15

        -- First, try to update, if nothing updated (rowcount=0), try to insert
        UPDATE ServiceAddress SET
            ServicesPerformedAtLocation = @16
            ,TravelFromLocation = @17
            ,ServiceRadiusFromLocation = @18
            ,TransportType = @19
            ,PreferredAddress = @20
            ,UpdatedDate = getdate()
            ,ModifiedBy = 'sys'
            ,Active = 1
        WHERE
            AddressID = @AddressID
             AND
            UserID = @1 AND PositionID = @15

        IF @@rowcount = 0
            INSERT INTO [ServiceAddress] (
                [UserID]
                ,[AddressID]
                ,[PositionID]
                ,[ServicesPerformedAtLocation]
                ,[TravelFromLocation]
                ,[ServiceRadiusFromLocation]
                ,[TransportType]
                ,[PreferredAddress]
                ,[CreatedDate]
                ,[UpdatedDate]
                ,[ModifiedBy]
                ,[Active]
            ) VALUES (
                @1, @AddressId, @15,
                @16, @17, @18, @19, @20, getdate(), getdate(), 'sys', 1
            )

        COMMIT TRAN

        -- Test Alert
        EXEC TestAlertLocation @1, @15

        SELECT @AddressID As AddressID
    ";
    /// <summary>
    /// Delete an address as service address, but depending on context can only remove the [ServiceAddress] record, uncheck its
    /// 'address used as work or travel from', or remove both [ServiceAddress] and [Address] records.
    /// Param @3 (@Type) must has one value from: 'work', 'travel' EVER (will break if nothing and address has both uses)
    /// </summary>
    public const string sqlDelServiceAddress = @"
        /* Be carefull with removing an address, if exists both as 'travel' and 'work' addresses, only
            uncheck the type, don't delete */
        DECLARE @Type varchar(10)
        SET @Type = @3
        -- Type can be 'work', 'travel' or 'both

        IF @Type not like 'both' AND
            EXISTS (SELECT AddressID FROM ServiceAddress
                    WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2
                            AND ServicesPerformedAtLocation = 1
                            AND TravelFromLocation = 1)
        BEGIN

            IF @Type like 'work'
                UPDATE ServiceAddress SET
                    ServicesPerformedAtLocation = 0,
                    UpdatedDate = getdate()
                WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2
            ELSE IF @Type like 'travel'
                UPDATE ServiceAddress SET
                    TravelFromLocation = 0,
                    UpdatedDate = getdate()
                WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2

        END ELSE BEGIN

            DELETE FROM ServiceAddress
            WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2

            IF @@ERROR <> 0 BEGIN
                -- Non deletable serviceaddress, because is linked, simply 'disable it' and remove its use (as work or travel)
                DECLARE @bitWork bit, @bitTravel bit
                IF @Type like 'work'
                    SET @bitWork = cast(1 as bit)
                ELSE
                    SET @bitWork = cast(0 as bit)
                IF @Type like 'travel'
                    SET @bitTravel = cast(1 as bit)
                ELSE
                    SET @bitTravel = cast(0 as bit)

                UPDATE ServiceAddress SET
                    Active = 0
                    ,ServicesPerformedAtLocation = @bitWork
                    ,TravelFromLocation = @bitTravel
                    ,UpdatedDate = getdate()
                WHERE AddressID = @0 AND UserID = @1 AND PositionID = @2

                
                -- Soft delete the linked address, if not used by other service-addresses
                UPDATE Address SET
                    Active = 0,
                    UpdatedDate = getdate()
                WHERE AddressID = @0 AND UserID = @1
                    AND 0 = (SELECT count(*) FROM ServiceAddress As S2
                        WHERE S2.AddressID = @0
                            -- Dont count for this position, since obviously is linking it
                            AND S2.PositionID <> @2
                )

            END ELSE BEGIN

                /* REMOVED THE CHECK OF NOT ALLOW TO REMOVE THE [UniquePerUser] ADDRESSES
                    THAT FIELD WILL BE DEPRECATED, SO SEE NEXT LINES
                -- Try to remove the Address record too, if is not 'special' ([UniquePerUser]).
                DELETE FROM Address
                WHERE AddressID = @0 AND
                    (SELECT TOP 1 A.UniquePerUser FROM AddressType As A WHERE 
                        A.AddressTypeID = (SELECT B.AddressTypeID FROM Address As B WHERE B.AddressID = @0 AND UserID = @1)
                    ) = 0
                */

                /* Try  to delete the address record, except if the special type Home, but allowed to any other. */
                DELETE FROM Address
                WHERE AddressID = @0
                        AND AddressTypeID <> 1 -- Home

                -- If is not possible, maybe is linked, do nothing (but read @@ERROR to not throw the error)
                SELECT @@ERROR As ErrorNumber
            END

        END

        -- Test Alert
        EXEC TestAlertLocation @1, @2
    ";
    #endregion

    #endregion

    #region Licenses and Certifications
    public const string sqlGetVerifiedUserLicenses = @"
            SELECT  
                    L.LicenseCertificationType
                    ,SP.StateProvinceName
                    ,C.CountyName
                    ,UL.LicenseStatus
                    ,UL.ExpirationDate
                    ,UL.LastVerifiedDate
                    ,L.LicenseCertificationAuthority
                    ,L.LicenseCertificationTypeDescription
                    ,UL.Comments
            FROM    UserLicenseCertifications As UL
                     INNER JOIN
                    LicenseCertification As L
                      ON UL.LicenseCertificationID = L.LicenseCertificationID
                     INNER JOIN
                    StateProvince As SP
                      ON L.StateProvinceID = SP.StateProvinceID
                     INNER JOIN
                    County As C
                      ON C.CountyID = UL.CountyID
            WHERE   UL.ProviderUserID = @0
                     AND
                    (@1 = 0 OR UL.PositionID = @1)
                     AND
                    L.Active = 1
                     AND
                    UL.StatusID = 2 -- Verified successfully.
    ";
    #endregion

    #region Reviews and Scores
    public const string sqlCheckUserReview = @"
        SELECT  count(*)
        FROM    UserReviews
        WHERE   PositionID = @0
		            AND
		        BookingID = @1
		            AND
		        ProviderUserID = @2
		            AND
		        CustomerUserID = @3
    ";
    public const string sqlGetUserReviewScores = @"
        SELECT  Rating1, Rating2, Rating3, Rating4, Answer1, Answer2, TotalRatings, ServiceHours
        FROM    UserReviewScores
        WHERE   UserID = @0
                    AND
                PositionID = @1
    ";
    public const string sqlInsertUserReviewScores = @"
        INSERT INTO UserReviewScores (
            UserID, PositionID,
            TotalRatings,
            Rating1, Rating2, Rating3, Rating4,
            Answer1, Answer2,
            ServiceHours, LastRatingDate,
            CreatedDate, UpdatedDate, ModifiedBy
        ) VALUES (
            @0, @1,
            @2, 
            @3, @4, @5, @6,
            @7, @8,
            @9, @10,
            getdate(), getdate(), 'sys'
        )
    ";
    public const string sqlUpdateUserReviewScores = @"
        UPDATE UserReviewScores SET
            TotalRatings = @2,
            Rating1 = @3, Rating2 = @4, Rating3 = @5, Rating4 = @6,
            Answer1 = @7, Answer2 = @8,
            ServiceHours = @9, LastRatingDate = @10,
            UpdatedDate = getdate(),
            ModifiedBy = 'sys'
        WHERE   UserID = @0
                    AND
                PositionID = @1
    ";
    public const string sqlInsertUserReview = @"
        INSERT INTO UserReviews (
            BookingID, CustomerUserID, ProviderUserID, PositionID,
            Rating1, Rating2, Rating3, Rating4,
            Answer1, Answer2,
            Answer1Comment, Answer2Comment,
            PrivateReview, PublicReview,
            ServiceHours, HelpfulReviewCount,
            CreatedDate, UpdatedDate, ModifiedBy
        ) VALUES (
            @0, @1, @2, @3,
            @4, @5, @6, @7,
            @8, @9,
            @10, @11,
            @12, @13,
            @14, @15,
            getdate(), getdate(), 'sys'
        )
    ";
    #endregion

    #region Payment gateway local data
    public static dynamic GetProviderPaymentAccount(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QuerySingle("SELECT * FROM ProviderPaymentAccount WHERE ProviderUserID=@0", userID);
        }
    }
    public static void SetProviderPaymentAccount(
        int providerID,
        string merchantAccountID,
        string status,
        string message,
        string signature,
        string payload)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(@"
                IF EXISTS (SELECT * FROM ProviderPaymentAccount WHERE ProviderUserID = @0)
                    UPDATE ProviderPaymentAccount SET
                        MerchantAccountID = @1
                        , Status = coalesce(@2, Status)
                        , Message = coalesce(@3, Message)
                        , bt_signature = coalesce(@4, bt_signature)
                        , bt_payload = coalesce(@5, bt_payload)
                        , UpdatedDate = getdate()
                        , ModifiedBy = 'braintree'
                    WHERE ProviderUserID = @0
                ELSE
                    INSERT INTO ProviderPaymentAccount (
                        ProviderUserID
                        , MerchantAccountID
                        , Status
                        , Message
                        , bt_signature
                        , bt_payload
                        , CreatedDate
                        , UpdatedDate
                        , ModifiedBy
                    ) VALUES (
                        @0
                        , @1
                        , coalesce(@2, 'pending')
                        , @3
                        , @4
                        , @5
                        , getdate()
                        , getdate()
                        , 'braintree'
                    )

                -- We need to recheck the alert
                EXEC TestAlertPayment @0
                ",
                    providerID,
                    merchantAccountID,
                    status,
                    message,
                    signature,
                    payload
                );
        }
    }
    #endregion
}
