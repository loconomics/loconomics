namespace LcRest
{
    /// <summary>
    /// Represents a single option in a question
    /// </summary>
    public class QuestionOption
    {
        public int? optionID;
        public string option;
        public string inputType;
        public string icon;
        public string tooltip;
        public string placeholder;
        public decimal? step;

        public QuestionOption() { }
    }
}
