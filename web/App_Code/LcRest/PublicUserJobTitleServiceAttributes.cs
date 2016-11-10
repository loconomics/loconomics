using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// The public part of UserJobTitleServiceAttributes, that instead of just IDs
    /// returns labels (names, descriptions,..) as part of the information to show
    /// to clients, so the use of the API does not requires additional lookups to
    /// other endpoints.
    /// </summary>
    public class PublicUserJobTitleServiceAttributes
    {
        #region Fields
        public int userID;
        public int jobTitleID;
        public IEnumerable<PublicServiceAttributeCategory> serviceAttributes;
        public ExperienceLevel experienceLevel;
        public int languageID;
        public int countryID;
        #endregion

        #region Instances
        public PublicUserJobTitleServiceAttributes() { }
        #endregion

        #region Fetch
        public static PublicUserJobTitleServiceAttributes Get(int userID, int jobTitleID, int languageID, int countryID)
        {
            var data = new PublicUserJobTitleServiceAttributes();
            data.userID = userID;
            data.jobTitleID = jobTitleID;
            data.languageID = languageID;
            data.countryID = countryID;
            data.serviceAttributes = ServiceAttribute.GetGroupedUserJobTitleAttributes(jobTitleID, userID, languageID, countryID);
            var experienceID = UserJobTitleServiceAttributes.GetExperienceLevelID(userID, jobTitleID, languageID, countryID);
            data.experienceLevel = ExperienceLevel.GetItem(experienceID, languageID, countryID);

            return data;
        }
        #endregion  
    }
}