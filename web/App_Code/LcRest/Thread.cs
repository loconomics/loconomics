using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class Thread
    {
        #region Fields
        public int threadID;
        public int clientUserID;
        public int serviceProfessionalUserID;
        public int jobTitleID;
        public int statusID;
        public string subject;
        public DateTime createdDate;
        public DateTime updatedDate;
        public List<Message> messages;
        #endregion

        #region Instances
        public static Thread FromDB(dynamic record, IEnumerable<dynamic> messages = null)
        {
            return new Thread
            {
                threadID = record.threadID,
                clientUserID = record.clientUserID,
                serviceProfessionalUserID = record.serviceProfessionalUserID,
                jobTitleID = record.jobTitleID,
                statusID = record.statusID,
                subject = record.subject,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                messages = messages == null ? null : messages.Select(Message.FromDB).ToList<Message>()
            };
        }
        #endregion

        #region Fetch
        #region SQL
        private const string sqlSelect = @"
            SELECT TOP @1
                T.ThreadID As threadID,
                T.CustomerUserID As clientUserID,
                T.ProviderUserID As serviceProfessionalUserID,
                T.PositionID As jobTitleID,
                T.MessageThreadStatusID As statusID,
                T.Subject As subject,
                T.CreatedDate As createdDate,
                T.UpdatedDate As updatedDate
            FROM MessagingThreads As T
            WHERE
                (T.CustomerUserID = @0 OR T.ProviderUserID = @0)
                    AND
                (@2 is null OR T.ThreadID < @2)
                    AND
                (@3 is null OR T.ThreadID > @3)
        ";
        /// <summary>
        /// UpdatedDate gets touch on every new message and thread edition
        /// is not possible except when adding a message, so
        /// it works effectively as 'date of last message'.
        /// </summary>
        private const string sqlOrderDesc = @"
            ORDER BY T.UpdatedDate DESC
        ";
        private const string sqlOrderAsc = @"
            ORDER BY T.UpdatedDate ASC
        ";
        private static readonly string sqlGetItem = @"
            SELECT TOP 1
                T.ThreadID As threadID,
                T.CustomerUserID As clientUserID,
                T.ProviderUserID As serviceProfessionalUserID,
                T.PositionID As jobTitleID,
                T.MessageThreadStatusID As statusID,
                T.Subject As subject,
                T.CreatedDate As createdDate,
                T.UpdatedDate As updatedDate
            FROM    MessagingThreads As T
            WHERE   ThreadID = @0
        ";
        #endregion

        public static List<Thread> GetList(int userID, int limit = 20, int? untilID = null, int? sinceID = null, int messagesLimit = 1)
        {
            // Maximum limit: 100
            if (limit > 100)
                limit = 100;
            else if (limit < 1)
                limit = 1;

            var sql = sqlSelect + sqlOrderDesc;

            // Generally, we get the more recent threads (order desc), except
            // if the parameter sinceID was set without an untilID: we
            // want the closest threads to that, in other words, 
            // the older threads that are more recent that sinceID.
            // A final sorting is done to return rows in descending as ever.
            var usingSinceOnly = sinceID.HasValue && !untilID.HasValue;
            if (usingSinceOnly)
            {
                sql = sqlSelect + sqlOrderAsc;
            }

            using (var db = new LcDatabase())
            {
                // db.Query has a bug not processiong parameters in 'select top @1'
                // so manual replacement
                sql = sql.Replace("@1", limit.ToString());

                var data = db.Query(sql, userID, limit, untilID, sinceID)
                 .Select(thread =>
                 {
                     var t = (Thread)Thread.FromDB(thread);
                     if (messagesLimit > 0)
                     {
                         t.messages = Message.GetList(thread.threadID, messagesLimit);
                     }
                     return t;
                 }).ToList();

                if (usingSinceOnly)
                {
                    // Since rows were get in ascending, records need to be inverted
                    // so we ever return data in descending order (latest first).
                    data.Reverse();
                }

                return data;
            }
        }
        
        public static Thread Get(int threadID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, threadID));
            }
        }
        #endregion

        #region Create
        /// <summary>
        /// Creat a thread with an initial message.
        /// Send email to the recipient, but without copy to sender.
        /// </summary>
        /// <param name="CustomerUserID"></param>
        /// <param name="FreelancerUserID"></param>
        /// <param name="JobTitleID"></param>
        /// <param name="Subject"></param>
        /// <param name="BodyText"></param>
        /// <param name="SentByFreelancer"></param>
        public static int PostInquiry(int CustomerUserID, int FreelancerUserID, int JobTitleID, string Subject, string BodyText, int SentByUserID)
        {
            // Validate user can send it (its in the thread)
            if (SentByUserID != CustomerUserID &&
                SentByUserID != FreelancerUserID)
            {
                // Not allowed, quick return, nothing done:
                return 0;
            }

            var clientEmail = UserProfile.GetEmail(CustomerUserID);
            var serviceProfessionalEmail = UserProfile.GetEmail(FreelancerUserID);
            if (clientEmail != null && serviceProfessionalEmail != null)
            {
                bool SentByFreelancer = SentByUserID == FreelancerUserID;

                int typeID = SentByFreelancer ? 22 : 1;
                int threadID = LcMessaging.CreateThread(CustomerUserID, FreelancerUserID, JobTitleID, Subject, typeID, BodyText, SentByUserID);

                // From a REST API, a copy is Not send to the original user, as in the general API, so just
                // send an email to the recipient
                // NOTE: the Kind possible values are in the template.
                if (SentByFreelancer)
                {
                    LcMessaging.SendMail(clientEmail, "A Message From a Loconomics Freelancer",
                        LcMessaging.ApplyTemplate(LcUrl.LangPath + "Email/EmailInquiry/",
                        new Dictionary<string, object> {
                        { "ThreadID", threadID },
                        { "Kind", 4 },
                        { "RequestKey", LcMessaging.SecurityRequestKey },
                        { "EmailTo", clientEmail }
                    })
                    );
                }
                else
                {
                    LcMessaging.SendMail(serviceProfessionalEmail, "A Message From a Loconomics Client",
                        LcMessaging.ApplyTemplate(LcUrl.LangPath + "Email/EmailInquiry/",
                            new Dictionary<string, object> {
                        { "ThreadID", threadID },
                        { "Kind", 1 },
                        { "RequestKey", LcMessaging.SecurityRequestKey },
                        { "EmailTo", serviceProfessionalEmail }
                    })
                    );
                }

                return threadID;
            }

            return 0;
        }
        #endregion
    }
}