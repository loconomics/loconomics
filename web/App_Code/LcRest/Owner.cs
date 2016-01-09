using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class Owner
    {
        #region Fields
        public int userID;
        public int ownerStatusID;
        public string ownerPaymentPlan;
        public string ownerPaymentMethod;
        public DateTime? ownerPaymentPlanLastChangedDate;
        public DateTime? nextPaymentDueDate;
        public decimal? nextPaymentAmount;
        public DateTime? lastPaymentDate;
        public decimal? lastPaymentAmount;
        public decimal? totalPastDueAmount;
        public DateTime? ownerAnniversaryDate;

        public string ownerStatusName;
        public string ownerStatusDescription;
        #endregion

        #region Instance
        public static Owner FromDB(dynamic record)
        {
            if (record == null) return null;
            return new Owner
            {
                userID = record.userID,
                ownerStatusID = record.ownerStatusID,
                ownerPaymentPlan = record.ownerPaymentPlan,
                ownerPaymentMethod = record.ownerPaymentMethod,
                ownerPaymentPlanLastChangedDate = record.ownerPaymentPlanLastChangedDate,
                nextPaymentDueDate = record.nextPaymentDueDate,
                nextPaymentAmount = record.nextPaymentAmount,
                lastPaymentDate = record.lastPaymentDate,
                lastPaymentAmount = record.lastPaymentAmount,
                totalPastDueAmount = record.totalPastDueAmount,
                ownerAnniversaryDate = record.ownerAnniversaryDate,

                ownerStatusName = record.ownerStatusName,
                ownerStatusDescription = record.ownerStatusDescription
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                o.userID,
                o.ownerStatusID,
                o.ownerPaymentPlan,
                o.ownerPaymentMethod,
                o.ownerPaymentPlanLastChangedDate,
                o.nextPaymentDueDate,
                o.nextPaymentAmount,
                o.lastPaymentDate,
                o.lastPaymentAmount,
                o.totalPastDueAmount,
                o.ownerAnniversaryDate,
                s.ownerStatusName,
                s.ownerStatusDescription
            FROM    Owner As O
                     INNER JOIN
                    OwnerStatus As S
                      ON O.ownerStatusID = S.ownerStatusID
            WHERE   O.userID = @0
        ";
        public static Owner Get(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem));
            }
        }
        #endregion

        #region Update
        const string sqlSet = @"
            UPDATE Owner SET
                OwnerStatusID = @1,
                OwnerPaymentPlan = @2,
                OwnerPaymentMethod = @3,
                OwnerPaymentPlanLastChangedDate = @4,
                NextPaymentDueDate = @5,
                NextPaymentAmount = @6,
                LastPaymentDate = @7,
                LastPaymentAmount = @8,
                TotalPastDueAmount = @9,
                OwnerAnniversaryDate = @10
            WHERE
                UserID = @0

            IF @@rowcount = 0 THEN BEGIN
                INSERT INTO Owner VALUES
                @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10
            END
        ";
        public static void Set(Owner data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.ownerStatusID,
                    data.ownerPaymentPlan,
                    data.ownerPaymentMethod,
                    data.ownerPaymentPlanLastChangedDate,
                    data.nextPaymentDueDate,
                    data.nextPaymentAmount,
                    data.lastPaymentDate,
                    data.lastPaymentAmount,
                    data.totalPastDueAmount,
                    data.ownerAnniversaryDate
                );
            }
        }
        #endregion
    }
}
