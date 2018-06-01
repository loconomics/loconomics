using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class PostingTemplateQuestion
    {
        #region Fields
        public int questionID;
        public string legend;
        public int questionTypeID;
        public string question;
        public string helpBlock;
        public IDictionary<string, int> branchLogic;
        public IEnumerable<QuestionOption> options;
        #endregion

        #region Instances
        public PostingTemplateQuestion() { }

        public static PostingTemplateQuestion FromDB(dynamic record)
        {
            if (record == null) return null;
            var optionsText = (string)record.options;
            List<QuestionOption> options = new List<QuestionOption>();
            if (!string.IsNullOrWhiteSpace(optionsText))
            {
                options = (List<QuestionOption>)Newtonsoft.Json.JsonConvert.DeserializeObject(
                    optionsText, typeof(List<QuestionOption>)
                );
            }
            var branchLogicText = (string)record.branchLogic;
            var branchLogic = new Dictionary<string, int>();
            if (!string.IsNullOrWhiteSpace(branchLogicText))
            {
                branchLogic = (Dictionary<string, int>)Newtonsoft.Json.JsonConvert.DeserializeObject(
                    branchLogicText, typeof(Dictionary<string, int>)
                );
            }
            return new PostingTemplateQuestion
            {
                questionID = record.questionID,
                questionTypeID = record.questionTypeID,
                question = record.question,
                helpBlock = record.helpBlock,
                options = options,
                legend = record.legend,
                branchLogic = branchLogic
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGet = @"
            SELECT
                Q.questionID,
                Q.questionTypeID,
                Q.question,
                Q.helpBlock,
                Q.options,
                P.legend,
                P.branchLogic
            FROM Question as Q
                INNER JOIN postingTemplateQuestion as P
                 ON Q.questionID = P.questionID
            WHERE P.postingTemplateID = @0
        ";
        #endregion

        public static IEnumerable<PostingTemplateQuestion> List(int postingTemplateID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGet, postingTemplateID).Select(FromDB);
            }
        }
        #endregion
    }
}
