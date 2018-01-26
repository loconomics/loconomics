using System;
using System.Collections.Generic;
using System.Linq;
using LcEnum;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace LcRest
{
    public class UserPaymentPlan
    {
        #region Fields
        public int userPaymentPlanID;
        public int userID;
        public string subscriptionID;
        [JsonConverter(typeof(StringEnumConverter))]
        public SubscriptionPlan paymentPlan;
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

            SubscriptionPlan plan = SubscriptionPlan.Free;
            if (!Enum.TryParse<SubscriptionPlan>(record.paymentPlan, true, out plan))
            {
                throw new FormatException("Bad stored payment plan");
            }

            return new UserPaymentPlan
            {
                userPaymentPlanID = record.userPaymentPlanID,
                userID = record.userID,
                subscriptionID = record.subscriptionID,
                paymentPlan = plan,
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
        const string sqlGetBySubscriptionID = sqlSelectAll + @"
            WHERE   o.subscriptionID = @0
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
        /// Get a record by the payment gateway 'subscriptionID', that is meant to be
        /// unique.
        /// </summary>
        /// <param name="subscriptionID"></param>
        /// <returns></returns>
        public static UserPaymentPlan GetBySubscriptionID(string subscriptionID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetBySubscriptionID, subscriptionID));
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

            IF @@rowcount = 0 BEGIN
                INSERT INTO UserPaymentPlan (
                    userID, subscriptionID,
                    paymentPlan, paymentMethod, paymentPlanLastChangedDate,
                    nextPaymentDueDate, nextPaymentAmount,
                    firstBillingDate,
                    subscriptionEndDate,
                    paymentMethodToken, paymentExpiryDate,
                    planStatus,
                    daysPastDue
                ) VALUES (
                    @1, @2,
                    @3, @4, @5,
                    @6, @7,
                    @8,
                    @9,
                    @10, @11,
                    @12,
                    @13
                )
            END
        ";
        public static void Set(UserPaymentPlan data, LcDatabase sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb.Db))
            {
                db.Execute(sqlSet,
                    data.userPaymentPlanID,
                    data.userID,
                    data.subscriptionID,
                    data.paymentPlan.ToString(),
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

                try
                {
                    // Set OwnerStatus
                    if (IsPartnershipPlan(data.paymentPlan))
                    {
                        var ow = new Owner();
                        ow.userID = data.userID;
                        ow.statusID = (int)OwnerStatus.notYetAnOwner;
                        Owner.Set(ow);
                    }
                    else
                    {
                        // Run Membership Checks to enable/disable member (OwnerStatus update)
                        UserProfile.CheckAndSaveOwnerStatus(data.userID);
                    }
                }
                catch (Exception ex)
                {
                    // An error checking status must NOT prevent us from saving/creating
                    // the payment-plan, but we must notify staff so we can take manual action
                    // to fix the error and run the check again for this user
                    try
                    {
                        LcLogger.LogAspnetError(ex);
                        LcMessaging.NotifyError("UserPaymentPlan.Set->UserProfile.CheckAndSaveOwnerStatus::userID=" + data.userID,
                            System.Web.HttpContext.Current.Request.RawUrl,
                            ex.ToString());
                    }
                    catch
                    {
                        // Prevent cancel paymentplan creation/update because of email or log failing. Really strange
                        // and webhook-scheduleTask for subscriptions would attempt again this.
                    }
                }
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

        /// <summary>
        /// Saves/updates the payment method for the member, at the remote gateway,
        /// updates in place, and returns, the ID/token
        /// </summary>
        /// <returns>The saved payment method ID/token</returns>
        /// <param name="paymentData"></param>
        private static string CollectPaymentMethod(LcPayment.InputPaymentMethod paymentData, int memberUserID)
        {
            // On emulation, discard other steps, just generate
            // a fake ID
            if (LcPayment.TESTING_EMULATEBRAINTREE)
            {
                paymentData.paymentMethodID = LcPayment.CreateFakePaymentMethodId();
                return paymentData.paymentMethodID;
            }

            // Standard way
            var gateway = LcPayment.NewBraintreeGateway();

            // The input paymentID must be one generated by Braintree, reset any (malicious?) attempt
            // to provide a special temp ID generated by this method
            if (paymentData.IsTemporaryID())
            {
                paymentData.paymentMethodID = null;
            }

            // Find or create Customer on Braintree (for membership subscriptions, the member
            // is a customer of Loconomics).
            var client = LcPayment.GetOrCreateBraintreeCustomer(LcPayment.Membership.GetFeePaymentUserId(memberUserID));

            // Quick way for saved payment method that does not needs to be updated
            if (paymentData.IsSavedID())
            {
                // Just double check payment exists to avoid mistake/malicious attempts:
                if (!paymentData.ExistsOnVault())
                {
                    // Since we have not input data to save, we can only throw an error
                    // invalidSavedPaymentMethod
                    throw new ConstraintException("Chosen payment method has expired");
                }
            }
            else
            {
                // Creates or updates a payment method with the given data

                // Must we set an ID as temporary to prevent it appears as a saved payment method?
                //paymentData.paymentMethodID = LcPayment.TempSavedCardPrefix + ASP.LcHelpers.Channel + "_paymentPlan";

                // Save on Braintree secure Vault
                // It updates the paymentMethodID if a new one was generated
                var saveCardError = paymentData.SaveInVault(client.Id);
                if (!String.IsNullOrEmpty(saveCardError))
                {
                    // paymentDataError
                    throw new ConstraintException(saveCardError);
                }
            }

            return paymentData.paymentMethodID;
        }

        public static UserPaymentPlan CreateSubscription(
            int userID,
            SubscriptionPlan plan,
            LcPayment.InputPaymentMethod paymentMethod)
        {
            // Prepare payment method (in the remote gateway), get its ID
            var paymentMethodToken = CollectPaymentMethod(paymentMethod, userID);

            // Prepare initial object
            var userPlan = new UserPaymentPlan()
            {
                userID = userID,
                paymentPlan = plan,
                subscriptionEndDate = null
            };

            // Create subscription at gateway and set details
            // Wrapped in a try-catch to implement a transaction-like operation:
            // if something fail after succesfully create the Braintree subscription, like not being
            // able to save details on database, we need to 'rollback' the subscription, asking for removal
            // to Braintree
            string generatedSubscriptionId = null;
            var paymentPlan = new LcPayment.Membership();
            try
            {
                if (LcPayment.TESTING_EMULATEBRAINTREE)
                {
                    userPlan.subscriptionID = LcPayment.CreateFakeSubscriptionId();
                    userPlan.paymentPlanLastChangedDate = DateTimeOffset.Now;
                    userPlan.nextPaymentDueDate = DateTimeOffset.Now.Add(new TimeSpan(365, 0, 0, 0));
                    userPlan.nextPaymentAmount = 99;
                    userPlan.firstBillingDate = DateTimeOffset.Now;
                    userPlan.planStatus = "ACTIVE";
                    userPlan.daysPastDue = 0;
                }
                else
                {
                    // Start creating the subscription at the payment gateway
                    var trialEndDate = GetUserTrialEndDate(userID);

                    // Create the subscription at the payment gateway
                    // It returns the subscription object with a correct ID on success, otherwise an exception is thrown
                    var subscription = paymentPlan.CreateSubscription(plan, paymentMethodToken, trialEndDate);
                    generatedSubscriptionId = subscription.Id;
                    userPlan.subscriptionID = subscription.Id;
                    userPlan.paymentPlanLastChangedDate = subscription.UpdatedAt.Value;
                    userPlan.nextPaymentDueDate = subscription.NextBillingDate;
                    userPlan.nextPaymentAmount = subscription.NextBillAmount;
                    userPlan.firstBillingDate = subscription.FirstBillingDate.Value;
                    userPlan.planStatus = subscription.Status.ToString();
                    userPlan.daysPastDue = subscription.DaysPastDue ?? 0;
                }

                // Fill payment method info
                var info = LcPayment.PaymentMethodInfo.Get(paymentMethodToken);
                userPlan.paymentExpiryDate = info.ExpirationDate;
                userPlan.paymentMethodToken = paymentMethodToken;
                userPlan.paymentMethod = info.Description;

                // Persist subscription on database
                Set(userPlan);
            }
            catch (Exception ex)
            {
                // Rollback
                if (generatedSubscriptionId != null)
                {
                    // Rollback subscription at Payment Gateway
                    paymentPlan.CancelSubscription(generatedSubscriptionId);
                }

                // The exception needs to be communicated anyway, so re-throw
                throw new Exception("Failed subscription", ex);
            }

            return userPlan;
        }

        /// <summary>
        /// Whether the given plan is a partnerthip plan or not
        /// </summary>
        /// <param name="plan"></param>
        /// <returns></returns>
        public static bool IsPartnershipPlan(SubscriptionPlan plan)
        {
            return (short)plan > 100 && (short)plan < 200;
        }

        /// <summary>
        /// Duration in days of a subscription created for a CCC partnership
        /// </summary>
        const int CccPartnershipSubscriptionDurationDays = 180;

        /// <summary>
        /// Creates a special subscription that has not a payment with the user
        /// but with a Partner, and as part of it the user (that related with the Partner)
        /// gets free access for a Loconomics plan.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="plan"></param>
        /// <param name="paymentMethod"></param>
        /// <returns></returns>
        public static UserPaymentPlan CreatePartnershipSubscription(
            int userID,
            SubscriptionPlan plan,
            LcDatabase db)
        {
            // Validate plan
            if (!IsPartnershipPlan(plan))
            {
                throw new ConstraintException("Invalid subscription plan for a partnership");
            }
            // Setup of the plan
            var durationDays = 0;
            switch (plan)
            {
                case SubscriptionPlan.CccPlan:
                    durationDays = CccPartnershipSubscriptionDurationDays;
                    break;
            }
            // Prepare object
            var userPlan = new UserPaymentPlan()
            {
                userID = userID,
                paymentPlan = plan,
                subscriptionEndDate = null,
                subscriptionID = "",
                paymentPlanLastChangedDate = DateTimeOffset.Now,
                nextPaymentDueDate = DateTimeOffset.Now.Add(new TimeSpan(durationDays, 0, 0, 0)),
                nextPaymentAmount = null,
                firstBillingDate = DateTimeOffset.Now,
                planStatus = "ACTIVE",
                daysPastDue = 0,
                paymentExpiryDate = null,
                paymentMethodToken = "",
                paymentMethod = "",
            };
            
            // Persist subscription on database
            Set(userPlan, db);
            return userPlan;
        }

        /*
           Reading payment subscription:
           var subscriptionID = GetUserActivePlan(userID).subscriptionID;
           LcPayment.Membership.GetUserSubscription(subscriptionID);
        */

        /// <summary>
        /// For the last payment plan of the user, gets the subscription status (planStatus)
        /// parsed for the Braintree enumeration, with fallback to UNRECOGNIZED value if
        /// no payment plan registered.
        /// This checks for closed plans too (useful to know if last payment was cancelled or suspended).
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static Braintree.SubscriptionStatus GetLastPaymentPlanStatus(int userID)
        {
            var sql = @"
			SELECT TOP 1 PlanStatus
			FROM UserPaymentPlan
			WHERE UserID = @0
            ORDER BY UserPaymentPlanID DESC
            ";
            using (var db = new LcDatabase())
            {
                var status = (string)db.QueryValue(sql, userID);
                if (status == null)
                {
                    return Braintree.SubscriptionStatus.UNRECOGNIZED;
                }
                else
                {
                    return Braintree.SubscriptionStatus.STATUSES.First(x => status == x.ToString());
                }
            }
        }
        #endregion

        #region Updates from Gateway
        /// <summary>
        /// Save updated data and status of a subscription from a notification
        /// of the gateway.
        /// </summary>
        /// <param name="subscription"></param>
        public void UpdatedAtGateway(Braintree.Subscription subscription, Braintree.WebhookKind notification)
        {
            if (subscriptionID != subscription.Id)
            {
                throw new Exception(String.Format("Subscription IDs don't match, record '{0}', input '{1}'", subscriptionID, subscription.Id));
            }
            // Update record with information from the gateway
            paymentPlanLastChangedDate = subscription.UpdatedAt.Value;
            nextPaymentDueDate = subscription.NextBillingDate;
            nextPaymentAmount = subscription.NextBillAmount;
            daysPastDue = subscription.DaysPastDue ?? 0;
            // New status
            planStatus = subscription.Status.ToString();
            // Detect when a subscription ended
            if (subscription.Status == Braintree.SubscriptionStatus.CANCELED ||
                subscription.Status == Braintree.SubscriptionStatus.EXPIRED)
            {
                subscriptionEndDate = subscription.BillingPeriodEndDate ?? DateTimeOffset.Now;
            }
        }

        /// <summary>
        /// Save updated data and status of a subscription from a change at the gateway.
        /// A comparision between saved status and new one will detect the kind of notification
        /// </summary>
        /// <param name="subscription"></param>
        public void UpdatedAtGateway(Braintree.Subscription subscription)
        {
            // Detect kind of change/notification
            // Status livecycle at official docs: https://developers.braintreepayments.com/guides/recurring-billing/overview#subscription-statuses
            // Cannot detect Braintree.WebhookKind.SUBSCRIPTION_TRIAL_ENDED here but is
            // not important really, because the status of the subscrition is Active already in trial period;
            // the important change (to update some data) is when the paymend was done (that happens at same
            // time as the trial_ended for the first one, and one update for the same data and status is enought).
            var kind = Braintree.WebhookKind.UNRECOGNIZED;
            if (planStatus != subscription.Status.ToString())
            {
                // Status change, detect which one
                // - Can change from Pending, Active or PastDue to Canceled
                if (subscription.Status == Braintree.SubscriptionStatus.CANCELED)
                {
                    kind = Braintree.WebhookKind.SUBSCRIPTION_CANCELED;
                }
                // - Can change from Active to Canceled
                else if (subscription.Status == Braintree.SubscriptionStatus.EXPIRED)
                {
                    kind = Braintree.WebhookKind.SUBSCRIPTION_EXPIRED;
                }
                // - Change change from Pending, PastDue
                else if (subscription.Status == Braintree.SubscriptionStatus.ACTIVE)
                {
                    kind = Braintree.WebhookKind.SUBSCRIPTION_WENT_ACTIVE;
                }
                // - Change change from Pending, Active
                else if (subscription.Status == Braintree.SubscriptionStatus.PAST_DUE)
                {
                    kind = Braintree.WebhookKind.SUBSCRIPTION_WENT_PAST_DUE;
                }
                // - Impossible to have a change from 'other' status to Pending, is not allowed
                //   in the Braintree subscription livecycle
            }

            UpdatedAtGateway(subscription, kind);
        }
        #endregion

        #region Query by Plan/Subscription status
        /// <summary>
        /// Get active subscriptions, all ones with a non final status (Active, Pending, Past_due)
        /// </summary>
        /// <param name="db"></param>
        /// <returns></returns>
        public static IEnumerable<UserPaymentPlan> QueryActiveSubscriptions(LcDatabase db)
        {
            return db.Query(sqlSelectAll + sqlConditionOnlyActivePlans + " WHERE planStatus IN (@0, @1, @2)",
                Braintree.SubscriptionStatus.PENDING.ToString(),
                Braintree.SubscriptionStatus.PAST_DUE.ToString(),
                Braintree.SubscriptionStatus.ACTIVE.ToString())
            .Select(FromDB);
        }
        #endregion

        public static bool MeetsOwnsershipRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasPaid bit = 0

			IF EXISTS (
				SELECT *
				FROM UserPaymentPlan
				WHERE UserID = @UserID
					AND PlanStatus IN ('Active', 'Past Due')
					-- extra check for 'current plan'
					AND SubscriptionEndDate is null
			)
			BEGIN
				SET @hasPaid = 1
			END

            SELECT @hasPaid
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }
    }
}
