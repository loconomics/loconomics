using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class PublicUserVerificationsGroup
    {
        public int verificationsCount;
        public string groupName;
        public string groupID;

        public static PublicUserVerificationsGroup FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserVerificationsGroup
            {
                verificationsCount = record.verificationsCount,
                groupName = record.groupName,
                groupID = record.groupID
            };
        }
    }
}