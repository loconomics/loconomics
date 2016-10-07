using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class UserFeePayment
    {
        #region Fields
        public int userID;
        public DateTime? paymentDate;
        public decimal paymentAmount;
        public string paymentMethod;
        public string paymentPlan;
        public string paymentTransactionID;
        public string paymentStatus;
        #endregion

        #region Instance
        public static UserFeePayment FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserFeePayment
            {
                userID = record.userID,
                paymentDate = record.paymentDate,
                paymentAmount = record.paymentAmount,
                paymentMethod = record.paymentMethod,
                paymentPlan = record.paymentPlan,
                paymentTransactionID = record.paymentTransactionID,
                paymentStatus = record.paymentStatus
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                o.userID,
                o.paymentDate,
                o.paymentAmount,
                o.paymentMethod,
                o.paymentPlan,
                o.paymentTransactionID,
                o.paymentStatus
            FROM    UserFeePayments As O
            WHERE   O.userID = @0
                     AND
                    O.paymentDate = @1
        ";
        const string sqlGetList = @"
            SELECT
                o.userID,
                o.paymentDate,
                o.paymentAmount,
                o.paymentMethod,
                o.paymentPlan,
                o.paymentTransactionID,
                o.paymentStatus
            FROM    UserFeePayments As O
            WHERE   O.userID = @0
        ";
        public static UserFeePayment Get(int userID, DateTime paymentDate)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, userID, paymentDate));
            }
        }
        public static IEnumerable<UserFeePayment> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID).Select(FromDB);
            }
        }
        #endregion

        #region Update
        const string sqlSet = @"
            UPDATE UserFeePayments SET
                paymentAmount = @2,                
                paymentMethod = @3,
                paymentPlan = @4,
                paymentTransactionID = @5,
                paymentStatus = @6
            WHERE
                UserID = @0
                 AND
                PaymentDate = @1

            IF @@rowcount = 0 THEN BEGIN
                INSERT INTO UserFeePayments VALUES
                @0, @1, @2, @3, @4, @5, @6
            END
        ";
        public static void Set(UserFeePayment data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.paymentDate,
                    data.paymentAmount,
                    data.paymentMethod,
                    data.paymentPlan,
                    data.paymentTransactionID,
                    data.paymentStatus
                );
            }
        }
        #endregion
    }
}
