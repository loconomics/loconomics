using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// User profile information from a subset of [users] table plus partner specific fields
    /// provided to partner administrators for listing and management.
    /// Take into account that there are diverse types of partner users, as students/professionals,
    /// teachers, admin and clients/organizations that works closely with the partner.
    /// </summary>
    public class PartnerUser
    {
        #region Fields
        public int userID;
        public string email;

        public string firstName;
        public string lastName;
        public string secondLastName;
        public string businessName;

        public bool isServiceProfessional;
        public bool isClient;
        public bool isOrganization;

        public string orgName;
        public string orgDescription;
        public string orgWebsite;

        // Specific partnership fields
        public string partner;
        public string partnerUserType;
        public int? institutionID;
        public int? fieldOfStudyID;
        public DateTimeOffset? planExpirationDate;
        public int? studentID;

        public int accountStatusID;
        public DateTime createdDate;
        public DateTime updatedDate;
        public int countryID;
        public int languageID;

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

        public static PartnerUser FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PartnerUser
            {
                userID = record.userID,
                email = record.email,

                firstName = record.firstName,
                lastName = record.lastName,
                secondLastName = record.secondLastName,
                businessName = record.businessName,

                isServiceProfessional = record.isServiceProfessional,
                isClient = record.isClient,
                isOrganization = record.isOrganization,

                orgName = record.orgName,
                orgDescription = record.orgDescription,
                orgWebsite = record.orgWebsite,

                partner = record.partner,
                partnerUserType = record.partnerUserType,
                institutionID = record.institutionID,
                fieldOfStudyID = record.fieldOfStudyID,
                planExpirationDate = record.planExpirationDate,
                studentID = record.studentID,

                accountStatusID = record.accountStatusID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                languageID = record.languageID,
                countryID = record.countryID
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
            ,isOrganization
                        
            ,accountStatusID
            ,createdDate
            ,Users.updatedDate
            ,PreferredLanguageID as languageID
            ,PreferredCountryID as countryID

            ,O.orgName
            ,O.orgDescription
            ,O.orgWebsite

            ,'ccc' as partner
            ,ccc.userType as partnerUserType
            ,ccc.institutionID as institutionID
            ,ccc.fieldOfStudyID as fieldOfStudyID
            ,ccc.planExpirationDate as planExpirationDate
            ,ccc.studentID as studentID

        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
                INNER JOIN
            CCCUsers As ccc
                ON ccc.userID = Users.UserID
                LEFT JOIN
            userOrganization As O
                ON O.userID = Users.UserID
        ";
        private const string sqlGetUser = sqlSelectProfile + @"
        WHERE
            Users.UserID = @0
            AND Active = 1
        ";
        private const string sqlListAll = sqlSelectProfile + @"
        WHERE Active = 1
        ";
        #endregion

        #region Fetch
        /// <summary>
        /// Get an user matching the ID being part of the partner
        /// </summary>
        /// <param name="partner"></param>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static PartnerUser Get(string partner, int userID)
        {
            // IMPORTANT: Currently, there is only one partner and the DB design is not generic to perform
            // proper filtering and that, so we just throw if wrong partner value is given
            if (partner != "ccc")
            {
                throw new ConstraintException("Wrong partner");
            }
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlSelectProfile, userID));
            }
        }

        /// <summary>
        /// Get a full list of users of the partner
        /// </summary>
        /// <param name="partner"></param>
        /// <returns></returns>
        public static IEnumerable<PartnerUser> List(string partner)
        {
            // IMPORTANT: Currently, there is only one partner and the DB design is not generic to perform
            // proper filtering and that, so we just throw if wrong partner value is given
            if (partner != "ccc")
            {
                throw new ConstraintException("Wrong partner");
            }
            using (var db = new LcDatabase())
            {
                return db.Query(sqlListAll, partner).Select(FromDB);
            }
        }
        #endregion
    }
}