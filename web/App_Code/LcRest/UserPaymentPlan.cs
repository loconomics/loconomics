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
        public string subscriptionID;
        public string paymentPlan;
        public string paymentMethod;
        public DateTimeOffset paymentPlanLastChangedDate;
        public DateTimeOffset? nextPaymentDueDate;
        public decimal? nextPaymentAmount;
        public DateTimeOffset lastPaymentDate;
        public decimal lastPaymentAmount;
        public decimal totalPastDueAmount;
        public DateTimeOffset firstBillingDate;
        public DateTimeOffset? subscriptionEndDate;
        public string paymentMethodToken;
        public DateTimeOffset paymentExpiryDate;
        public string planStatus;
        public int daysPastDue;
        #endregion

        #region Instance
        public static UserPaymentPlan FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserPaymentPlan
            {
                userID = record.userID,
                subscriptionID = record.subscriptionID,
                paymentPlan = record.paymentPlan,
                paymentMethod = record.paymentMethod,
                paymentPlanLastChangedDate = record.paymentPlanLastChangedDate,
                nextPaymentDueDate = record.nextPaymentDueDate,
                nextPaymentAmount = record.nextPaymentAmount,
                lastPaymentDate = record.lastPaymentDate,
                lastPaymentAmount = record.lastPaymentAmount,
                totalPastDueAmount = record.totalPastDueAmount,
                firstBillingDate = record.firstBillingDate,
                subscriptionEndDate = record.subscriptionEndDate,
                paymentMethodToken = record.paymentMethodToken,
                paymentExpiryDate = record.paymentExpiryDate,
                planStatus = record.planStatus,
                daysPastDue = record.daysPastDue
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                o.userID,
                o.subscriptionID;
                o.paymentPlan,
                o.paymentMethod,
                o.paymentPlanLastChangedDate,
                o.nextPaymentDueDate,
                o.nextPaymentAmount,
                o.lastPaymentDate,
                o.lastPaymentAmount,
                o.totalPastDueAmount,
                o.firstBillingDate,
                o.subscriptionEndDate,
                o.paymentMethodToken,
                o.paymentExpiryDate,
                o.planStatus,
                o.daysPastDue
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

        #region Persist on DB
        /// <summary>
        /// Insert or Update SQL.
        /// Insert allows to set all fields, while update prevents from changes to:
        /// - userID
        /// - subscriptionID?
        /// - firstBillingDate
        /// - TODO To complete docs and Update query
        /// </summary>
        const string sqlSet = @"
            UPDATE UserPaymentPlan SET
                paymentPlan = @2,
                paymentMethod = @3,
                paymentPlanLastChangedDate = @4,
                NextPaymentDueDate = @5,
                NextPaymentAmount = @6,
                LastPaymentDate = @7,
                LastPaymentAmount = @8,
                firstBillingDate = @9,
                SubscriptionEndDate = @10,
                paymentMethodToken = @11,
                paymentExpiryDate = @12,
                planStatus = @13,
                TotalPastDueAmount = @14,
                daysPastDue = @15
            WHERE
                UserID = @0

            IF @@rowcount = 0 THEN BEGIN
                INSERT INTO UserPaymentPlan (
                    userID, subscriptionID,
                    paymentPlan, paymentMethod, paymentPlanLastChangedDate,
                    nextPaymentDueDate, nextPaymentAmount,
                    lastPaymentDate, lastPaymentAmount,
                    firstBillingDate,
                    subscriptionEndDate,
                    paymentMethodToken, paymentExpiryDate,
                    planStatus,
                    totalPastDueAmount, daysPastDue
                ) VALUES
                @0, @1,
                @2, @3, @4,
                @5, @6,
                @7, @8,
                @9,
                @10,
                @11, @12,
                @13,
                @14, @15
            END
        ";
        public static void Set(UserPaymentPlan data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.subscriptionID,
                    data.paymentPlan,
                    data.paymentMethod,
                    data.paymentPlanLastChangedDate,
                    data.nextPaymentDueDate,
                    data.nextPaymentAmount,
                    data.lastPaymentDate,
                    data.lastPaymentAmount,
                    data.firstBillingDate,
                    data.subscriptionEndDate,
                    data.paymentMethodToken,
                    data.paymentExpiryDate,
                    data.planStatus,
                    data.totalPastDueAmount,
                    data.daysPastDue
                );
            }
        }
        #endregion

        #region Manage plan/subscription API
        #region Internal DB utils
        private static DateTimeOffset GetUserTrialEndDate(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.QueryValue("SELECT TrialEndDate FROM users WHERE userID=@0", userID) ?? DateTimeOffset.MaxValue;
            }
        }

        private static string GetUserSubscriptionID(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.QueryValue("SELECT SubscriptionID FROM UserPaymentPlan WHERE userID=@0", userID);
            }
        }
        #endregion

        public static void CreateSubscription(int userID, LcPayment.Membership.SubscriptionPlan plan, string paymentMethodToken)
        {
            // Start creating the subscription at the payment gateway
            var trialEndDate = GetUserTrialEndDate(userID);
            var paymentPlan = new LcPayment.Membership();
            var subscription = paymentPlan.CreateSubscription(userID, plan, paymentMethodToken, trialEndDate);

            // Prepare data
            // TODO

            // Prepare object
            var userPlan = new UserPaymentPlan()
            {
                userID = userID,
                paymentPlan = plan.ToString(),
                paymentMethodToken = paymentMethodToken,
                paymentMethod = ""
            };

            // Persist
            Set(userPlan);
        }

        /*
           Reading payment subscription:
           var subscriptionID = GetUserSubscriptionID(userID);
           LcPayment.Membership.GetUserSubscription(subscriptionID);
        */
        #endregion
    }
}
