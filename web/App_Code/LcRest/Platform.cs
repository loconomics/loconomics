using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class Platform
    {
        #region Fields
        public int platformID;
        public int languageID;
        public int countryID;
        public string name;
        public string shortDescription;
        public string longDescription;
        public string[] feesDescription;
        public string[] positiveAspects;
        public string[] negativeAspects;
        public string[] advice;
        public string signUpURL;
        public string signInURL;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instances
        public Platform() { }

        private static string[] ParseJsonTextList(string dbText)
        {
            if (string.IsNullOrWhiteSpace(dbText)) return new string[] { "" };
            return (string[])Newtonsoft.Json.JsonConvert.DeserializeObject(dbText, typeof(string[]));
        }

        public static Platform FromDB(dynamic record)
        {
            if (record == null) return null;
            // We need to apply some special transformations here:
            // Several fields are expected to be JSON for lists
            return new Platform
            {
                platformID = record.platformID,
                languageID = record.languageID,
                countryID = record.countryID,
                name = record.name,
                shortDescription = record.shortDescription,
                longDescription = record.longDescription,
                feesDescription = ParseJsonTextList((string)record.feesDescription),
                positiveAspects = ParseJsonTextList((string)record.positiveAspects),
                negativeAspects = ParseJsonTextList((string)record.negativeAspects),
                advice = ParseJsonTextList((string)record.advice),
                signUpURL = record.signUpURL,
                signInURL = record.signInURL,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetList = @"
            SELECT
                platformID,
                languageID,
                countryID,
                name,
                shortDescription,
                longDescription,
                feesDescription,
                positiveAspects,
                negativeAspects,
                advice,
                signUpURL,
                signInURL,
                updatedDate
            FROM Platform
            WHERE LanguageID = @0 AND CountryID = @1
        ";
        const string sqlGetItem = sqlGetList + @"
        AND platformID = @2
    ";
        #endregion

        public static IEnumerable<Platform> GetList(int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, languageID, countryID).Select(FromDB);
            }
        }
        public static Platform Get(int platformID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, platformID, languageID, countryID));
            }
        }
        #endregion
    }
}
