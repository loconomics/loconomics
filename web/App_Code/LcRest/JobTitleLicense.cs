using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace LcRest
{   
    /// <summary>
    /// Job Title Licenses (required and supplemental)
    /// </summary>
    public class JobTitleLicense
    {
        #region Fields
        public IEnumerable<JobTitleMunicipalLicense> municipality;
        public IEnumerable<JobTitleCountyLicense> county;
        public IEnumerable<JobTitleStateProvinceLicense> stateProvince;
        public IEnumerable<JobTitleCountryLicense> country;
        #endregion

        #region Instances
        public JobTitleLicense() { }
        #endregion

        #region Fetch
        public static JobTitleLicense Get(int userID, int jobTitleID, int languageID)
        {
            var data = new JobTitleLicense();
            data.municipality =  JobTitleMunicipalLicense.GetList(userID, jobTitleID, languageID);
            data.county =  JobTitleCountyLicense.GetList(userID, jobTitleID, languageID);
            data.stateProvince =  JobTitleStateProvinceLicense.GetList(userID, jobTitleID, languageID);
            data.country = JobTitleCountryLicense.GetList(userID, jobTitleID, languageID);
            return data;
        }
        #endregion  
    }
}