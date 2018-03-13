using System;
using System.Collections.Generic;

namespace LcRest
{
    /// <summary>
    /// Interface IPublicUserJobTitle
    /// 
    /// Includes all properties visible when the API returns a public user job title
    /// </summary>
    public class PublicUserJobTitle
    {
        public int userListingID { get; set; }
        public int userID { get; set; }
        public int jobTitleID { get; set; }
        public string intro { get; set; }
        public bool isActive { get; set; }
        public int cancellationPolicyID { get; set; }
        public bool instantBooking { get; set; }
        public string jobTitleSingularName { get; set; }
        public string jobTitlePluralName { get; set; }

        public static PublicUserJobTitle FromUserJobTitle(UserJobTitle userJobTitle)
        {
            if (userJobTitle == null )
            {
                return null;
            }

            return new PublicUserJobTitle
            {
                userListingID = userJobTitle.userListingID,
                userID = userJobTitle.userID,
                jobTitleID = userJobTitle.jobTitleID,
                intro = userJobTitle.intro,
                isActive = userJobTitle.isActive,
                cancellationPolicyID = userJobTitle.cancellationPolicyID,
                instantBooking = userJobTitle.instantBooking,
                jobTitleSingularName = userJobTitle.jobTitleSingularName,
                jobTitlePluralName = userJobTitle.jobTitlePluralName
            };
        }
    }
}
