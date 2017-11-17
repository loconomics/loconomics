using System;

namespace LcRest
{
    /// <summary>
    /// Lead Generation APIs: newsletter, referral
    /// </summary>
    public class LeadGeneration
    {
        #region Newsletter
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
        #endregion
    }
}
