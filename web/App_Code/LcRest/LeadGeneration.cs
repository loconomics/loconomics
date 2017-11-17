using System;

namespace LcRest
{
    /// <summary>
    /// Lead Generation APIs: newsletter, referral
    /// </summary>
    public class LeadGeneration
    {
        #region Subscription
        /// <summary>
        /// Creates a new user from a subscription request (newsletter, referral), that has not active account
        /// (no password, no TOU accepted).
        /// </summary>
        /// <param name="email"></param>
        /// <param name="isServiceProfessional"></param>
        /// <param name="marketingSource"></param>
        /// <param name="locale"></param>
        public static int SubscribeNewUser(string email, bool isServiceProfessional, string marketingSource, Locale locale)
        {
            var emailExists = Client.CheckEmailAvailability(email) > 0;

            if (emailExists)
            {
                throw new Exception("Email is already registered, please log-in or request a password reset");
            }

            using (var db = new LcDatabase())
            {
                // If success, it returns the userID otherwise zero
                return (int)db.QueryValue(@"
                    DECLARE @UserID int

                    BEGIN TRANSACTION

                    -- Create UserProfile record to save email and generate UserID
                    INSERT INTO UserProfile (
                        Email
                    ) VALUES (
                        @0
                    )
                    SET @UserID = @@Identity

                    -- Create user account record, but account disabled
                    INSERT INTO Users (
		                UserID,
		                IsProvider,
		                IsCustomer,
                        AccountStatusID,
                        loconomicsMarketingCampaigns,

		                FirstName,
		                LastName,
		                MiddleIn,
		                SecondLastName,

                        marketingSource,
                        preferredLanguageID,
                        preferredCountryID,

		                CreatedDate,
		                UpdatedDate,
		                ModifiedBy,
		                Active
                    ) VALUES (
                        @UserID,
                        @1, -- Is professional
                        1, -- Is client
                        -1,
                        1,
                        
                        '',
                        '',
                        '',
                        '',

                        @2,
                        @3,
                        @4,

                        getdate(),
                        getdate(),
                        'sys',
                        1 -- Active
                    )

                    -- NOTE: since there is no Membership record with password, is not an actual Loconomics User Account
                    -- just what we need on this case
                    
                    IF @@ERROR <> 0
                        ROLLBACK TRANSACTION
                    ELSE
                        COMMIT TRANSACTION

                    SELECT @UserID
                ",
                email,
                isServiceProfessional,
                marketingSource,
                locale.languageID,
                locale.countryID);
            }
        }
        /// <summary>
        /// Updates an existent subscription, identified by the given userID and email, providing
        /// the first and last name.
        /// We require this 'double key' (userID, email) rather than just userID in order to prevent fake calls to the API with
        /// random IDs, this way the sender must now both values or the operation fails.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="email"></param>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        public static void UpdateSubscription(int userID, string email, string firstName, string lastName)
        {
            var existentUserID = Client.CheckEmailAvailability(email);
            if (existentUserID != userID)
            {
                throw new Exception("Invalid user");
            }
            using (var db = new LcDatabase())
            {
                // If success, it returns the userID otherwise zero
                db.QueryValue(@"
                    UPDATE users SET
                        firstName = @1,
                        lastName = @2,
                        updatedDate = getdate(),
                        modifiedBy = 'sys'
                    WHERE userID = @0
                ",
                userID,
                firstName,
                lastName);
            }
        }
        #endregion
    }
}
