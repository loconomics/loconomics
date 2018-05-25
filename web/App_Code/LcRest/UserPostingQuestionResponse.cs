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
        public int questionID;
        public IEnumerable<QuestionResponse> responses;

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
            return new UserPostingQuestionResponse
            {
                questionID = record.questionID,
                responses = responses
            };
        }

        const string sqlList = @"
            SELECT questionID, responses
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
    }
}
