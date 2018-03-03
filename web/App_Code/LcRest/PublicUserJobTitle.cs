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
        public int userID { get; set; }
        public int jobTitleID { get; set; }
        public string title { get; set; }
        public string intro { get; set; }
        public bool isActive { get; set; }
        public int cancellationPolicyID { get; set; }
        public bool instantBooking { get; set; }
        [Obsolete("Preferred usage of title property. Is not in use at the current " +
            "App code, will be removed once old App instances are updated.")]
        public string jobTitleSingularName { get; set; }
        [Obsolete("Preferred usage of title property. Is not in use at the current " +
            "App code, will be removed once old App instances are updated.")]
        public string jobTitlePluralName { get; set; }

        public static PublicUserJobTitle FromUserJobTitle(UserJobTitle userJobTitle)
        {
            if (userJobTitle == null )
            {
                return null;
            }

            return new PublicUserJobTitle
            {
                userID = userJobTitle.userID,
                jobTitleID = userJobTitle.jobTitleID,
                title = userJobTitle.title,
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
