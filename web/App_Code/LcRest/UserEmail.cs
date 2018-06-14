using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Represents just the two identificative fields of an user (ID and email)
    /// as per table [userprofile] but with corrected casing.
    /// </summary>
    public class UserEmail
    {
        public int userID;
        public string email;

        public static UserEmail FromDB(dynamic record)
        {
            if (record == null) return null;

            return new UserEmail
            {
                userID = record.userID,
                email = record.email
            };
        }

        public static UserEmail Get(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle("SELECT userID, email FROM userprofile WHERE userID=@0", userID));
            }
        }
    }
}
