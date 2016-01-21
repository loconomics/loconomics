using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Public user data for a search result querying for all providers of a specific job-title
    /// </summary>
    public class UserSearchResult
    {
        #region Fields
        public int userID;
        private int jobTitleID;
        public string firstName;
        public string lastName;
        public string secondLastName;
        public string businessName;
        public string jobTitles;

        /// <summary>
        /// Same as in PublicUserProfile
        /// Automatic field right now, but is better
        /// to communicate it than to expect the App or API client
        /// to build it. It allows for future optimizations, like
        /// move to static content URLs.
        /// </summary>
        public string photoUrl
        {
            get
            {
                return LcUrl.AppUrl + LcRest.Locale.Current.ToString() + "/profile/photo/" + userID;
            }
        }
        #endregion

        #region Links
        public PublicUserRating rating;
        public PublicUserVerificationsSummary verificationsSummary;
        public PublicUserStats stats;
        public PublicUserJobStats jobStats;

        public void FillLinks()
        {
            rating = LcRest.PublicUserRating.Get(userID, jobTitleID);
            verificationsSummary = LcRest.PublicUserVerificationsSummary.Get(userID, jobTitleID);
            stats = LcRest.PublicUserStats.Get(userID);
            jobStats = LcRest.PublicUserJobStats.Get(userID, jobTitleID);
        }
        #endregion

        #region Instances
        public static UserSearchResult FromDB(dynamic record, bool fillLinks = false)
        {
            if (record == null) return null;
            var r = new UserSearchResult
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                firstName = record.firstName,
                lastName = record.lastName,
                secondLastName = record.secondLastName,
                businessName = record.businessName,
                jobTitles = record.jobTitles
            };
            r.FillLinks();
            return r;
        }
        #endregion

        #region Fetch
        public static IEnumerable<UserSearchResult> SearchByJobTitle(string jobTitleSingularName, string city, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query("EXEC dbo.SearchProvidersByPositionSingular @0, @1, @2, @3", locale.languageID, locale.countryID, jobTitleSingularName, city)
                    .Select(x => (UserSearchResult)FromDB(x, true));
            }
        }
        #endregion
    }
}