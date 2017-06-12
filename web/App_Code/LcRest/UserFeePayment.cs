﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace LcRest
{
    public class UserFeePayment
    {
        #region Fields
        public int userFeePaymentID;
        public int userID;
        public string paymentTransactionID;
        public string subscriptionID;
        public DateTimeOffset paymentDate;
        public decimal paymentAmount;
        public string paymentPlan;
        public string paymentMethod;
        public string paymentStatus;
        public DateTimeOffset createdDate;
        public DateTimeOffset modifiedDate;
        #endregion

        #region Instance
        public static UserFeePayment FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserFeePayment
            {
                userFeePaymentID = record.userFeePaymentID,
                userID = record.userID,
                paymentTransactionID = record.paymentTransactionID,
                subscriptionID = record.subscriptionID,
                paymentDate = record.paymentDate,
                paymentAmount = record.paymentAmount,
                paymentPlan = record.paymentPlan,
                paymentMethod = record.paymentMethod,
                paymentStatus = record.paymentStatus,
                createdDate = record.createdDate,
                modifiedDate = record.modifiedDate
            };
        }

        /// <summary>
        /// Create an instance for a plan subscription and 
        /// a payment transaction.
        /// If transaction exists on database, it gets the record updating the transaction status.
        /// </summary>
        /// <param name="userPlan"></param>
        /// <param name="transaction"></param>
        /// <returns></returns>
        public static UserFeePayment FromSubscriptionTransaction(UserPaymentPlan userPlan, Braintree.Transaction transaction)
        {
            var payment = GetBySubscriptionTransaction(userPlan.userID, userPlan.subscriptionID, transaction.Id);
            if (payment == null)
            {
                // New one
                payment = new UserFeePayment
                {
                    userID = userPlan.userID,
                    subscriptionID = userPlan.subscriptionID,
                    paymentAmount = transaction.Amount ?? 0,
                    paymentDate = transaction.CreatedAt ?? DateTime.Now,
                    paymentMethod = userPlan.paymentMethod,
                    //paymentMethod = LcPayment.PaymentMethodInfo.Get(transaction.CreditCard.Token).Description,
                    paymentPlan = transaction.PlanId,
                    paymentStatus = transaction.Status.ToString(),
                    paymentTransactionID = transaction.Id
                };
            }
            else
            {
                // Update status
                payment.paymentStatus = transaction.Status.ToString();
            }
            return payment;
        }
        #endregion

        #region Fetch
        const string sqlSelect = @"
            SELECT
                o.userFeePaymentID,
                o.userID,
                o.paymentTransactionID,
                o.subscriptionID,
                o.paymentDate,
                o.paymentAmount,
                o.paymentPlan,
                o.paymentMethod,
                o.paymentStatus,
                o.createdDate,
                o.modifiedDate
            FROM    UserFeePayments As O
        ";
        const string sqlGetItem = sqlSelect + @"
            WHERE   O.userFeePaymentID = @0
        ";
        const string sqlGetByUser = sqlSelect + @"
            WHERE   O.userID = @0
        ";
        const string sqlGetBySubscriptionTransaction = sqlGetByUser + @"
                AND subscriptionID = @1
                AND paymentTransactionID = @2
        ";

        public static UserFeePayment Get(int userFeePaymentID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, userFeePaymentID));
            }
        }

        public static IEnumerable<UserFeePayment> GetByUser(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetByUser, userID).Select(FromDB);
            }
        }

        public static UserFeePayment GetBySubscriptionTransaction(int userID,
            string subscriptionID, string paymentTransactionID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetBySubscriptionTransaction, userID, subscriptionID, paymentTransactionID));
            }
        }
        #endregion

        #region Update
        const string sqlSet = @"
            UPDATE UserFeePayments SET
                paymentStatus = @8,
                modifiedDate = SYSDATETIMEOFFSET()
            WHERE
                userFeePaymentID = @0

            IF @@rowcount = 0 BEGIN
                INSERT INTO UserFeePayments (
                    userID, paymentTransactionID,
                    subscriptionID,
                    paymentDate, paymentAmount,
                    paymentPlan, paymentMethod, paymentStatus,
                    createdDate, modifiedDate
                ) VALUES (
                    @1, @2,
                    @3,
                    @4, @5,
                    @6, @7, @8,
                    SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
                )
            END
        ";
        public static void Set(UserFeePayment data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userFeePaymentID,
                    data.userID,
                    data.paymentTransactionID,
                    data.subscriptionID,
                    data.paymentDate,
                    data.paymentAmount,
                    data.paymentPlan,
                    data.paymentMethod,
                    data.paymentStatus
                );
            }
        }
        #endregion
    }
}
