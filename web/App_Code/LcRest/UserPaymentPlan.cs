using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class UserPaymentPlan
    {
        #region Fields
        public int userID;
        public string paymentPlan;
        public string paymentMethod;
        public DateTime? paymentPlanLastChangedDate;
        public DateTime? nextPaymentDueDate;
        public decimal? nextPaymentAmount;
        public DateTime? lastPaymentDate;
        public decimal? lastPaymentAmount;
        public decimal? totalPastDueAmount;
        #endregion

        #region Instance
        public static UserPaymentPlan FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserPaymentPlan
            {
                userID = record.userID,

                paymentPlan = record.paymentPlan,
                paymentMethod = record.paymentMethod,
                paymentPlanLastChangedDate = record.paymentPlanLastChangedDate,
                nextPaymentDueDate = record.nextPaymentDueDate,
                nextPaymentAmount = record.nextPaymentAmount,
                lastPaymentDate = record.lastPaymentDate,
                lastPaymentAmount = record.lastPaymentAmount,
                totalPastDueAmount = record.totalPastDueAmount
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                o.userID,
                o.paymentPlan,
                o.paymentMethod,
                o.paymentPlanLastChangedDate,
                o.nextPaymentDueDate,
                o.nextPaymentAmount,
                o.lastPaymentDate,
                o.lastPaymentAmount,
                o.totalPastDueAmount
            FROM    UserPaymentPlan As O
            WHERE   O.userID = @0
        ";
        public static UserPaymentPlan Get(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem));
            }
        }
        #endregion

        #region Update
        const string sqlSet = @"
            UPDATE UserPaymentPlan SET
                paymentPlan = @1,
                paymentMethod = @2,
                paymentPlanLastChangedDate = @3,
                NextPaymentDueDate = @4,
                NextPaymentAmount = @5,
                LastPaymentDate = @6,
                LastPaymentAmount = @7,
                TotalPastDueAmount = @8
            WHERE
                UserID = @0

            IF @@rowcount = 0 THEN BEGIN
                INSERT INTO UserPaymentPlan VALUES
                @0, @1, @2, @3, @4, @5, @6, @7, @8
            END
        ";
        public static void Set(UserPaymentPlan data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.paymentPlan,
                    data.paymentMethod,
                    data.paymentPlanLastChangedDate,
                    data.nextPaymentDueDate,
                    data.nextPaymentAmount,
                    data.lastPaymentDate,
                    data.lastPaymentAmount,
                    data.totalPastDueAmount
                );
            }
        }
        #endregion
    }
}
