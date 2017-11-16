using System;

namespace LcRest
{
    /// <summary>
    /// Lead Generation APIs: newsletter, referral
    /// </summary>
    public class LeadGeneration
    {
        #region Newsletter
        public static void PostNewsletter(string email, bool isServiceProfessional, string marketingSource, Locale locale)
        {
            var emailExists = Client.CheckEmailAvailability(email) > 0;

            if (emailExists)
            {
                throw new Exception("Email is already registered, please log-in or request a password reset");
            }

            var additionalSource = "&lead-generation=newsletter";
            var utm = (marketingSource ?? "") + additionalSource;
            var userID = 0;

            using (var db = new LcDatabase())
            {
                userID = (int)db.QueryValue(@"
                    DECLARE @UserID int

                    BEGIN TRANSACTION;

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

                    COMMIT TRANSACTION;
                    SELECT @UserID
                ",
                email,
                isServiceProfessional,
                utm,
                locale.languageID,
                locale.countryID);
            }

            //LcMessaging.SendNewsletterSubscription(userID, email);
        }
        #endregion
    }
}
