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
    public class JobTitleLicenses
    {
        #region Fields
        public int jobTitleID;
        public int licenseCertificationID;
        public int stateProvinceID;
        public int countryID;
        public bool required;
        public DateTime createdDate;
        public DateTime updatedDate;
        public string modifiedBy;
        public bool active;
        public string countryCode;
        public string stateProvinceCode;
        public string stateProvinceName;
        #endregion

        #region Link
        public JobTitleLicenses jobTitleLicenses;
        #endregion

        #region Instances
        public JobTitleLicenses() { }

        public static JobTitleLicenses FromDB(dynamic record)
        {
            if (record == null) return null;
            return new JobTitleLicenses
            {
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                stateProvinceID = record.stateProvinceID,
                countryID = record.countryID,
                required = record.required,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                modifiedBy = record.modifiedBy,
                active = record.active,
                countryCode = record.countryCode,
                stateProvinceCode = record.stateProvinceCode,
                stateProvinceName = record.stateProvinceName
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"
                SELECT
				PL.PositionID as jobTitleID,
				PL.licenseCertificationID,
				PL.stateProvinceID,
				PL.countryID,
				PL.languageID,
				PL.required,
				PL.createdDate,
				PL.updatedDate,
				PL.modifiedBy,
				PL.active,
				CY.countryCode,
                SP.stateProvinceCode,
                SP.stateProvinceName
				
            FROM
                jobTitleLicense As PL
                 INNER JOIN
                StateProvince As SP
                  ON PL.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                Country As CY
                  ON CY.CountryID = PL.CountryID AND CY.LanguageID = 1
            WHERE
                PL.PositionID in ('-1', @0)
                 AND
                PL.Active = 1
                AND
                PL.CountryID = @1
                AND
                PL.LanguageID = @2
                AND
                PL.StateProvinceID = @3

         ";
        #endregion

        public static IEnumerable<JobTitleLicenses> GetList(int jobTitleID,  Locale locale, int stateProvinceID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, jobTitleID, locale.countryID, locale.languageID, stateProvinceID).Select(FromDB);
            }
        }
        #endregion
  
            /// Note: On Update/Insert SQL, remember next: EXEC TestAlertProfessionalLicense @0, @1

    }
}