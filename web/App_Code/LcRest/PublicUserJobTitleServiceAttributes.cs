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
        public string language;
        #endregion

        #region Instances
        public PublicUserJobTitleServiceAttributes() { }
        #endregion

        #region Fetch
        public static PublicUserJobTitleServiceAttributes Get(int userID, int jobTitleID, string language)
        {
            var data = new PublicUserJobTitleServiceAttributes();
            data.userID = userID;
            data.jobTitleID = jobTitleID;
            data.language = language;
            data.serviceAttributes = ServiceAttribute.GetGroupedUserJobTitleAttributes(jobTitleID, userID, language);
            var experienceID = UserJobTitleServiceAttributes.GetExperienceLevelID(userID, jobTitleID, language);
            data.experienceLevel = ExperienceLevel.GetItem(experienceID, language);

            return data;
        }
        #endregion  
    }
}