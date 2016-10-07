using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class OwnerUserFeePayment
    {
        #region Fields
        public int userID;
        public DateTime paymentDate;
        public decimal? paymentAmount;
        public string paymentMethod;
        public string ownerPaymentPlan;
        public string paymentTransactionID;
        public string paymentStatus;
        #endregion

        #region Instance
        public static OwnerUserFeePayment FromDB(dynamic record)
        {
            if (record == null) return record;
            return new OwnerUserFeePayment
            {
                userID = record.userID,
                paymentDate = record.paymentDate,
                paymentAmount = record.paymentAmount,
                paymentMethod = record.paymentMethod,
                ownerPaymentPlan = record.ownerPaymentPlan,
                paymentTransactionID = record.paymentTransactionID,
                paymentStatus = record.paymentStatus
            };
        }
        #endregion

        #region Get
        const string sqlGetItem = @"
            SELECT
                userID,
                paymentDate,
                paymentAmount,
                paymentMethod,
                ownerPaymentPlan,
                paymentTransactionID,
                paymentStatus
            FROM
                OwnerUserFeePayments
            WHERE
                userID = @0
        ";
        public static IEnumerable<OwnerUserFeePayment> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetItem, userID).Select(FromDB);
            }
        }
        #endregion

        #region Set
        const string sqlInsertPayment = @"
            INSERT INTO OwnerUserFeePayments VALUES
                @0, @1, @2, @3, @4, @5, @6
        ";
        public static void Set(OwnerUserFeePayment data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlInsertPayment,
                    data.userID,
                    data.paymentDate,
                    data.paymentAmount,
                    data.paymentMethod,
                    data.ownerPaymentPlan,
                    data.paymentTransactionID,
                    data.paymentStatus
                );
            }
        }
        #endregion
    }
}