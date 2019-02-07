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
        public string language;
        #endregion

        #region Instances
        public JobTitleServiceAttributes() { }
        #endregion

        #region Fetch
        public static JobTitleServiceAttributes Get(int jobTitleID, string language)
        {
            var data = new JobTitleServiceAttributes();
            data.jobTitleID = jobTitleID;
            data.language = language;
            data.serviceAttributes = ServiceAttribute.GetGroupedJobTitleAttributes(jobTitleID, language);
            data.experienceLevels = ExperienceLevel.GetList(language);

            return data;
        }
        #endregion
    }
}