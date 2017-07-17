using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Manage a user Owner properties
    /// (internally, in the [users] table but exposed here
    /// as if there was an [owners] table with 1-1 relation to [users])
    /// </summary>
    public class Owner
    {
        #region Fields
        public int userID;
        public DateTime? ownerAnniversaryDate;
        public int statusID;
        public LcEnum.OwnerStatus status
        {
            get
            {
                return (LcEnum.OwnerStatus)statusID;
            }
            set
            {
                statusID = (int)status;
            }
        }
        #endregion

        #region Instances
        public Owner() { }
        #endregion

        #region Owner Status Rules
        public const LcEnum.OwnerStatus DefaultOwnerStatus = LcEnum.OwnerStatus.notYetAnOwner;

        /// <summary>
        /// A change in the OwnerStatus is allowed following an strict flow.
        /// This index defines what status changes are valid coming from a given status
        /// From a status -> To status (each one in the list)
        /// </summary>
        private static Dictionary<LcEnum.OwnerStatus, HashSet<LcEnum.OwnerStatus>>
            AllowedStatusTransitions = new Dictionary<LcEnum.OwnerStatus, HashSet<LcEnum.OwnerStatus>>
        {
            // If current status is 'notYetAnOwner' (null or zero at database --means never an owner before),
            // is only allowed to change it to InTrial, Active.
            // From
            { LcEnum.OwnerStatus.notYetAnOwner, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.trialEnded,
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.trialEnded, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active,
                LcEnum.OwnerStatus.cancelled
            } },
            // From
            { LcEnum.OwnerStatus.active, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.trialEnded,
                LcEnum.OwnerStatus.inactive,
                LcEnum.OwnerStatus.cancelled,
                LcEnum.OwnerStatus.suspended
            } },
            // From
            { LcEnum.OwnerStatus.cancelled, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.suspended, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active
            } },
            // From
            { LcEnum.OwnerStatus.inactive, new HashSet<LcEnum.OwnerStatus> {
                // To
                LcEnum.OwnerStatus.active,
                LcEnum.OwnerStatus.cancelled,
                LcEnum.OwnerStatus.suspended
            } }
        };

        public bool CanTransitionTo(LcEnum.OwnerStatus transitionStatus)
        {
            // The update is allowed only if the 'status flow' is met
            var validChanges = AllowedStatusTransitions[transitionStatus];
            var allowChange = validChanges.Contains(status);
            return allowChange;
        }

        /* Notes: serialized values of SubscriptionStatus
         * Braintree.SubscriptionStatus.STATUSES.Select(s => s.ToString());
            string "Active"
            string "Canceled"
            string "Expired"
            string "Past Due"
            string "Pending"
         */
        /// <summary>
        /// Run membership requirements checks and returns
        /// the OwnerStatus that is expected for the user based on that
        /// (but is not saved and previous status is not checked).
        /// </summary>
        /// <param name="userID"></param>
        /// <returns>Status based on requirements</returns>
        public static LcEnum.OwnerStatus GetExpectedOwnerStatus(int userID)
        {
            // Check all requirements
            if (UserJobTitle.MeetsOwnershipRequirement(userID) &&
                OwnerAcknowledgment.MeetsOwnsershipRequirement(userID) &&
                UserPaymentPlan.MeetsOwnsershipRequirement(userID))
            {
                // It's OK
                return LcEnum.OwnerStatus.active;
            }
            else
            {
                // It failed
                var status = UserPaymentPlan.GetLastPaymentPlanStatus(userID);
                if (status == Braintree.SubscriptionStatus.CANCELED)
                {
                    return LcEnum.OwnerStatus.cancelled;
                }
                else if (status == Braintree.SubscriptionStatus.EXPIRED)
                {
                    return LcEnum.OwnerStatus.suspended;
                }
                else
                {
                    return LcEnum.OwnerStatus.inactive;
                }
            }
        }
        #endregion

        #region Persist
        /// <summary>
        /// Set the user OwnerStatus in database, only if different from current
        /// one, and saving a status history entry.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="status"></param>
        public static void Set(Owner owner)
        {
            var currentOwner = UserProfile.Get(owner.userID).owner;
            if (currentOwner.status != owner.status)
            {
                var allowChange = currentOwner.CanTransitionTo(owner.status);

                if (allowChange)
                {
                    // Save on database, with a new entry at the status history
                    var his = new OwnerStatusHistory
                    {
                        userID = owner.userID,
                        ownerStatusID = owner.statusID,
                        ownerStatusChangedDate = DateTime.Now,
                        ownerStatusChangedBy = "sys"
                    };
                    using (var db = new LcDatabase())
                    {
                        var trans = db.Connection.BeginTransaction();
                        OwnerStatusHistory.Set(his, db);
                        db.Execute(@"
                            UPDATE Users SET OwnerStatusID = @1
                            WHERE UserID = @0

                            -- First time user enters 'active' status,
                            -- set the anniversary date.
                            -- Impl: we check if is active:2 and inside set date as current only if null
                            IF @1 = 2 begin
                                UPDATE Users SET OwnerAnniversaryDate = getdate()
                                WHERE UserID = @0 AND OwnerAnniversaryDate is null
                            END
                        ", owner.userID, owner.statusID);
                        trans.Commit();
                    }
                }
            }
        }
        #endregion
    }
}
