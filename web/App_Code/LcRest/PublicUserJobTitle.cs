namespace LcRest
{
    /// <summary>
    /// Interface IPublicUserJobTitle
    /// 
    /// Includes all properties visible when the API returns a public user job title
    /// </summary>
    public interface IPublicUserJobTitle
    {
        int userID { get; }
        int jobTitleID { get; }
        string intro { get; }
        int cancellationPolicyID { get; }
        bool instantBooking { get; }
        string jobTitleSingularName { get; }
        string jobTitlePluralName { get;  }
    }
}
