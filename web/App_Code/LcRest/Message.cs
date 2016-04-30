using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    public class Message
    {
        #region Fields
        public int messageID;
        public int threadID;
        public int sentByUserID;
        public int typeID;
        public string auxT;
        public int? auxID;
        public string bodyText;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public static Message FromDB(dynamic record)
        {
            return new Message
            {
                messageID = record.messageID,
                threadID = record.threadID,
                sentByUserID = record.sentByUserID,
                typeID = record.typeID,
                auxT = record.auxT,
                auxID = record.auxID,
                bodyText = record.bodyText,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        private const string sqlSelect = @"
            SELECT  TOP @1
                    M.MessageID As messageID,
                    M.ThreadID As threadID,
                    M.SentByUserID As sentByUserID,
                    M.AuxT As auxT,
                    M.AuxID As auxID,
                    M.MessageTypeID As typeID,
                    M.BodyText As bodyText,
                    M.CreatedDate As createdDate,
                    M.UpdatedDate As updatedDate
            FROM    Messages As M
            WHERE   M.ThreadID = @0
                        AND
                    (@2 is null OR M.MessageID < @2)
                        AND
                    (@3 is null OR M.MessageID > @3)
        ";
        private const string sqlOrderDesc = @"
            -- Latest first, by creation/reception
            ORDER BY M.CreatedDate DESC
        ";
        private const string sqlOrderAsc = @"
            -- Latest first, by creation/reception
            ORDER BY M.CreatedDate ASC
        ";
        #endregion

        public static List<Message> GetList(int threadID, int limit = 20, int? untilID = null, int? sinceID = null)
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

                var data = db.Query(sql, threadID, limit, untilID, sinceID)
                 .Select(Message.FromDB)
                 .ToList();

                if (usingSinceOnly)
                {
                    // Since rows were get in ascending, records need to be inverted
                    // so we ever return data in descending order (latest first).
                    data.Reverse();
                }

                return data;
            }
        }

        private static Message GetFirstThreadMessage(int threadID)
        {
            using (var db = new LcDatabase())
            {
                return Message.FromDB(db.QuerySingle(@"
                    SELECT  TOP 1
                            M.MessageID As messageID,
                            M.ThreadID As threadID,
                            M.SentByUserID As sentByUserID,
                            M.AuxT As auxT,
                            M.AuxID As auxID,
                            M.MessageTypeID As typeID,
                            M.BodyText As bodyText,
                            M.CreatedDate As createdDate,
                            M.UpdatedDate As updatedDate
                    FROM    Messages As M
                    WHERE   M.ThreadID = @0
                    ORDER BY CreatedDate ASC
                ", threadID));
            }
        }
        #endregion

        #region Create
        public static int PostInquiry(int ThreadID, string BodyText, int SentByUserID)
        {
            // Get Thread info
            var thread = Thread.Get(ThreadID);
            // Validate user can send it (its in the thread)
            if (thread == null || (
                    SentByUserID != thread.clientUserID &&
                    SentByUserID != thread.serviceProfessionalUserID
                ))
            {
                // Not allowed, quick return, nothing done:
                return 0;
            }

            var clientEmail = UserProfile.GetEmail(thread.clientUserID);
            var serviceProfessionalEmail = UserProfile.GetEmail(thread.serviceProfessionalUserID);
            if (clientEmail != null && serviceProfessionalEmail != null)
            {
                bool SentByFreelancer = SentByUserID == thread.serviceProfessionalUserID;
                var firstMessage = GetFirstThreadMessage(ThreadID);
                var firstSentByFreelancer = firstMessage.sentByUserID == thread.serviceProfessionalUserID;

                // ThreadStatus: 1=respond, 2=responded
                // MessageType: 1=customer inquiry, 3=provider answer, 22=provider inquiry, 23=customer answer
                var statusID = 0;
                var typeID = 0;
                if (firstSentByFreelancer)
                {
                    if (SentByFreelancer)
                    {
                        // Freelancer is asking again
                        statusID = (int)LcMessaging.MessageThreadStatus.Respond;
                        typeID = (int)LcMessaging.MessageType.ProfessionalInquiry;
                    }
                    else
                    {
                        // Client answered
                        statusID = (int)LcMessaging.MessageThreadStatus.Responded;
                        typeID = (int)LcMessaging.MessageType.ClientResponseToInquiry;
                    }
                }
                else
                {
                    if (SentByFreelancer)
                    {
                        // Freelancer answered
                        statusID = (int)LcMessaging.MessageThreadStatus.Responded;
                        typeID = (int)LcMessaging.MessageType.ProfessionalResponseToInquiry;
                    }
                    else
                    {
                        // Client is asking again
                        statusID = (int)LcMessaging.MessageThreadStatus.Respond;
                        typeID = (int)LcMessaging.MessageType.ClientInquiry;
                    }
                }

                int messageID = LcMessaging.CreateMessage(ThreadID, statusID, typeID, BodyText, SentByUserID);

                // From a REST API, a copy is Not send to the original user, as in the general API, so just
                // send an email to the recipient
                // NOTE: the Kind possible values are in the template.
                if (SentByFreelancer)
                {
                    // NOTE: Message from freelancer to client, answering an inquiry started by the client.
                    LcMessaging.SendMail(clientEmail, "A Message From a Loconomics Freelancer",
                        LcMessaging.ApplyTemplate(LcUrl.LangPath + "Email/EmailInquiry/",
                        new Dictionary<string, object> {
                        { "ThreadID", ThreadID },
                        { "MessageID", messageID },
                        { "Kind", firstSentByFreelancer ? 6 : 2 },
                        { "RequestKey", LcMessaging.SecurityRequestKey },
                        { "EmailTo", clientEmail }
                    })
                    );
                }
                else
                {
                    // NOTE: Copy to the author. The author is a freelancer, answering to a client that started the inquiry.
                    LcMessaging.SendMail(serviceProfessionalEmail, "A Message From a Loconomics Client",
                        LcMessaging.ApplyTemplate(LcUrl.LangPath + "Email/EmailInquiry/",
                        new Dictionary<string, object> {
                        { "ThreadID", ThreadID },
                        { "MessageID", messageID },
                        { "Kind", firstSentByFreelancer ? 5 : 3 },
                        { "RequestKey", LcMessaging.SecurityRequestKey },
                        { "EmailTo", serviceProfessionalEmail }
                    })
                    );
                }

                return messageID;
            }
            // no emails, users don't exists or inactive
            return 0;
        }
        #endregion
    }
}