using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class ExperienceLevel
    {
        #region Fields
        public int experienceLevelID;
        public string name;
        public string description;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public ExperienceLevel() { }

        public static ExperienceLevel FromDB(dynamic record)
        {
            if (record == null) return null;
            return new ExperienceLevel
            {
                experienceLevelID = record.experienceLevelID,
                name = record.name,
                description = record.description,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        const string sqlGetList = @"
            SELECT  L.experienceLevelID,
                    L.ExperienceLevelName as name,
                    L.ExperienceLevelDescription as description,
                    L.updatedDate
            FROM    ExperienceLevel As L
            WHERE   L.Language = @0
        ";
        const string sqlGetItem = @"
            SELECT  TOP 1
                    L.experienceLevelID,
                    L.ExperienceLevelName as name,
                    L.ExperienceLevelDescription as description,
                    L.updatedDate
            FROM    ExperienceLevel As L
            WHERE   L.Language = @0 AND L.experienceLevelID = @1
        ";

        public static IEnumerable<ExperienceLevel> GetList(string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, language).Select(FromDB);
            }
        }

        public static ExperienceLevel GetItem(int experienceLevelID, string language)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, language, experienceLevelID));
            }
        }
        #endregion
    }
}