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

        public static UserPaymentPlanSubscriptionUpdatesTask Run(LcLogger logger)
        {
            var task = new UserPaymentPlanSubscriptionUpdatesTask();

            using (var db = new LcDatabase())
            {
                var list = LcRest.UserPaymentPlan.QueryActiveSubscriptions(db);
                task.UpdateFromGateway(list, logger);
            }

            task.TaskEnded = DateTime.Now;

            logger.Log("Elapsed time {0}, for {1} subscriptions processed, {2} records reviewed",
                task.ElapsedTime, task.ItemsProcessed, task.ItemsReviewed);

            return task;
        }
    }
}
