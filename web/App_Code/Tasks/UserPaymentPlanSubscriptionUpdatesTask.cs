using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Tasks
{
    public class UserPaymentPlanSubscriptionUpdatesTask
    {
        private UserPaymentPlanSubscriptionUpdatesTask()
        {
            TaskStarted = DateTime.Now;
        }

        public long ItemsReviewed
        {
            get;
            private set;
        }

        public long ItemsProcessed
        {
            get;
            private set;
        }

        public DateTime TaskStarted
        {
            get;
            private set;
        }

        public DateTime TaskEnded
        {
            get;
            private set;
        }

        public TimeSpan ElapsedTime
        {
            get
            {
                return TaskEnded - TaskStarted;
            }
        }

        private void UpdateFromGateway(IEnumerable<LcRest.UserPaymentPlan> list, LcLogger logger)
        {
            long reviewed = 0;
            long processed = 0;
            foreach (var userPlan in list)
            {
                try
                {
                    // Query Braintree subscription
                    var m = new LcPayment.Membership();
                    var subs = m.GetSubscription(userPlan.subscriptionID);
                    reviewed++;

                    if (subs == null)
                    {
                        // Problem: saved ID didn't found at Braintree, corrupted data
                        var err = String.Format("Database subscriptionID '{0}' not found at Braintree, corrupted data." +
                            " Please review user {1} subscription", userPlan.subscriptionID, userPlan.userID);
                        LcMessaging.NotifyError("UserPaymentPlanSubscriptionUpdatesTask", "ScheduledTask", err);
                        logger.Log(err);
                    }
                    else
                    {
                        // If status changed, update record
                        if (userPlan.planStatus != subs.Status.ToString())
                        {
                            userPlan.UpdatedAtGateway(subs);
                            LcRest.UserPaymentPlan.Set(userPlan);
                            // Update items count
                            processed++;

                            // Payments
                            foreach (var transaction in subs.Transactions)
                            {
                                var payment = LcRest.UserFeePayment.FromSubscriptionTransaction(userPlan, transaction);
                                LcRest.UserFeePayment.Set(payment);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogEx("Pending and Past Due subscriptions", ex);
                }
            }
            logger.Log("Subscriptions updated from gateway: {0} from total reviewed {1}", processed, reviewed);
            ItemsReviewed += reviewed;
            ItemsProcessed += processed;
        }
        /// <summary>
        /// Check the due date of partnership plan subscriptions, setting them as expired is out of date.
        /// </summary>
        /// <param name="list"></param>
        /// <param name="logger"></param>
        private void EnforceDueDate(IEnumerable<LcRest.UserPaymentPlan> list, LcLogger logger)
        {
            long reviewed = 0;
            long processed = 0;
            foreach (var userPlan in list)
            {
                try
                {
                    // CCCPlan subscriptions
                    if (userPlan.paymentPlan == LcEnum.SubscriptionPlan.CccPlan &&
                        userPlan.nextPaymentDueDate.HasValue)
                    {
                        reviewed++;
                        if (userPlan.nextPaymentDueDate.Value < DateTimeOffset.Now)
                        {
                            // Set as ended
                            userPlan.subscriptionEndDate = DateTimeOffset.Now;
                            // Set as expired, same value as Gateway/Braintree
                            userPlan.planStatus = Braintree.SubscriptionStatus.EXPIRED.ToString();
                            // Update DB
                            LcRest.UserPaymentPlan.Set(userPlan);
                            processed++;
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogEx("Check partnership subscriptions date for Past Due", ex);
                }
            }
            logger.Log("Partnership subscriptions updated because of Past Due: {0} from total reviewed {1}", processed, reviewed);
            ItemsReviewed += reviewed;
            ItemsProcessed += processed;
        }

        public static UserPaymentPlanSubscriptionUpdatesTask Run(LcLogger logger)
        {
            var task = new UserPaymentPlanSubscriptionUpdatesTask();

            using (var db = new LcDatabase())
            {
                // Subcriptions that need udpate from Gateway
                var list = LcRest.UserPaymentPlan.QueryActiveSubscriptions(true, db);
                task.UpdateFromGateway(list, logger);
                // No-payment subscriptions, currently just partnership plans, that need manual check of due date
                task.EnforceDueDate(LcRest.UserPaymentPlan.QueryActiveSubscriptions(false, db), logger);
            }

            task.TaskEnded = DateTime.Now;

            logger.Log("Elapsed time {0}, for {1} subscriptions processed, {2} records reviewed",
                task.ElapsedTime, task.ItemsProcessed, task.ItemsReviewed);

            return task;
        }
    }
}
