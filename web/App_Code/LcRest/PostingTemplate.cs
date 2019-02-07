using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class PostingTemplate
    {
        #region Fields
        public int postingTemplateID;
        public string name;
        public DateTimeOffset updatedDate;
        public IEnumerable<PostingTemplateQuestion> questions;
        #endregion

        #region Instances
        public PostingTemplate() { }

        public static PostingTemplate FromDB(dynamic record, bool fillQuestions = false)
        {
            if (record == null) return null;
            var r = new PostingTemplate
            {
                postingTemplateID = record.postingTemplateID,
                name = record.name,
                updatedDate = record.updatedDate
            };
            if (fillQuestions)
            {
                r.questions = PostingTemplateQuestion.List(r.postingTemplateID);
            }
            return r;
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGet = @"
            SELECT
                p.postingTemplateID,
                p.name,
                p.createdDate,
                p.updatedDate,
                p.modifiedBy
            FROM PostingTemplate as P
                WHERE P.postingTemplateID = @0
        ";
        #endregion

        public static PostingTemplate Get(int postingTemplateID, string language, bool fillQuestions)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGet, postingTemplateID, language), fillQuestions);
            }
        }
        #endregion
    }
}
