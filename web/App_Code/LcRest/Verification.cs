using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class Verification
    {
        #region Fields
        public int verificationID;
        public string name;
        public string description;
        public string icon;
        // Unused for now, and not the verificationCategory table
        //public int verificationCategoryID;
        public string summaryGroup;
        #endregion

        #region Instances
        public static Verification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new Verification
            {
                verificationID = record.verificationID,
                name = record.name,
                description = record.description,
                icon = record.icon,
                summaryGroup = record.summaryGroup
            };
        }
        #endregion
    }
}