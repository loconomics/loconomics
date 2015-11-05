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
    public class JobTitleServiceAttributes
    {
        #region Fields
        public int jobTitleID;
        public IEnumerable<ServiceAttributeCategory> serviceAttributes;
        public IEnumerable<ExperienceLevel> experienceLevels;
        public int languageID;
        public int countryID;
        #endregion

        #region Instances
        public JobTitleServiceAttributes() { }
        #endregion

        #region Fetch
        public static JobTitleServiceAttributes Get(int jobTitleID, int languageID, int countryID)
        {
            var data = new JobTitleServiceAttributes();
            data.jobTitleID = jobTitleID;
            data.languageID = languageID;
            data.countryID = countryID;
            data.serviceAttributes = ServiceAttribute.GetGroupedJobTitleAttributes(jobTitleID, languageID, countryID);
            data.experienceLevels = ExperienceLevel.GetList(languageID, countryID);

            return data;
        }
        #endregion
    }
}