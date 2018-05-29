using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Represents the set of responses to a posting question, referencing
    /// the question that belongs to.
    /// </summary>
    public class UserPostingQuestionResponse
    {
        public int userPostingID;
        public int questionID;
        public int questionTypeID;
        public string question;
        public string helpBlock;
        public IEnumerable<QuestionOption> options;
        public IEnumerable<QuestionResponse> responses;
        public string legend;
        public IDictionary<int, int> branchLogic;

        public UserPostingQuestionResponse() { }

        public static UserPostingQuestionResponse FromDB(dynamic record)
        {
            if (record == null) return null;
            var responseText = (string)record.responses;
            List<QuestionResponse> responses = new List<QuestionResponse>();
            if (!string.IsNullOrWhiteSpace(responseText))
            {
                responses = (List<QuestionResponse>)Newtonsoft.Json.JsonConvert.DeserializeObject(
                    responseText, typeof(List<QuestionResponse>)
                );
            }
            var optionsText = (string)record.options;
            List<QuestionOption> options = new List<QuestionOption>();
            if (!string.IsNullOrWhiteSpace(optionsText))
            {
                options = (List<QuestionOption>)Newtonsoft.Json.JsonConvert.DeserializeObject(
                    optionsText, typeof(List<QuestionOption>)
                );
            }
            var branchLogicText = (string)record.branchLogic;
            var branchLogic = new Dictionary<int, int>();
            if (!string.IsNullOrWhiteSpace(branchLogicText))
            {
                branchLogic = (Dictionary<int, int>)Newtonsoft.Json.JsonConvert.DeserializeObject(
                    branchLogicText, typeof(Dictionary<int, int>)
                );
            }
            return new UserPostingQuestionResponse
            {
                userPostingID = record.userPostingID,
                questionID = record.questionID,
                questionTypeID = record.questionTypeID,
                question = record.question,
                helpBlock = record.helpBlock,
                options = options,
                responses = responses,
                legend = record.legend,
                branchLogic = branchLogic
            };
        }

        const string sqlList = @"
            SELECT
                userPostingID,
                questionID,
                questionTypeID,
                question,
                helpBlock,
                options,
                responses,
                legend,
                branchLogic
            FROM UserPostingQuestionResponse
            WHERE userPostingID = @0
        ";

        public static IEnumerable<UserPostingQuestionResponse> List(int userPostingID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlList, userPostingID).Select(FromDB);
            }
        }

        const string sqlInsert = @"
            INSERT INTO UserPostingQuestionResponse (
                userPostingID,
                questionID,
                questionTypeID,
                question,
                helpBlock,
                legend,
                options,
                responses,
                branchLogic
            ) VALUES (
                @0, @1, @2, @3,
                @4, @5,
                @6, @7, @8
            )
        ";

        public static void Insert(UserPostingQuestionResponse entry, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.Execute(sqlInsert, entry.userPostingID, entry.questionID, entry.questionTypeID, entry.question,
                    entry.helpBlock, entry.legend,
                    Newtonsoft.Json.JsonConvert.SerializeObject(entry.options),
                    Newtonsoft.Json.JsonConvert.SerializeObject(entry.responses),
                    Newtonsoft.Json.JsonConvert.SerializeObject(entry.branchLogic));
            }
        }

        const string sqlUpdate = @"
            UPDATE UserPostingQuestionResponse SET
                responses = @2
            WHERE
                userPostingID = @0
                 AND
                questionID = @1
        ";

        public static void Update(UserPostingQuestionResponse entry, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                db.Execute(sqlUpdate, entry.userPostingID, entry.questionID,
                    Newtonsoft.Json.JsonConvert.SerializeObject(entry.responses));
            }
        }
    }
}
