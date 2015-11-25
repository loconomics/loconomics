using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// LicenseCertification
    /// </summary>
    public class LicenseCertification
    {
        #region Fields
        public int licenseCertificationID;
        public string name;
        public string description;
        public string stateProvinceCode;
        public string countryCode;
        public string authority;
        public string verificationWebsiteUrl;
        public string howToGetLicensedUrl;
        public string optionGroup;
        public DateTime createdDate;
        public DateTime udpatedDate;
        #endregion

        #region Instances
        public LicenseCertification() {}

        public static LicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new LicenseCertification
            {
                licenseCertificationID = record.licenseCertificationID,
                name = record.name,
                description = record.description,
                stateProvinceCode = record.stateProvinceCode,
                countryCode = record.countryCode,
                authority = record.authority,
                verificationWebsiteUrl = record.verificationWebsiteUrl,
                howToGetLicensedUrl = record.howToGetLicensedUrl,
                optionGroup = record.optionGroup,
                createdDate = record.createdDate,
                udpatedDate = record.udpatedDate
            };
        }
        #endregion
    }
}