using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Public User profile information from a subset of [users] table
    /// for the REST API when accessed by other users (public fields are
    /// more limited than ones the owner user can see),
    /// and static methods for database operations.
    /// Some fields are empty/null because of level of rights, exposed
    /// only to requester users that has a relationship with the requested
    /// user profile (thats, there is a ServiceProfessionalClient record for the pair).
    /// Records are not returned if profile is not enabled
    /// </summary>
    public class PublicUserProfile
    {
        #region Fields
        public int userID;
        public string firstName;
        public string lastName;
        public string secondLastName;
        public string businessName;
        public string publicBio;
        public string serviceProfessionalProfileUrlSlug;
        public string serviceProfessionalWebsiteUrl;

        /// <summary>
        /// This full URL is not editable directly, just
        /// a computed using the Loconomics URL and
        /// the service professional choosen 'slug', or fallback
        /// to the standard URL.
        /// </summary>
        public string serviceProfessionalProfileUrl
        {
            get
            {
                var url = MarketplaceProfile.BuildServiceProfessionalCustomURL(serviceProfessionalProfileUrlSlug);
                if (String.IsNullOrWhiteSpace(url))
                {
                    // Gets the standard, base URL provided by Loconomics.
                    // It's a SEO friendly URL that additionally to the userID
                    // contains information like the city and the primary
                    // job title name (if some information is missed it fallbacks
                    // to the non-SEO, ID based, URL, ever a valid address).
                    return LcUrl.SiteUrl + LcData.UserInfo.GetUserPublicURL(this.userID);
                }
                else
                {
                    return url;
                }
            }
        }

        /// Fields protected, empty/null except for users that has a relationship together
        public string email;
        public string phone;

        // Automatic field right now, but is better
        // to communicate it than to expect the App or API client
        // to build it. It allows for future optimizations, like
        // move to static content URLs.
        public string photoUrl
        {
            get
            {
                return LcUrl.AppUrl + LcRest.Locale.Current.ToString() + "/Profile/Photo/" + userID;
            }
        }

        public bool isServiceProfessional;
        public bool isClient;
        // TODO To decide if expose this publicly
        //public bool isMember;

        public DateTime updatedDate;
        #endregion

        public static PublicUserProfile FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserProfile
            {
                userID = record.userID,
                email = record.email,

                firstName = record.firstName,
                lastName = record.lastName,
                secondLastName = record.secondLastName,

                publicBio = record.publicBio,

                serviceProfessionalProfileUrlSlug = record.serviceProfessionalProfileUrlSlug,
                serviceProfessionalWebsiteUrl = record.serviceProfessionalWebsiteUrl,
                businessName = record.businessName,

                phone = record.phone,

                isServiceProfessional = record.isServiceProfessional,
                isClient = record.isClient,
                //isMember = record.isMember,

                updatedDate = record.updatedDate
            };
        }

        #region SQL
        private const string sqlSelectProfile = @"
        SELECT TOP 1
            -- ID
            Users.userID

            -- Name
            ,firstName
            ,lastName
            ,secondLastName
            ,businessName
            ,publicBio

            -- User Type
            ,isProvider as isServiceProfessional
            ,isCustomer as isClient
            ,isMember

            ,CASE WHEN PC.Active = 1 THEN UP.email ELSE null END as Email
            ,CASE WHEN PC.Active = 1 THEN Users.MobilePhone ELSE null END As phone
            ,CASE WHEN PC.Active = 1 THEN providerWebsiteUrl ELSE null END as serviceProfessionalWebsiteUrl
            
            ,providerProfileUrl as serviceProfessionalProfileUrlSlug

            ,Users.updatedDate

        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
                LEFT JOIN
            ServiceProfessionalClient As PC
                ON
                (   PC.ServiceProfessionalUserID = @0 AND PC.ClientUserID = @1
                 OR PC.ServiceProfessionalUserID = @1 AND PC.ClientUserID = @0 )
        WHERE Users.UserID = @0
          AND Users.Active = 1
        ";
        #endregion

        #region Fetch
        public static PublicUserProfile Get(int userID, int requesterUserID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlSelectProfile, userID, requesterUserID));
            }
        }
        #endregion
    }
}
