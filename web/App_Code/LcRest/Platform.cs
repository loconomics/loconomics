﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class Platform
    {
        #region Fields
        public int platformID;
        public string language;
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
                language = record.language,
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
        const string sqlSelect = @"
            SELECT
                p.platformID,
                p.language,
                p.name,
                p.shortDescription,
                p.longDescription,
                p.feesDescription,
                p.positiveAspects,
                p.negativeAspects,
                p.advice,
                p.signUpURL,
                p.signInURL,
                p.updatedDate
            FROM Platform as P
        ";
        const string sqlGetUserList = sqlSelect + @"
            WHERE
                P.PlatformID IN (
                    SELECT JP.PlatformID
                    FROM JobTitlePlatform as JP
                    JOIN UserProfilePositions as J
                    ON (JP.JobTitleID = J.PositionID OR JP.JobTitleID = -1)
                    AND JP.Language = J.Language
                    AND J.Active = 1
                    AND J.StatusID > 0
                    WHERE P.PlatformID = JP.PlatformID
                    AND P.Language = JP.Language
                    AND P.Active = 1
                    AND JP.Active = 1
                    AND J.UserID = @0
                )
                AND P.Language = @1
        ";
        const string sqlGetUserItem = sqlGetUserList + @"
                AND P.platformID = @2
        ";
        const string sqlGetItem = sqlSelect + @"
                WHERE P.platformID = @0
        ";
        #endregion

        public static IEnumerable<Platform> GetList(int userID, string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetUserList, userID, language).Select(FromDB);
            }
        }
        public static Platform Get(int userID, int platformID, string language)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetUserItem, userID, language, platformID));
            }
        }
        public static Platform GetItem(int platformID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, platformID));
            }
        }
        #endregion

        #region Fetch Public Full List
        const string sqlGetFullList = sqlSelect + @"
            WHERE
                P.Language = @0
        ";
        public static IEnumerable<Platform> GetFullList(string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetFullList, language).Select(FromDB);
            }
        }
        #endregion
    }
}
