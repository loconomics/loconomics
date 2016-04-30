using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class OwnerStatusHistory
    {
        #region Fields
        public int userID;
        public DateTime ownerStatusChangedDate;
        public int ownerStatusID;
        public string ownerStatusChangedBy;
        #endregion

        #region Instance
        public static OwnerStatusHistory FromDB(dynamic record)
        {
            if (record == null) return null;
            return new OwnerStatusHistory
            {
                userID = record.userID,
                ownerStatusChangedDate = record.ownerStatusChangedDate,
                ownerStatusID = record.ownerStatusID,
                ownerStatusChangedBy = record.ownerStatusChangedBy
            };
        }
        #endregion

        #region Fetch
        const string sqlGetList = @"
            SELECT
                o.userID,
                o.ownerStatusChangedDate,
                o.ownerStatusID,
                o.ownerStatusChangedBy
            FROM    OwnerStatusHistory As O
            WHERE   O.userID = @0
        ";
        public static IEnumerable<OwnerStatusHistory> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList).Select(FromDB);
            }
        }
        #endregion

        #region Update
        const string sqlSet = @"
            INSERT INTO OwnerStatusHistory VALUES
            @0, @1, @2, @3
        ";
        public static void Set(OwnerStatusHistory data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.ownerStatusChangedDate,
                    data.ownerStatusID,
                    data.ownerStatusChangedBy
                );
            }
        }
        #endregion
    }
}
