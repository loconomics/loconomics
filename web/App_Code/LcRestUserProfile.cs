using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Implements the scheme for a 'service-address' object
/// in the REST API, and static methods for database
/// operations
/// </summary>
public class LcRestUserProfile
{
    #region Fields
    public int userID;
    public string email;

    public string firstName;
    public string lastName;
    public string secondLastName;

    public string alternativeEmail;
    public string phone;
    public bool canReceiveSms;
    public int? birthMonthDay;
    public int? birthMonth;
   
    public bool isFreelancer;
    public bool isCustomer;
    public bool isMember;

    /// <summary>
    /// TOREVIEW if still needed, after implement the app.
    /// </summary>
    public string onboardingStep;
    public int accountStatusID;
    public DateTime createdDate;
    public DateTime updatedDate;
    #endregion

    public static LcRestUserProfile FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestUserProfile {
            userID = record.userID,
            email = record.email,

            firstName = record.firstName,
            lastName = record.lastName,
            secondLastName = record.secondLastName,

            alternativeEmail = record.alternativeEmail,
            phone = record.phone,
            canReceiveSms = record.canReceiveSms,
            birthMonthDay = record.birthMonthDay,
            birthMonth = record.birthMonth,

            isFreelancer = record.isFreelancer,
            isCustomer = record.isCustomer,
            isMember = record.isMember,

            onboardingStep = record.onboardingStep,
            accountStatusID = record.accountStatusID,
            createdDate = record.createdDate,
            updatedDate = record.updatedDate
        };
    }

    #region SQL
    private const string sqlSelectProfile = @"
        SELECT TOP 1
            -- ID
            Users.userID
            ,UP.email

            -- Name
            ,firstName
            ,lastName
            ,secondLastName

            -- User Type
            ,isProvider as isFreelancer
            ,isCustomer
            ,isMember

            ,alternativeEmail
            ,mobilePhone as phone
            ,canReceiveSms
            ,birthMonthDay
            ,birthMonth
                        
            ,onboardingStep
            ,accountStatusID
            ,createdDate
            ,updatedDate

        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
        WHERE Users.UserID = @0
            AND Active = 1
    ";

    private const string sqlUpdateProfile = @"
        DECLARE 
        @UserID int
        ,@FirstName varchar(50)
        ,@LastName varchar(145)
        ,@SecondLastName varchar(145)

        ,@AlternativeEmail nvarchar(56)
        ,@Phone varchar(20)
        ,@CanReceiveSms bit
        ,@BirthMonthDay int
        ,@BirthMonth int

        SET @UserID = @0
        SET @FirstName = @1
        SET @LastName = @2
        SET @SecondLastName = @3
        SET @AlternativeEmail = @4
        SET @Phone = @5
        SET @CanReceiveSms = @6
        SET @BirthMonthDay = @7
        SET @BirthMonth = @8

        -- Saving all the data and updating verifications
        BEGIN TRAN

        /* Do checks to revoke verifications on some changes */
        -- @c var allow us check if data is equals (=1) or was changed (=0)
        DECLARE @c int

        -- Checking Full Name: any change?
        SELECT  @c = count(*)
        FROM    Users
        WHERE   UserID = @UserID
                    AND
                FirstName = @FirstName AND LastName = @LastName AND SecondLastName = @SecondLastName

        IF @c = 0 BEGIN
            -- Revoke social verifications (all VerificationCategoryID = 3)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID IN (
                        SELECT VerificationID
                        FROM    Verification
                        WHERE   VerificationCategoryID = 3
                    )

            -- Revoke name verification (VerificationID=1)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 1

            -- Revoke background check verification (VerificationID=7)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 7
        END

        -- Checking Phone: any change?
        SELECT  @c = count(*)
        FROM    Users
        WHERE   UserID = @UserID
                AND MobilePhone = @Phone

        IF @c = 0 BEGIN
            -- Revoke phone verification (VerificationID=4)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 4
        END

        /* Update Data */
        UPDATE	Users
        SET     FirstName = @FirstName
		        ,LastName = @LastName
		        ,SecondLastName = @SecondLastName

                ,AlternativeEmail = @AlternativeEmail		        
                ,MobilePhone = @Phone
                ,CanReceiveSms = @CanReceiveSms
                ,BirthMonthDay = @BirthMonthDay
                ,BirthMonth = @BirthMonth

                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
        WHERE   UserId = @UserID

        -- A lot of direct and indirect alerts depend on contact info,
        -- execute all its alerts for all its positions
        EXEC TestAllUserAlerts @UserID

        COMMIT TRAN
    ";
    #endregion

    #region Fetch
    public static LcRestUserProfile GetUserProfile(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return FromDB(db.QuerySingle(sqlSelectProfile, userID));
        }
    }
    #endregion

    #region Create/Update
    public static void UpdateUserProfile(LcRestUserProfile profile)
    {
        using (var db = Database.Open("sqlloco")) {

            db.Execute(sqlUpdateProfile,
                profile.userID,
                profile.firstName,
                profile.lastName,
                profile.secondLastName,
                profile.alternativeEmail,
                profile.phone,
                profile.canReceiveSms,
                profile.birthMonthDay,
                profile.birthMonth
            );
        }
    }
    #endregion

}