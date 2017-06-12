using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// User profile information from a subset of [users] table
    /// for the REST API, and static methods for database
    /// operations
    /// </summary>
    public class UserProfile
    {
        #region Fields
        public int userID;
        public string email;

        public string firstName;
        public string lastName;
        public string secondLastName;
        public string businessName;

        public string alternativeEmail;
        public string phone;
        public bool canReceiveSms;
        public int? birthMonthDay;
        public int? birthMonth;

        public bool isServiceProfessional;
        public bool isClient;
        public bool isCollaborator;

        /// <summary>
        /// Used in the app with a different set of names, but the first one is the same: 'welcome'.
        /// </summary>
        public string onboardingStep;
        public int accountStatusID;
        public DateTime createdDate;
        public DateTime updatedDate;

        public int? ownerStatusID;
        public LcEnum.OwnerStatus ownerStatus
        {
            get
            {
                if (ownerStatusID.HasValue)
                {
                    return (LcEnum.OwnerStatus)ownerStatusID;
                }
                else
                {
                    return LcEnum.OwnerStatus.notYetAnOwner;
                }
            }
        }
        public DateTime? ownerAnniversaryDate;

        // Automatic field right now, but is better
        // to communicate it than to expect the App or API client
        // to build it. It allows for future optimizations, like
        // move to static content URLs.
        public string photoUrl
        {
            get
            {
                return LcUrl.AppUrl + LcRest.Locale.Current.ToString() + "/Profile/Photo/" + userID + "?v=" + updatedDate.ToString("s");
            }
        }
        #endregion

        public static UserProfile FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserProfile
            {
                userID = record.userID,
                email = record.email,

                firstName = record.firstName,
                lastName = record.lastName,
                secondLastName = record.secondLastName,
                businessName = record.businessName,

                alternativeEmail = record.alternativeEmail,
                phone = record.phone,
                canReceiveSms = record.canReceiveSms,
                birthMonthDay = record.birthMonthDay,
                birthMonth = record.birthMonth,

                isServiceProfessional = record.isServiceProfessional,
                isClient = record.isClient,
                isCollaborator = record.isCollaborator,

                onboardingStep = record.onboardingStep,
                accountStatusID = record.accountStatusID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,

                ownerStatusID = record.ownerStatusID,
                ownerAnniversaryDate = record.ownerAnniversaryDate
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
            ,businessName

            -- User Type
            ,isProvider as isServiceProfessional
            ,isCustomer as isClient
            ,isCollaborator

            ,alternativeEmail
            ,mobilePhone as phone
            ,canReceiveSms
            ,birthMonthDay
            ,birthMonth
                        
            ,onboardingStep
            ,accountStatusID
            ,createdDate
            ,updatedDate

            ,ownerStatusID
            ,ownerAnniversaryDate

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
        ,@businessName nvarchar(145)

        ,@AlternativeEmail nvarchar(56)
        ,@Phone varchar(20)
        ,@CanReceiveSms bit
        ,@BirthMonthDay int
        ,@BirthMonth int

        SET @UserID = @0
        SET @FirstName = @1
        SET @LastName = @2
        SET @SecondLastName = @3
        SET @businessName = @4
        SET @AlternativeEmail = @5
        SET @Phone = @6
        SET @CanReceiveSms = @7
        SET @BirthMonthDay = @8
        SET @BirthMonth = @9

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
                ,BusinessName = @businessName

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
        public static UserProfile Get(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlSelectProfile, userID));
            }
        }

        public static string GetEmail(int userID)
        {
            using (var db = new LcDatabase())
            {
                return (string)db.QueryValue(@"
                    SELECT email FROM UserProfile WHERE UserID = @0
                ", userID);
            }
        }

        public static bool Exists(int userID)
        {
            return Get(userID) != null;
        }
        #endregion

        #region Create/Update
        public static void Set(UserProfile profile)
        {
            using (var db = Database.Open("sqlloco"))
            {

                db.Execute(sqlUpdateProfile,
                    profile.userID,
                    profile.firstName,
                    profile.lastName,
                    profile.secondLastName,
                    profile.businessName,
                    profile.alternativeEmail,
                    profile.phone,
                    profile.canReceiveSms,
                    profile.birthMonthDay,
                    profile.birthMonth
                );
            }
        }
        #endregion

        #region Membership / OwnerStatus
        /* Notes: serialized values of SubscriptionStatus
         * Braintree.SubscriptionStatus.STATUSES.Select(s => s.ToString());
            string "Active"
            string "Canceled"
            string "Expired"
            string "Past Due"
            string "Pending"
         */
        /// <summary>
        /// Run membership requirements checks and returns
        /// the OwnerStatus that belongs the user based on that
        /// (but is not saved and previous status is not checked).
        /// </summary>
        /// <param name="userID"></param>
        /// <returns>Status based on requirements</returns>
        public static LcEnum.OwnerStatus CheckOwnerStatus(int userID)
        {
            // Check all requirements
            if (MeetsListingRequirement(userID) &&
                // Per comment at #334, disable for now (low entry barriers)
                //MeetsBookingsRequirement(userID) &&
                MeetsAcknowledgmentRequirement(userID) &&
                MeetsPaymentRequirement(userID))
            {
                // It's OK
                return LcEnum.OwnerStatus.active;
            }
            else
            {
                // It failed
                var status = UserPaymentPlan.GetLastPaymentPlanStatus(userID);
                if (status == Braintree.SubscriptionStatus.CANCELED)
                {
                    return LcEnum.OwnerStatus.cancelled;
                }
                else if (status == Braintree.SubscriptionStatus.EXPIRED)
                {
                    return LcEnum.OwnerStatus.suspended;
                }
                else
                {
                    return LcEnum.OwnerStatus.inactive;
                }
            }
        }

        /// <summary>
        /// A change in the OwnerStatus is allowed following an strict flow.
        /// This index defines what status changes are valid coming from a given status
        /// From a status -> To status (each one in the list)
        /// </summary>
        private static Dictionary<LcEnum.OwnerStatus, HashSet<LcEnum.OwnerStatus>> 
            AllowedOwnerStatusChanges = new Dictionary<LcEnum.OwnerStatus, HashSet<LcEnum.OwnerStatus>>
        {
            // If current status is 'notYetAnOwner' (null or zero at database --means never an owner before),
            // is only allowed to change it to InTrial, Active.
            // From
            { LcEnum.OwnerStatus.notYetAnOwner, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.trialEnded,
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.trialEnded, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active,
                LcEnum.OwnerStatus.cancelled
            } },
            // From
            { LcEnum.OwnerStatus.active, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.trialEnded,
                LcEnum.OwnerStatus.inactive,
                LcEnum.OwnerStatus.cancelled,
                LcEnum.OwnerStatus.suspended
            } },
            // From
            { LcEnum.OwnerStatus.cancelled, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.suspended, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.inactive, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active,
                LcEnum.OwnerStatus.cancelled,
                LcEnum.OwnerStatus.suspended
            } }
        };

        /// <summary>
        /// Set the user OwnerStatus in database, only if different from current
        /// one, and saving a status history entry.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="status"></param>
        public static void SetOwnerStatus(int userID, LcEnum.OwnerStatus status)
        {
            var user = Get(userID);
            if (user.ownerStatus != status)
            {
                // The update is allowed only if the 'status flow' is met
                var validChanges = AllowedOwnerStatusChanges[user.ownerStatus];
                var allowChange = validChanges.Contains(status);

                // Save on database, with a new entry at the status history
                if (allowChange)
                {
                    using (var db = new LcDatabase())
                    {
                        var statusID = (status == LcEnum.OwnerStatus.notYetAnOwner ? null : (int?)status);
                        db.Execute(@"
                            BEGIN TRANSACTION

                            INSERT INTO OwnerStatusHistory (
                                UserID, OwnerStatusID, OwnerStatusChangedDate, OwnerStatusChangedBy
                            ) VALUES (
                                @0, @1, getdate(), 'sys'
                            )

                            UPDATE Users SET OwnerStatusID = @1
                            WHERE UserID = @0

                            -- First time user enters 'active' status,
                            -- set the anniversary date.
                            -- Impl: we check if is active:2 and inside set date as current only if null
                            IF @1 = 2 begin
                                UPDATE Users SET OwnerAnniversaryDate = getdate()
                                WHERE UserID = @0 AND OwnerAnniversaryDate is null
                            END

                            COMMIT TRANSACTION
                        ", userID, statusID);
                    }
                }
            }
        }

        /// <summary>
        /// Checks the membership requirements of the user and
        /// if there is a status change is saved at database.
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static LcEnum.OwnerStatus CheckAndSaveOwnerStatus(int userID)
        {
            var status = CheckOwnerStatus(userID);
            SetOwnerStatus(userID, status);
            return status;
        }

        #region Membership requirements checks
        public static bool MeetsListingRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasListing bit = 0

            -- Firts: ensure all account and listing requirements are tested
            -- before we check listing status
            EXEC TestAllUserAlerts @userID

            -- Check Listing
            IF EXISTS (
				SELECT *
				FROM userprofilepositions
				WHERE UserID = @UserID
					AND Active = 1
					AND StatusID = 1 -- active and publicly visible
			)
			BEGIN
				SET @hasListing = 1
			END

            SELECT @hasListing
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }

        public static bool MeetsBookingsRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasBookings bit = 0

			IF 2 <= (
				SELECT count(*)
				FROM booking
				WHERE ServiceProfessionalUserID = @UserID
					AND ClientUserID <> @UserID
					AND BookingStatusID = 8 -- completed
			)
			BEGIN
				SET @hasBookings = 1
			END

            SELECT @hasBookings
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }

        public static bool MeetsPaymentRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasPaid bit = 0

			IF EXISTS (
				SELECT *
				FROM UserPaymentPlan
				WHERE UserID = @UserID
					AND PlanStatus IN ('Active', 'Past Due')
					-- extra check for 'current plan'
					AND SubscriptionEndDate is null
			)
			BEGIN
				SET @hasPaid = 1
			END

            SELECT @hasPaid
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }

        public static bool MeetsAcknowledgmentRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasAcknowledgment bit = 0

			IF EXISTS (
				SELECT *
				FROM OwnerAcknowledgment
				WHERE UserID = @UserID
					AND DateAcknowledged is not null
			)
			BEGIN
				SET @hasAcknowledgment = 1
			END

            SELECT @hasAcknowledgment
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }
        #endregion
        #endregion
    }
}