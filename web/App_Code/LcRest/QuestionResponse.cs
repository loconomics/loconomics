namespace LcRest
{
    /// <summary>
    /// Represents a single response to a question
    /// </summary>
    public class QuestionResponse
    {
        public int? optionID;
        public string option;
        public string userInput;

        public QuestionResponse() { }

        public static QuestionResponse FromDB(dynamic record)
        {
            if (record == null) return null;
            return new QuestionResponse
            {
                optionID = record.optionID,
                option = record.option,
                userInput = record.userInput
            };
        }
    }
}
