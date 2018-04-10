using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Tasks
{
    public class EarningsEntryReminderTask
    {
        private readonly LcLogger logger;

        private EarningsEntryReminderTask(LcLogger logger)
        {
            TaskStarted = DateTime.Now;
            this.logger = logger;
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

        /// <summary>
        /// Get list of userIDs for all users that must be reminded to introduce their earnings:
        /// - CCCUsers
        /// - UserType is 'student'
        /// </summary>
        /// <param name="db"></param>
        /// <returns></returns>
        private IEnumerable<int> QueryUsers(LcDatabase db)
        {
            return db.Query("SELECT userID FROM CCCUsers WHERE UserType like 'student'").Select((u) => (int)u.userID);
        }

        private bool ProcessUser(int userID)
        {
            ItemsReviewed += 1;
            try
            {
                LcMessaging.SendEarningsEntryReminder(userID, LcRest.UserProfile.GetEmail(userID));
                ItemsProcessed += 1;
            }
            catch (Exception ex)
            {
                logger.LogEx("Earnings Entry Reminder for userID:" + userID, ex);
            }
            return true;
        }

        public static EarningsEntryReminderTask Run(LcLogger logger)
        {
            var task = new EarningsEntryReminderTask(logger);

            using (var db = new LcDatabase())
            {
                task.QueryUsers(db).All(task.ProcessUser);
            }

            task.TaskEnded = DateTime.Now;

            logger.Log("Elapsed time {0}, for {1} Earnings Entry Reminders sent, out of {2} records reviewed",
                task.ElapsedTime, task.ItemsProcessed, task.ItemsReviewed);

            return task;
        }
    }
}
