using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class UserPaymentPlan
    {
        #region Fields
        public int userPaymentPlanID;
        public int userID;
        public string subscriptionID;
        public string paymentPlan;
        public string paymentMethod;
        public DateTimeOffset paymentPlanLastChangedDate;
        public DateTimeOffset? nextPaymentDueDate;
        public decimal? nextPaymentAmount;
        public DateTimeOffset firstBillingDate;
        public DateTimeOffset? subscriptionEndDate;
        public string paymentMethodToken;
        public DateTimeOffset? paymentExpiryDate;
        public string planStatus;
        public int daysPastDue;
        #endregion

        #region Instance
        public static UserPaymentPlan FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserPaymentPlan
            {
                userPaymentPlanID = record.userPaymentPlanID,
                userID = record.userID,
                subscriptionID = record.subscriptionID,
                paymentPlan = record.paymentPlan,
                paymentMethod = record.paymentMethod,
                paymentPlanLastChangedDate = record.paymentPlanLastChangedDate,
                nextPaymentDueDate = record.nextPaymentDueDate,
                nextPaymentAmount = record.nextPaymentAmount,
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
        const string sqlSelectAll = @"
            SELECT
                o.userPaymentPlanID,
                o.userID,
                o.subscriptionID,
                o.paymentPlan,
                o.paymentMethod,
                o.paymentPlanLastChangedDate,
                o.nextPaymentDueDate,
                o.nextPaymentAmount,
                o.firstBillingDate,
                o.subscriptionEndDate,
                o.paymentMethodToken,
                o.paymentExpiryDate,
                o.planStatus,
                o.daysPastDue
            FROM    UserPaymentPlan As o
        ";
        const string sqlGetItem = sqlSelectAll + @"
            WHERE   o.userPaymentPlanID = @0
        ";
        const string sqlGetByUser = sqlSelectAll + @"
            WHERE   o.userID = @0
        ";
        const string sqlConditionOnlyActivePlans = @"
            AND SubscriptionEndDate is null
        ";

        /// <summary>
        /// Get the record by its ID
        /// </summary>
        /// <param name="userPaymentPlanID"></param>
        /// <returns></returns>
        public static UserPaymentPlan Get(int userPaymentPlanID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, userPaymentPlanID));
            }
        }

        /// <summary>
        /// Get the full list of plans (active and history) for a given user
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static IEnumerable<UserPaymentPlan> GetByUser(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetByUser, userID).Select(FromDB);
            }
        }

        /// <summary>
        /// Get the current, active plan for a user, null if nothing found.
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static UserPaymentPlan GetUserActivePlan(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetByUser + sqlConditionOnlyActivePlans, userID));
            }
        }
        #endregion

        #region Persist on DB
        /// <summary>
        /// Insert or Update SQL.
        /// Insert allows to set all fields, while update is limited to a
        /// set of them (non read-only fields).
        /// </summary>
        const string sqlSet = @"
            UPDATE UserPaymentPlan SET
                paymentMethod = @4,
                paymentPlanLastChangedDate = @5,
                NextPaymentDueDate = @6,
                NextPaymentAmount = @7,
                SubscriptionEndDate = @9,
                paymentMethodToken = @10,
                paymentExpiryDate = @11,
                planStatus = @12,
                daysPastDue = @13
            WHERE
                UserPaymentPlanID = @0

            IF @@rowcount = 0 THEN BEGIN
                INSERT INTO UserPaymentPlan (
                    userID, subscriptionID,
                    paymentPlan, paymentMethod, paymentPlanLastChangedDate,
                    nextPaymentDueDate, nextPaymentAmount,
                    firstBillingDate,
                    subscriptionEndDate,
                    paymentMethodToken, paymentExpiryDate,
                    planStatus,
                    daysPastDue
                ) VALUES
                @1, @2,
                @3, @4, @5,
                @6, @7,
                @8,
                @9,
                @10, @11,
                @12,
                @13
            END
        ";
        public static void Set(UserPaymentPlan data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userPaymentPlanID,
                    data.userID,
                    data.subscriptionID,
                    data.paymentPlan,
                    data.paymentMethod,
                    data.paymentPlanLastChangedDate,
                    data.nextPaymentDueDate,
                    data.nextPaymentAmount,
                    data.firstBillingDate,
                    data.subscriptionEndDate,
                    data.paymentMethodToken,
                    data.paymentExpiryDate,
                    data.planStatus,
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
        #endregion

        public static void CreateSubscription(int userID, LcPayment.Membership.SubscriptionPlan plan, string paymentMethodToken)
        {
            // Start creating the subscription at the payment gateway
            var trialEndDate = GetUserTrialEndDate(userID);
            var paymentPlan = new LcPayment.Membership();
            var subscription = paymentPlan.CreateSubscription(userID, plan, paymentMethodToken, trialEndDate);

            // Payment method info
            var info = LcPayment.PaymentMethodInfo.Get(paymentMethodToken);
            var paymentMethod = info.Description;
            var expiryDate = info.ExpirationDate;

            // Prepare object
            var userPlan = new UserPaymentPlan()
            {
                userID = userID,
                subscriptionID = subscription.Id,
                paymentPlan = plan.ToString(),
                paymentMethodToken = paymentMethodToken,
                paymentMethod = paymentMethod,
                paymentPlanLastChangedDate = subscription.UpdatedAt.Value,
                nextPaymentDueDate = subscription.NextBillingDate,
                nextPaymentAmount = subscription.NextBillAmount,
                firstBillingDate = subscription.FirstBillingDate.Value,
                subscriptionEndDate = null,
                paymentExpiryDate = expiryDate,
                planStatus = subscription.Status.ToString(),
                daysPastDue = subscription.DaysPastDue ?? 0
            };

            // Persist
            Set(userPlan);
        }

        /*
           Reading payment subscription:
           var subscriptionID = GetUserActivePlan(userID).subscriptionID;
           LcPayment.Membership.GetUserSubscription(subscriptionID);
        */
        #endregion
    }
}
