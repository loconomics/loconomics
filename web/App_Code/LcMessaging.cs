using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;
using ASP;
using System.Net;
using System.Web.Caching;

/// <summary>
/// Descripción breve de LcMessaging
/// </summary>
public class LcMessaging
{
    #region SQLs
    private static readonly string sqlInsThread = @"
        INSERT INTO [MessagingThreads]
                   ([CustomerUserID]
                   ,[ProviderUserID]
                   ,[PositionID]
                   ,[MessageThreadStatusID]
                   ,[Subject]
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
             VALUES
                   (@0, @1, @2,
                    1, -- Status is 1 ever at first message (not responded)
                    @3,
                    getdate(), getdate(), 'sys')
        SELECT @@Identity As MessagingThreadID
    ";
    private static readonly string sqlUpdThread = @"
        UPDATE MessagingThreads
        SET     MessageThreadStatusID = coalesce(@1, MessagingThreads.MessageThreadStatusID),
                LastMessageID = @2,
                Subject = coalesce(@3, MessagingThreads.Subject),
                UpdatedDate = getdate(),
                ModifiedBy = 'sys'
        WHERE   ThreadID = @0
    ";
    private static readonly string sqlInsMessage = @"
        INSERT INTO [Messages]
                   (ThreadID
                   ,MessageTypeID
                   ,BodyText
                   ,AuxID
                   ,AuxT
                   ,SentByUserID
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
            VALUES (@0, @1, @2, @3, @4, @5, getdate(), getdate(), 'sys')
        SELECT @@Identity As MessageID
    ";
    private static readonly string sqlGetThread = @"
        SELECT CustomerUserID, ProviderUserID, PositionID, MessageThreadStatusID, Subject
        FROM    MessagingThreads
        WHERE   ThreadID = @0
    ";
    private static readonly string sqlGetUserData = @"
        SELECT  U.FirstName, U.LastName, U.UserID, P.Email
        FROM Users As U
              INNER JOIN
             UserProfile As P
               ON U.UserID = P.UserID
        WHERE   U.UserID = @0
    ";
    private static readonly string sqlGetThreadByAux = @"
        SELECT  ThreadID, CustomerUserID, ProviderUserID, PositionID, MessageThreadStatusID, Subject
        FROM    MessagingThreads
        WHERE   ThreadID = (
                SELECT TOP 1 ThreadID
                FROM Messages
                WHERE Messages.AuxID = @0 -- BookingID, BookingRequestID or another posible Auxiliar IDs
                       AND
                      Messages.AuxT = @1 -- Table/Type AuxID name
                ORDER BY ThreadID DESC -- We get the last ThreadID
            )
    ";
    #endregion

    #region Database operations
    /// <summary>
    /// Returns the new MessageID
    /// 
    ///MessageTypeID	MessageTypeName
    ///1	Customer inquiry
    ///2	Copy of customer inquiry
    ///3	Provider response to inquiry
    ///4	Customer booking request
    ///5	Copy of customer booking request
    ///6	Customer booking confirmation
    ///7	Provider booking confirmation
    ///8	Customer marketing
    ///9	Customer dispute
    ///10	Provider resolution
    ///11	Provider review
    ///12	Pricing adjustment to provider
    /// </summary>
    /// <param name="CustomerUserID"></param>
    /// <param name="ProviderUserID"></param>
    /// <param name="PositionID"></param>
    /// <param name="FirstMessageTypeID"></param>
    /// <param name="FirstMessageBody"></param>
    /// <returns></returns>
    public static int CreateThread(int CustomerUserID, int ProviderUserID, int PositionID, string ThreadSubject, int FirstMessageTypeID, string FirstMessageBody, int SentByUserID, int FirstMessageAuxID = -1, string FirstMessageAuxT = null)
    {
        int threadID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            threadID = (int)db.QueryValue(sqlInsThread, CustomerUserID, ProviderUserID, PositionID, ThreadSubject);
            int messageID = (int)db.QueryValue(sqlInsMessage, threadID, FirstMessageTypeID, FirstMessageBody, (FirstMessageAuxID == -1 ? null : (object)FirstMessageAuxID), FirstMessageAuxT, SentByUserID);
            // Update created thread with the lastMessageID
            db.Execute(sqlUpdThread, threadID, null, messageID, null);
        }
        return threadID;
    }
    /// <summary>
    /// Returns the new MessageID
    ///MessageTypeID	MessageTypeName
    ///1	Customer inquiry
    ///2	Copy of customer inquiry
    ///3	Provider response to inquiry
    ///4	Customer booking request
    ///5	Copy of customer booking request
    ///6	Customer booking confirmation
    ///7	Provider booking confirmation
    ///8	Customer marketing
    ///9	Customer dispute
    ///10	Provider resolution
    ///11	Provider review
    ///12	Pricing adjustment to provider
    /// </summary>
    /// <param name="ThreadID"></param>
    /// <param name="MessageTypeID"></param>
    /// <param name="MessageBody"></param>
    /// <returns></returns>
    public static int CreateMessage(int ThreadID, int MessageThreadStatusID, int MessageTypeID, string MessageBody, int SentByUserID, int MessageAuxID = -1, string MessageAuxT = null, string NewThreadSubject = null)
    {
        int messageID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            // Create Message
            messageID = (int)db.QueryValue(sqlInsMessage, ThreadID, MessageTypeID, MessageBody, (MessageAuxID == -1 ? null : (object)MessageAuxID), MessageAuxT, SentByUserID);
            // Update Thread status (and date automatically)
            db.Execute(sqlUpdThread, ThreadID, MessageThreadStatusID, messageID, NewThreadSubject);
        }
        return messageID;
    }
    #endregion

    #region Table Enumerations
    public enum MessageType : int
    {
        ClientInquiry = 1,
        CopyOfClientInquiry = 2,
        ProfessionalResponseToInquiry = 3,
        ClientBookingRequest = 4,
        CopyOfClientBookingRequest = 5,
        BookingRequestClientConfirmation = 6,
        BookingRequestProfessionalConfirmation = 7,
        ClientMarketing = 8,
        ClientDispute = 9,
        ProfessionalResolution = 10,
        PricingAdjustmentToProfessional = 12,
        BookingRequestProfessionalDeclined = 13,
        BookingRequestClientCancelled = 14,
        BookingProfessionalUpdate = 15,
        BookingClientUpdate = 16,
        ProfessionalBookingReview = 17,
        ClientBookingReview = 18,
        BookingUpdate = 19,
        ServicePerformed = 20,
        BookingComplete = 21,
        ProfessionalInquiry = 22,
        ClientResponseToInquiry = 23,
        //
        ProfessionalBooking = 50,
        RequestToReview = 51,
        RequestToReviewReminder = 52,
        BookingRequestExpired = 53,
        BookingReminder = 54
    }
    public enum MessageThreadStatus : int
    {
        Respond = 1,
        Responded = 2
    }
    #endregion

    #region Database queries (showing list, details, etc)
    private static readonly Dictionary<string, string> sqlListMessageThread = new Dictionary<string,string> {
    { "select", "SELECT " },    
    { "select-fields", @"
                T.ThreadID,
                T.CustomerUserID,
                T.ProviderUserID,
                T.PositionID,
                T.MessageThreadStatusID,
                T.UpdatedDate As LastMessageDate,
                T.Subject,

                T.LastMessageID,
                M.BodyText As LastMessageBodyText,
                M.MessageTypeID As LastMessageTypeID,
                M.AuxID As LastMessageAuxID,
                M.AuxT As LastMessageAuxT,
                M.SentByUserID As LastMessageSendByUserID,

                UC.FirstName As CustomerFirstName,
                UC.LastName As CustomerLastName,

                UP.FirstName As ProviderFirstName,
                UP.LastName As ProviderLastName,

                Pos.PositionSingular
    "},
    { "from", @"
        FROM    MessagingThreads As T
                 INNER JOIN
                Messages As M
                  ON M.ThreadID = T.ThreadID
                      AND
                     M.MessageID = T.LastMessageID
                 INNER JOIN
                Users As UC
                  ON UC.UserID = T.CustomerUserID
                 INNER JOIN
                Users As UP
                  ON UP.UserID = T.ProviderUserID
                 INNER JOIN
                Positions As Pos
                  ON Pos.PositionID = T.PositionID
					AND Pos.CountryID = @2 AND Pos.LanguageID = @1
    "},
    { "where", @"
        WHERE   (T.CustomerUserID = @0 OR T.ProviderUserID = @0)
    "},
    { "order-by", @"
        ORDER BY T.UpdatedDate DESC
    "},
    };
    public static dynamic GetMessageThreadList(int userID)
    {
        var sql = String.Join(" ", sqlListMessageThread.Values);
        using (var db = Database.Open("sqlloco")) {
            return db.Query(sql, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
        }
    }
    public static Dictionary<string, dynamic> GetLastNewReadSentMessages(int userID, int maxPerType = 3)
    {
        var commonSql = 
            "SELECT TOP " + maxPerType + " " +
            sqlListMessageThread["select-fields"] + 
            sqlListMessageThread["from"] + 
            sqlListMessageThread["where"];
        var order = sqlListMessageThread["order-by"];
        var sqlNew = commonSql + " AND T.MessageThreadStatusID = 1 AND M.SentByUserID <> @0 " + order;
        var sqlRead = commonSql + " AND T.MessageThreadStatusID = 2 AND M.SentByUserID <> @0 " + order;
        var sqlSent = commonSql + " AND M.SentByUserID = @0 " + order;
        var sqlList = new Dictionary<string, string> {
            { "new", sqlNew },
            { "read", sqlRead },
            { "sent", sqlSent }
        };

        var ret = new Dictionary<string, dynamic>();
        using (var db = Database.Open("sqlloco")) {
            foreach (var sql in sqlList)
            {
                dynamic d = db.Query(sql.Value, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                if (d != null && d.Count > 0)
                    ret[sql.Key] = d;
            }
        }
        return ret;
    }
    #endregion

    #region REST
    /// <summary>
    /// TODO: Move to LcRest Namespace
    /// </summary>
    public class RestThread
    {
        public int threadID;
        public int customerUserID;
        public int freelancerUserID;
        public int jobTitleID;
        public int statusID;
        public string subject;
        public DateTime createdDate;
        public DateTime updatedDate;
        public List<RestMessage> messages;

        public static RestThread FromDB(dynamic record, IEnumerable<dynamic> messages = null)
        {
            return new RestThread {
                threadID = record.threadID,
                customerUserID = record.customerUserID,
                freelancerUserID = record.freelancerUserID,
                jobTitleID = record.jobTitleID,
                statusID = record.statusID,
                subject = record.subject,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                messages = messages == null ? null : messages.Select(RestMessage.FromDB).ToList<RestMessage>()
            };
        }
    }
    public class RestMessage
    {
        public int messageID;
        public int threadID;
        public int sentByUserID;
        public int typeID;
        public string auxT;
        public int? auxID;
        public string bodyText;
        public DateTime createdDate;
        public DateTime updatedDate;

        public static RestMessage FromDB(dynamic record)
        {
            return new RestMessage {
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
    }

    #region SQL
    private const string sqlSelectRestThreads = @"
        SELECT TOP @1
            T.ThreadID As threadID,
            T.CustomerUserID As customerUserID,
            T.ProviderUserID As freelancerUserID,
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
    private const string sqlOrderDescRestThreads = @"
        ORDER BY T.UpdatedDate DESC
    ";
    private const string sqlOrderAscRestThreads = @"
        ORDER BY T.UpdatedDate ASC
    ";

    private const string sqlSelectRestMessages = @"
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
    private const string sqlOrderDescRestMessages = @"
        -- Latest first, by creation/reception
        ORDER BY M.CreatedDate DESC
    ";
    private const string sqlOrderAscRestMessages = @"
        -- Latest first, by creation/reception
        ORDER BY M.CreatedDate ASC
    ";
    #endregion

    public static List<RestThread> GetRestThreads(int userID, int limit = 20, int? untilID = null, int? sinceID = null, int messagesLimit = 1)
    {
        // Maximum limit: 100
        if (limit > 100)
            limit = 100;
        else if (limit < 1)
            limit = 1;

        var sql = sqlSelectRestThreads + sqlOrderDescRestThreads;

        // Generally, we get the more recent threads (order desc), except
        // if the parameter sinceID was set without an untilID: we
        // want the closest threads to that, in other words, 
        // the older threads that are more recent that sinceID.
        // A final sorting is done to return rows in descending as ever.
        var usingSinceOnly = sinceID.HasValue && !untilID.HasValue;
        if (usingSinceOnly)
        {
            sql = sqlSelectRestThreads + sqlOrderAscRestThreads;
        }

        using (var db = Database.Open("sqlloco"))
        {
            // db.Query has a bug not processiong parameters in 'select top @1'
            // so manual replacement
            sql = sql.Replace("@1", limit.ToString());

            var data = db.Query(sql, userID, limit, untilID, sinceID)
             .Select(thread =>
             {
                 var t = (RestThread)RestThread.FromDB(thread);
                 if (messagesLimit > 0)
                 {
                     t.messages = GetRestThreadMessages(thread.threadID, messagesLimit);
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
    public static List<RestMessage> GetRestThreadMessages(int threadID, int limit = 20, int? untilID = null, int? sinceID = null)
    {
        // Maximum limit: 100
        if (limit > 100)
            limit = 100;
        else if (limit < 1)
            limit = 1;

        var sql = sqlSelectRestMessages + sqlOrderDescRestMessages;

        // Generally, we get the more recent threads (order desc), except
        // if the parameter sinceID was set without an untilID: we
        // want the closest threads to that, in other words, 
        // the older threads that are more recent that sinceID.
        // A final sorting is done to return rows in descending as ever.
        var usingSinceOnly = sinceID.HasValue && !untilID.HasValue;
        if (usingSinceOnly)
        {
            sql = sqlSelectRestMessages + sqlOrderAscRestMessages;
        }

        using (var db = Database.Open("sqlloco"))
        {
            // db.Query has a bug not processiong parameters in 'select top @1'
            // so manual replacement
            sql = sql.Replace("@1", limit.ToString());

            var data = db.Query(sql, threadID, limit, untilID, sinceID)
             .Select(RestMessage.FromDB)
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

    private static RestMessage GetFirstThreadMessage(int threadID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return RestMessage.FromDB(db.QuerySingle(@"
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

    #region Creating Threads and Messages (Just inquiries)
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
    public static int PostRestThread(int CustomerUserID, int FreelancerUserID, int JobTitleID, string Subject, string BodyText, int SentByUserID)
    {
        // Validate user can send it (its in the thread)
        if (SentByUserID != CustomerUserID &&
            SentByUserID != FreelancerUserID) {
            // Not allowed, quick return, nothing done:
            return 0;
        }

        dynamic customer = null, provider = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Customer information
            customer = db.QuerySingle(sqlGetUserData, CustomerUserID);
            // Get Provider information
            provider = db.QuerySingle(sqlGetUserData, FreelancerUserID);
        }
        if (customer != null && provider != null)
        {
            bool SentByFreelancer = SentByUserID == FreelancerUserID;

            int typeID = SentByFreelancer ? 22 : 1;
            int threadID = CreateThread(CustomerUserID, FreelancerUserID, JobTitleID, Subject, typeID, BodyText, SentByUserID);

            // From a REST API, a copy is Not send to the original user, as in the general API, so just
            // send an email to the recipient
            // NOTE: the Kind possible values are in the template.
            if (SentByFreelancer)
            {
                SendMail(customer.Email, "A Message From a Loconomics Freelancer",
                    ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                    new Dictionary<string, object> {
                        { "ThreadID", threadID },
                        { "Kind", 4 },
                        { "RequestKey", SecurityRequestKey },
                        { "EmailTo", customer.Email }
                    })
                );
            }
            else
            {
                SendMail(provider.Email, "A Message From a Loconomics Client",
                    ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                        new Dictionary<string, object> {
                        { "ThreadID", threadID },
                        { "Kind", 1 },
                        { "RequestKey", SecurityRequestKey },
                        { "EmailTo", provider.Email }
                    })
                );
            }

            return threadID;
        }

        return 0;
    }
    public static int PostRestMessage(int ThreadID, string BodyText, int SentByUserID)
    {
        dynamic customer = null, provider = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThread, ThreadID);
            if (thread != null)
            {
                // Validate user can send it (its in the thread)
                if (SentByUserID != thread.CustomerUserID &&
                    SentByUserID != thread.ProviderUserID) {
                    // Not allowed, quick return, nothing done:
                    return 0;
                }

                // Get Customer information
                customer = db.QuerySingle(sqlGetUserData, thread.CustomerUserID);
                // Get Provider information
                provider = db.QuerySingle(sqlGetUserData, thread.ProviderUserID);
            }
        }
        if (customer != null && provider != null)
        {
            bool SentByFreelancer = SentByUserID == thread.ProviderUserID;
            var firstMessage = GetFirstThreadMessage(ThreadID);
            var firstSentByFreelancer = firstMessage.sentByUserID == thread.ProviderUserID;

            // ThreadStatus: 1=respond, 2=responded
            // MessageType: 1=customer inquiry, 3=provider answer, 22=provider inquiry, 23=customer answer
            var statusID = 0;
            var typeID = 0;
            if (firstSentByFreelancer)
            {
                if (SentByFreelancer)
                {
                    // Freelancer is asking again
                    statusID = 1;
                    typeID = 22;
                }
                else
                {
                    // Client answered
                    statusID = 2;
                    typeID = 23;
                }
            }
            else
            {
                if (SentByFreelancer)
                {
                    // Freelancer answered
                    statusID = 2;
                    typeID = 3;
                }
                else
                {
                    // Client is asking again
                    statusID = 1;
                    typeID = 1;
                }
            }

            int messageID = CreateMessage(ThreadID, statusID, typeID, BodyText, SentByUserID);

            // From a REST API, a copy is Not send to the original user, as in the general API, so just
            // send an email to the recipient
            // NOTE: the Kind possible values are in the template.
            if (SentByFreelancer)
            {
                // NOTE: Message from freelancer to client, answering an inquiry started by the client.
                SendMail(customer.Email, "A Message From a Loconomics Freelancer",
                    ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                    new Dictionary<string, object> {
                        { "ThreadID", ThreadID },
                        { "MessageID", messageID },
                        { "Kind", firstSentByFreelancer ? 6 : 2 },
                        { "RequestKey", SecurityRequestKey },
                        { "EmailTo", customer.Email }
                    })
                );
            }
            else
            {
                // NOTE: Copy to the author. The author is a freelancer, answering to a client that started the inquiry.
                SendMail(provider.Email, "A Message From a Loconomics Client",
                    ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                    new Dictionary<string, object> {
                        { "ThreadID", ThreadID },
                        { "MessageID", messageID },
                        { "Kind", firstSentByFreelancer ? 5 : 3 },
                        { "RequestKey", SecurityRequestKey },
                        { "EmailTo", provider.Email }
                    })
                );
            }

            return messageID;
        }

        return 0;
    }
    #endregion
    #endregion

    #region Message Summary (building small reusable summaries, as of messages listings)
    public class MessageSummary
    {
        private dynamic r;
        private int displayToUserID;

        public MessageSummary(dynamic messageRecord, int displayToUserID)
        {
            this.r = messageRecord;
            this.displayToUserID = displayToUserID;
        }

        public static List<int> BookingRelatedMessageTypes = new List<int> {
            4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 19, 17, 18
        };

        public string GetMessageTypeDependantSubject() {
            var ret = "";
            if (BookingRelatedMessageTypes.Contains((int)r.LastMessageTypeID)) {
                ret = "for ";
            } else {
                ret = "about ";
            }
            ret += r.PositionSingular + " services";
            return ret;
        }

        public string GetThreadParticipantFirstName() {
            if (r.ProviderUserID == displayToUserID) {
                return r.CustomerFirstName;
            } else {
                return r.ProviderFirstName;
            }
        }

        public string GetMessageUrl(string baseUrl = null) {
            if (baseUrl == null)
            {
                baseUrl = LcUrl.LangPath + "dashboard/";
            }
            var url = baseUrl;
            switch ((string)r.LastMessageAuxT) {
                default:
                    url += "Messages/Inquiry/" + r.ThreadID + "/" + r.LastMessageID + "/";
                    break;
                case "Booking":
                    url += "Messages/Booking/" + r.LastMessageAuxID + "/";
                    break;
                case "BookingRequest":
                    url += "Messages/BookingRequest/" + r.LastMessageAuxID + "/";
                    break;
            }
            return url;
        }

        public string GetMessageTypeLabel() {
            var ret = "";
            switch((int)r.LastMessageTypeID) {
                default:            
                case 1:
                case 2:
                case 3:
                    ret = "Message";
                    break;
                case 4:
                case 5:
                    ret = "Booking request";
                    break;
                case 6:
                case 7:
                    ret = "Booking confirmation";
                    break;
                case 8:
                    ret = "Marketing";
                    break;
                case 9:
                    ret = "Booking dispute";
                    break;
                case 10:
                    ret = "Booking resolution";
                    break;
                case 12:
                    ret = "Pricing adjustment";
                    break;
                case 13:
                    ret = "Booking declined";
                    break;
                case 14:
                    ret = "Booking cancelled";
                    break;
                case 15:
                case 16:
                case 19:
                    ret = "Booking update";
                    break;
                case 17:
                case 18:
                    ret = "Booking review";
                    break;
            }
            return ret;
        }
    }
    #endregion

    #region Type:Booking
    /// <summary>
    /// Implements methods to send messages about bookings with the full set of
    /// available templates for each type of booking.
    /// The base SendBooking class works as a state machine with helper methods that prepare the data
    /// and performs common logic. Derivated classes based on type of booking implements the specific template messages,
    /// using the base class making implementation of each template easier and shorter.
    /// 
    /// Samples usage:
    ///  LcMessaging.SendBooking.Marketplace.For(bookingID).BookingRequestExpired();
    ///  LcMessaging.SendBooking.BookingReminder(b.bookingID);
    /// </summary>
    public class SendBooking
    {
        #region Static Utils
        static string GetBookingThreadSubject(LcEmailTemplate.BookingEmailInfo info)
        {
            return info.userJobTitle.jobTitleSingularName + " " +
                info.booking.serviceDate.startTime.ToLongDateString() + ", " +
                info.booking.serviceDate.startTime.ToShortTimeString() + " to " +
                info.booking.serviceDate.endTime.ToShortTimeString();
        }
        /// <summary>
        /// Get the package name and main information in one line of plain-text.
        /// It shows the inperson-phone text if need, number of appointments,
        /// duration and pricing-mod extra-details following its pricing-config
        /// in a standard format for this package summary.
        /// </summary>
        /// <param name="service"></param>
        /// <returns></returns>
        static string GetOneLinePackageSummary(LcRest.ServiceProfessionalService service, LcRest.PricingSummaryDetail pricing)
        {
            var f = "";
            var inpersonphone = "";

            var pricingConfig = LcPricingModel.PackageBasePricingTypeConfigs[service.pricingTypeID];
            if (pricing.numberOfSessions > 1)
            {
                if (pricing.firstSessionDurationMinutes == 0)
                    f = pricingConfig.NameAndSummaryFormatMultipleSessionsNoDuration;
                else
                    f = pricingConfig.NameAndSummaryFormatMultipleSessions;
            }
            else if (pricing.firstSessionDurationMinutes == 0)
                f = pricingConfig.NameAndSummaryFormatNoDuration;
            if (String.IsNullOrEmpty(f))
                f = pricingConfig.NameAndSummaryFormat;

            if (pricingConfig.InPersonPhoneLabel != null)
                inpersonphone = service.isPhone
                    ? "phone"
                    : "in-person";

            var extraDetails = "";
            // Extra information for special pricings:
            if (pricingConfig.Mod != null && pricing.pricingSummaryID > 0)
            {
                // TODO PackageMod class will need refactor/renamings
                extraDetails = pricingConfig.Mod.GetPackagePricingDetails(service.serviceProfessionalServiceID, pricing.pricingSummaryID, pricing.pricingSummaryRevision);
            }

            // Show duration in a smart way.
            var duration = ASP.LcHelpers.TimeToSmartLongString(TimeSpan.FromMinutes((double)pricing.firstSessionDurationMinutes));

            var result = String.Format(f, pricing.serviceName, duration, pricing.numberOfSessions, inpersonphone);
            if (!String.IsNullOrEmpty(extraDetails))
            {
                result += String.Format(" ({0})", extraDetails);
            }
            return result;
        }
        static string GetBookingThreadBody(LcEmailTemplate.BookingEmailInfo info)
        {
            // Using a services summary as first thread message body:
            var servicePricings = LcEmailTemplate.ServicePricing.GetForPricingSummary(info.booking.pricingSummary);
            var details = servicePricings.Select(v => GetOneLinePackageSummary(v.service, v.pricing));
            return ASP.LcHelpers.JoinNotEmptyStrings("; ", details);
        }
        public class JobTitleMessagingFlags
        {
            public bool hipaa;
            public bool sendReviewReminderToClient;
            public static JobTitleMessagingFlags FromDB(dynamic record)
            {
                if (record == null) return null;
                return new JobTitleMessagingFlags
                {
                    hipaa = record.hipaa,
                    sendReviewReminderToClient = record.sendReviewReminderToClient
                };
            }
            public static JobTitleMessagingFlags Get(int jobTitleID, int languageID, int countryID)
            {
                using (var db = new LcDatabase())
                {
                    return JobTitleMessagingFlags.FromDB(db.QuerySingle(@"
                    SELECT TOP 1
                        coalesce(HIPAA, cast(0 as bit)) as hipaa,
                        coalesce(SendReviewReminderToClient, cast(0 as bit)) as sendReviewReminderToClient
                    FROM positions
                    WHERE positionID = @0 AND languageID = @1 AND countryID = @2
                ", jobTitleID, languageID, countryID));
                }
            }
        }
        static int CreateBookingThread(LcEmailTemplate.BookingEmailInfo info, int messageType, int sentByUserID)
        {
            var threadSubject = GetBookingThreadSubject(info);
            var threadBody = GetBookingThreadBody(info);
            return CreateThread(info.booking.clientUserID, info.booking.serviceProfessionalUserID, info.booking.jobTitleID, threadSubject, messageType, threadBody, sentByUserID, info.booking.bookingID, "booking");
        }
        static int CreateBookingMessage(LcEmailTemplate.BookingEmailInfo info, int messageType, int threadStatusID, int sentByUserID, string message, bool includeBookingDetails)
        {
            using (var db = new LcDatabase())
            {
                // Get Thread info
                var thread = db.QuerySingle(sqlGetThreadByAux, info.booking.bookingID, "booking");
                int threadID = 0;
                // For security, if no thread exists yet (some problem or old version that didn't generate thread properly), create one now and get ID
                if (thread == null)
                    threadID = CreateBookingThread(info, messageType, sentByUserID);
                else
                    threadID = thread.threadID;
                if (includeBookingDetails)
                    message += (message[message.Length - 1] == '.' ? "" : ". ") + "\n" + GetBookingThreadBody(info);
                return CreateMessage(threadID, threadStatusID, messageType, message, sentByUserID, info.booking.bookingID, "booking");
            }
        }
        #endregion
        #region State data
        string path = "EmailCommunications/Booking/";
        string tpl = "";
        string toEmail = "";
        string fromEmail = "";
        string subject = "";
        LcEmailTemplate.BookingEmailInfo info;
        JobTitleMessagingFlags flags;
        #endregion
        #region Internal methods
        public SendBooking(string subPath)
        {
            path += subPath;
        }
        void send()
        {
            SendMail(toEmail, subject,
                ApplyTemplate(LcUrl.LangPath + path + tpl,
                new Dictionary<string, object> {
                    { "bookingID", info.booking.bookingID }
                    ,{ "RequestKey", SecurityRequestKey }
                }), fromEmail
            );
        }
        void prepareData(int bookingID)
        {
            info = LcEmailTemplate.GetBookingInfo(bookingID);
            flags = JobTitleMessagingFlags.Get(info.booking.jobTitleID, info.booking.languageID, info.booking.countryID);
        }
        void prepareData(LcEmailTemplate.BookingEmailInfo info)
        {
            this.info = info;
            flags = JobTitleMessagingFlags.Get(info.booking.jobTitleID, info.booking.languageID, info.booking.countryID);
        }
        void sendToClient(string tplName)
        {
            toEmail = info.client.email;
            fromEmail = info.serviceProfessional.firstName + " " + info.serviceProfessional.lastName + " <automated@loconomics.com>";
            tpl = "ToClient/" + tplName + (flags.hipaa ? "HIPAA" : "");
            send();
        }
        void sendToServiceProfessional(string tplName)
        {
            toEmail = info.serviceProfessional.email;
            fromEmail = "Loconomics Scheduler <automated@loconomics.com>";
            tpl = "ToServiceProfessional/" + tplName + (flags.hipaa ? "HIPAA" : "");
            send();
        }
        #endregion
        #region Common Interface methods
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingReminder() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        /// <param name="isReminder"></param>
        public virtual void RequestToReview(bool isReminder) { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void ServicePerformed() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingComplete() { }
        /// <summary>
        /// Connected: Yes (LcRest.Booking.InsClientBooking)
        /// </summary>
        public virtual void BookingRequest() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingRequestExpired() { }
        /// <summary>
        /// Connected: Yes (LcRest.Booking.InsClientBooking and LcRest.Booking.InsServiceProfessionalBooking)
        /// </summary>
        public virtual void InstantBookingConfirmed() { }
        /// <summary>
        /// Connected: NO (there is no update-client API still)
        /// </summary>
        public virtual void BookingUpdatedByClient() { }
        /// <summary>
        /// Connected: NO
        /// </summary>
        public virtual void BookingCancelledByServiceProfessional() { }
        /// <summary>
        /// Connected: NO
        /// </summary>
        public virtual void BookingUpdatedByServiceProfessional() { }
        /// <summary>
        /// Connected: NO
        /// </summary>
        public virtual void BookingCancelledByClient() { }
        #endregion
        #region Access to singletons for Types of Bookings
        public static SendServiceProfessionalBooking ServiceProfessionalBooking = new SendServiceProfessionalBooking();
        public static SendMarketplaceBooking Marketplace = new SendMarketplaceBooking();
        public static SendBookNowBooking BookNow = new SendBookNowBooking();
        #endregion
        #region Types of Bookings
        public class SendServiceProfessionalBooking : SendBooking
        {
            public SendServiceProfessionalBooking() : base("ServiceProfessionalBooking/") {}
            public new SendServiceProfessionalBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendServiceProfessionalBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }
            public override void InstantBookingConfirmed()
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.ProfessionalBooking, info.booking.serviceProfessionalUserID);
                sendToClient("InstantBookingConfirmed");
            }
            public override void RequestToReview(bool isReminder)
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = isReminder ? "Reminder to review my services" : "Thank you and request to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReview, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReview" + (isReminder ? "Reminder" : ""));
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcHelpers.DateTimeRangeToString(info.booking.serviceDate.startTime, info.booking.serviceDate.endTime));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/dani0198/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingComplete()
            {
                subject = "Client has paid in full and service professional has been paid in full";
                CreateBookingMessage(info, (int)MessageType.BookingComplete, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
                sendToServiceProfessional("BookingUpdatedByClient");
            }
        }
        public class SendMarketplaceBooking : SendBooking
        {
            public SendMarketplaceBooking() : base("Marketplace/") { }
            public new SendMarketplaceBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendMarketplaceBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }
            public override void BookingRequest()
            {
                subject = "Appointment request received";
                CreateBookingThread(info, (int)MessageType.ClientBookingRequest, info.booking.clientUserID);
                sendToClient("BookingRequestSummary");
                sendToServiceProfessional("BookingRequestSummary");
            }
            public override void InstantBookingConfirmed()
            {
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.BookingRequestClientConfirmation, info.booking.clientUserID);
                sendToClient("InstantBookingConfirmed");
                sendToServiceProfessional("InstantBookingConfirmed");
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcHelpers.DateTimeRangeToString(info.booking.serviceDate.startTime, info.booking.serviceDate.endTime));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void BookingRequestExpired()
            {
                var neutralSubject = "Booking request has expired";
                CreateBookingMessage(info, (int)MessageType.BookingRequestExpired, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);

                subject = "Your appointment request has expired";
                sendToClient("BookingRequestExpired");

                subject = String.Format("{0}'s appointment request has expired", info.client.firstName);
                sendToServiceProfessional("BookingRequestExpired");
            }
            public override void RequestToReview(bool isReminder)
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = isReminder ? "Reminder to review my services" : "Thank you and request to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReview, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReview" + (isReminder ? "Reminder" : ""));
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/dani0198/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingComplete()
            {
                subject = "Client has paid in full and service professional has been paid in full";
                CreateBookingMessage(info, (int)MessageType.BookingComplete, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
                sendToServiceProfessional("BookingUpdatedByClient");
            }
        }
        public class SendBookNowBooking : SendBooking
        {
            public SendBookNowBooking() : base("BookNow/") { }
            public new SendBookNowBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendBookNowBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }
            public override void BookingRequest()
            {
                subject = "Appointment request received";
                CreateBookingThread(info, (int)MessageType.ClientBookingRequest, info.booking.clientUserID);
                sendToClient("BookingRequestSummary");
                sendToServiceProfessional("BookingRequestSummary");
            }
            public override void InstantBookingConfirmed()
            {
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.BookingRequestClientConfirmation, info.booking.clientUserID);
                sendToClient("InstantBookingConfirmed");
                sendToServiceProfessional("InstantBookingConfirmed");
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcHelpers.DateTimeRangeToString(info.booking.serviceDate.startTime, info.booking.serviceDate.endTime));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void BookingRequestExpired()
            {
                var neutralSubject = "Booking request has expired";
                CreateBookingMessage(info, (int)MessageType.BookingRequestExpired, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);

                subject = "Your appointment request has expired";
                sendToClient("BookingRequestExpired");

                subject = String.Format("{0}'s appointment request has expired", info.client.firstName);
                sendToServiceProfessional("BookingRequestExpired");
            }
            public override void RequestToReview(bool isReminder)
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = isReminder ? "Reminder to review my services" : "Thank you and request to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReview, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReview" + (isReminder ? "Reminder" : ""));
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/dani0198/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingComplete()
            {
                subject = "Client has paid in full and service professional has been paid in full";
                CreateBookingMessage(info, (int)MessageType.BookingComplete, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
                sendToServiceProfessional("BookingUpdatedByClient");
            }
        }
        #endregion
        /// <summary>
        /// Factory that provides the correct SendBooking instance based on the booking type and fills the booking data.
        /// </summary>
        /// <param name="bookingID"></param>
        /// <returns></returns>
        public static SendBooking For(int bookingID)
        {
            var info = LcEmailTemplate.GetBookingInfo(bookingID);
            switch ((LcEnum.BookingType)info.booking.bookingTypeID)
            {
                case LcEnum.BookingType.bookNowBooking:
                    return BookNow.For(info);
                case LcEnum.BookingType.marketplaceBooking:
                    return Marketplace.For(info);
                case LcEnum.BookingType.serviceProfessionalBooking:
                    return ServiceProfessionalBooking.For(info);
                case LcEnum.BookingType.exchangeBooking:
                    throw new NotImplementedException("Exchange BookingReminder");
                case LcEnum.BookingType.partnerBooking:
                    throw new NotImplementedException("Partner BookingReminder");
                default:
                    throw new NotImplementedException("Unknow booking type");
            }
        }
    }
    #endregion

    #region OLD? Type:Inquiry
    public static void SendCustomerInquiry(int CustomerUserID, int ProviderUserID, int PositionID, string InquirySubject, string InquiryText)
    {
        dynamic customer = null, provider = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Customer information
            customer = db.QuerySingle(sqlGetUserData, CustomerUserID);
            // Get Provider information
            provider = db.QuerySingle(sqlGetUserData, ProviderUserID);
        }
        if (customer != null && provider != null)
        {
            int threadID = CreateThread(CustomerUserID, ProviderUserID, PositionID, InquirySubject, 1, InquiryText, CustomerUserID);

            // NOTE: Message from client to freelancer
            SendMail(provider.Email, "A Message From a Loconomics Client",
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", threadID }
                ,{ "Kind", 1 } // Customer inquiry (first message)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            // NOTE: Copy to the author. The author is a client sending message to a freelancer.
            SendMail(customer.Email, "Copy of your inquiry",
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", threadID }
                ,{ "Kind", -1 } // Copy to author of Customer inquiry (first message)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
        }
    }
    public static void SendProviderInquiryAnswer(int ThreadID, string InquiryAnswer)
    {
        dynamic customer = null, provider = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThread, ThreadID);
            if (thread != null)
            {
                // Get Customer information
                customer = db.QuerySingle(sqlGetUserData, thread.CustomerUserID);
                // Get Provider information
                provider = db.QuerySingle(sqlGetUserData, thread.ProviderUserID);
            }
        }
        if (customer != null && provider != null)
        {
            // ThreadStatus=2, responded; MessageType=3, provider answer
            int messageID = CreateMessage(ThreadID, 2, 3, InquiryAnswer, thread.ProviderUserID);

            // NOTE: Message from freelancer to client, answering an inquiry started by the client.
            SendMail(customer.Email, "A Message From a Loconomics Provider", 
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 2 } // Provider inquiry answer (second message and upper evens)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
            // NOTE: Copy to the author. The author is a freelancer, answering to a client that started the inquiry.
            SendMail(provider.Email, "Copy of your answer", 
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", -2 } // Copy to author of Provider inquiry answer (second message and upper evens)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
        }
    }
    public static void SendCustomerInquiryAnswer(int ThreadID, string InquiryAnswer)
    {
        dynamic customer = null, provider = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThread, ThreadID);
            if (thread != null)
            {
                // Get Customer information
                customer = db.QuerySingle(sqlGetUserData, thread.CustomerUserID);
                // Get Provider information
                provider = db.QuerySingle(sqlGetUserData, thread.ProviderUserID);
            }
        }
        if (customer != null && provider != null)
        {
            // ThreadStatus=1, respond; MessageType=1, customer inquiry
            int messageID = CreateMessage(ThreadID, 1, 1, InquiryAnswer, thread.CustomerUserID);

            // NOTE: Message from client to freelancer, answering (or any further message) an inquiry started by the client (itself).
            SendMail(provider.Email, "A Message From a Loconomics Client", 
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 3 } // Customer inquiry answer (third message and upper odds)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            // NOTE: Copy to the author. The author is a client, answering to a freelancer (or any further message).
            // The client started the inquiry.
            SendMail(customer.Email, "Copy of your answer", 
                ApplyTemplate(LcUrl.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", -3 } // Copy to author of Customer inquiry answer (third message and upper odds)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
        }
    }
    #endregion

    #region OLD? Type:Welcome
    [Obsolete("Disabled because it's broken")]
    public static void SendWelcomeProvider(int providerID, string providerEmail, string confirmationURL)
    {
        return;
        SendMail(providerEmail, "[Action Required] Welcome to Loconomics-Please Verify Your Account",
            ApplyTemplate(LcUrl.LangPath + "Email/EmailWelcomeProvider/",
            new Dictionary<string,object> {
                { "UserID", providerID },
                { "EmailTo", providerEmail },
                { "ConfirmationURL", HttpUtility.UrlEncode(confirmationURL) }
         }));
    }
    [Obsolete("Disabled because it's broken")]
    public static void SendWelcomeCustomer(int userID, string userEmail, string confirmationURL, string confirmationToken)
    {
        return;
        SendMail(userEmail, "[Action Required] Welcome to Loconomics-Please Verify Your Account",
            ApplyTemplate(LcUrl.LangPath + "Email/EmailWelcomeCustomer/",
            new Dictionary<string, object> {
                { "UserID", userID },
                { "EmailTo", userEmail },
                { "ConfirmationURL", HttpUtility.UrlEncode(confirmationURL) },
                { "ConfirmationToken", HttpUtility.UrlEncode(confirmationToken) }
        }));
    }
    [Obsolete("Disabled because it's broken")]
    public static void SendResetPassword(int userID, string userEmail, string resetURL, string resetToken)
    {
        return;
        SendMail(userEmail, "[Action Required] Loconomics Password Recovery",
            ApplyTemplate(LcUrl.LangPath + "Email/EmailResetPassword/",
            new Dictionary<string, object> {
                { "UserID", userID },
                { "EmailTo", userEmail },
                { "ResetURL", HttpUtility.UrlEncode(resetURL) },
                { "ResetToken", HttpUtility.UrlEncode(resetToken) }
        }));
    }
    #endregion

    #region OLD? Type:ReportAbuse
    public static void SendReportUnauthorizedUse(int reportedByUserID, int reportedUserID, string message)
    {
        SendMail("legal@loconomics.com", "Report of Unauthorized Use",
            ApplyTemplate(LcUrl.LangPath + "Email/EmailReportUnauthorizedUse/",
            new Dictionary<string,object> {
                { "ReportedByUserID", reportedByUserID },
                { "ReportedUserID", reportedUserID },
                { "Message", message },
                { "EmailTo", "legal@loconomics.com" }
         }));
    }
    #endregion

    #region Notification to Loconomics Stuff/Support
    public static void NotifyNewJobTitle(string jobTitleName, int jobTitleID)
    {
        try
        {
            var channel = LcHelpers.Channel == "live" ? "" : " at " + LcHelpers.Channel;
            SendMail("support@loconomics.zendesk.com",
                "New job title" + channel + ": " + jobTitleName,
                "Generated new job title with name '" + jobTitleName + "', assigned ID: " + jobTitleID
            );
        }
        catch { }
    }
    public static void NotifyNewServiceAttributes(int userID, int jobTitleID, Dictionary<int, List<string>> proposedAttributes)
    {
        try
        {
            var msg = String.Format("Generated new service attributes by userID:{0} for job title:{1}, pending of approval:<br/>\n<br/>\n", userID, jobTitleID);
            msg += String.Join("<br/>\n", proposedAttributes
                .Select(x => String.Format("- For serviceAttributeCategoryID {0}: {1}", x.Key, String.Join(", ", x.Value)))
            );

            var channel = LcHelpers.Channel == "live" ? "" : " at " + LcHelpers.Channel;
            SendMail("support@loconomics.zendesk.com",
                "New service attributes" + channel,
                msg
            );
        }
        catch { }
    }
    #endregion

    #region OLD? Type:MerchantAccountNotification
    public static void SendMerchantAccountNotification(int providerUserID)
    {
        SendMail("support@loconomics.com", "Marketplace: Merchant Account Notification",
            ApplyTemplate(LcUrl.LangPath + "Email/EmailProviderPaymentAccountNotification/",
            new Dictionary<string,object> {
                { "ProviderID", providerUserID},
                { "EmailTo", "support@loconomics.com" }
         }));
    }
    #endregion

    #region Template System
    public static string ApplyTemplate(string tplUrl, Dictionary<string, object> data)
    {
        string rtn = "";

        using (WebClient w = new WebClient())
        {
            w.Encoding = System.Text.Encoding.UTF8;

            // Setup URL
            string completeURL = LcUrl.SiteUrl + LcUrl.GetTheGoodURL(tplUrl);
            if (LcHelpers.Channel != "live")
            {
                completeURL = completeURL.Replace("https:", "http:");
            }

            // First, we need substract from the URL the QueryString to be
            // assigned to the WebClient object, avoiding problems while
            // manipulating the w.QueryString directly, and allowing both vias (url and data paramenter)
            // to set paramenters
            var uri = new Uri(completeURL);
            w.QueryString = HttpUtility.ParseQueryString(uri.Query);
            completeURL = uri.GetLeftPart(UriPartial.Path);

            if (data != null)
            foreach (var d in data)
            {
                w.QueryString.Add(d.Key, (d.Value ?? "").ToString());
            }
            if (!w.QueryString.AllKeys.Contains<string>("RequestKey"))
                w.QueryString["RequestKey"] = SecurityRequestKey;

            try
            {
                rtn = w.DownloadString(completeURL);
            }
            catch (WebException exception)
            {
                string responseText;
                using (var reader = new System.IO.StreamReader(exception.Response.GetResponseStream()))
                {
                    responseText = reader.ReadToEnd();
                }
                string qs = GetWebClientQueryString(w);
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("Email ApplyTemplate URL:{0}", completeURL + qs);
                    logger.LogEx("Email ApplyTemplate exception (previous logged URL)", exception);
                    logger.Save();
                }
                if (LcHelpers.InDev)
                {
                    HttpContext.Current.Trace.Warn("LcMessagging.ApplyTemplate", "Error creating template " + completeURL + qs, exception);
                    throw new Exception(exception.Message + "::" + responseText);
                }
                else
                {
                    NotifyError("LcMessaging.ApplyTemplate", completeURL + qs, responseText);
                    throw new Exception("Email could not be sent");
                }
            }
            catch (Exception ex)
            {
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("Email ApplyTemplate URL: {0}", completeURL + GetWebClientQueryString(w));
                    logger.LogEx("Email ApplyTemplate exception (previous logged URL)", ex);
                    logger.Save();
                }
                throw new Exception("Email could not be sent");
            }
            // Next commented line are test for another tries to get web content processed,
            // can be usefull test if someone have best performance than others, when need.
            //HttpContext.Current.Response.Output = null;
            //var o = new System.IO.StringWriter();
            //var r = new System.Web.Hosting.SimpleWorkerRequest(tplUrl, "", o);
            //Server.Execute()
            //System.Web.UI.PageParser.GetCompiledPageInstance
        }

        return rtn;
    }
    private static string GetWebClientQueryString(WebClient w)
    {
        string qs = "?";
        foreach (var v in w.QueryString.AllKeys)
        {
            qs += v + "=" + w.QueryString[v] + "&";
        }
        return qs;
    }
    private static readonly string SecurityRequestKey = "abcd3";
    public static void SecureTemplate()
    {
        if ((LcHelpers.InLive && !HttpContext.Current.Request.IsLocal) ||
            HttpContext.Current.Request["RequestKey"] != SecurityRequestKey)
            throw new HttpException(403, "Forbidden");
    }
    #endregion

    #region Generic app utilities
    public static void NotifyError(string where, string url, string exceptionPageContent)
    {
        try
        {
            SendMail("support@loconomics.com", LcHelpers.Channel + ": Exception on " + where + ": " + url,
                exceptionPageContent);
        }
        catch { }
    }
    #endregion

    #region Send Mail wrapper function
    private static bool LogSuccessSendMail
    {
        get
        {
            try
            {
                return System.Configuration.ConfigurationManager.AppSettings["LogSuccessSendMail"] == "true";
            }
            catch
            {
                return false;
            }
        }
    }
    public static bool SendMail(string to, string subject, string body, string from = null)
    {
        // No mails for local development.
        if (LcHelpers.Channel == "localdev") return false;

        return SendMailNow(to, subject, body, from);
        //return ScheduleEmail(TimeSpan.FromMinutes(1), to, subject, body, from);
    }
    private static bool SendMailNow(string to, string subject, string body, string from = null)
    {
        try
        {
            WebMail.Send(to, subject, body, from, contentEncoding: "utf-8");

            if (LogSuccessSendMail)
            {
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("SUCCESS WebMail.Send, to:{0}, subject:{1}, from:{2}", to, subject, from);
                    logger.Save();
                }
            }
            return true;
        }
        catch (Exception ex) {
            using (var logger = new LcLogger("SendMail"))
            {
                logger.Log("WebMail.Send, to:{0}, subject:{1}, from:{2}, body::", to, subject, from);
                if (!String.IsNullOrEmpty(body)) {
                    logger.LogData(body);
                }
                else {
                    logger.Log("**There is no message body**");
                }
                logger.LogEx("SendMail (previous logged email)", ex);
                logger.Save();
            }
        }
        return false;
    }
    #endregion

    #region Email Scheduling
    /// <summary>
    /// Schedules an email to be sended after the delayTime especified.
    /// Technically, this method create a Cache event that expires after 3h, sending the email after that.
    /// 
    /// TODO: at the moment there is no fallback security, if the server stops or crashs for some reason
    /// the info might be lost, the event should be also stored in DDBB for manual/automated recovery
    /// in case of system failure.
    /// </summary>
    /// <param name="delayTime"></param>
    /// <param name="emailto"></param>
    /// <param name="emailsubject"></param>
    /// <param name="emailbody"></param>
    public static bool SendMailDelayed(TimeSpan delayTime, string emailto, string emailsubject, string emailbody, string from = null)
    {
        try
        {
            HttpContext.Current.Cache.Insert("ScheduledEmail: " + emailsubject,
                new Dictionary<string, string>()
                {
                    { "emailto", emailto },
                    { "emailsubject", emailsubject },
                    { "emailbody", emailbody },
                    { "emailfrom", from }
                },
                null,
                System.Web.Caching.Cache.NoAbsoluteExpiration, delayTime,
                CacheItemPriority.Normal,
                new CacheItemRemovedCallback(ScheduleEmailCacheItemRemovedCallback));

            return true;
        }
        catch
        {
            return false;
        }
    }
    /// <summary>
    /// Cache Callback that Sends the email
    /// </summary>
    /// <param name="key"></param>
    /// <param name="value"></param>
    /// <param name="reason"></param>
    static void ScheduleEmailCacheItemRemovedCallback(string key, object value, CacheItemRemovedReason reason)
    {
        try
        {
            Dictionary<string, string> emaildata = (Dictionary<string, string>)value;

            string emailto = emaildata["emailto"];
            string body = emaildata["emailbody"]; //"This is a test e-mail message sent using loconomics as a relay server ";
            string subject = emaildata["emailsubject"]; //"Loconomics test email";
            string from = emaildata["emailfrom"];

            SendMailNow(emailto, subject, body, from);

            // TODO: Test using the normal API for email sending, trying to solve current problem with
            // emails not being sent by this way:
            /*
                SmtpClient client = new SmtpClient("mail.loconomics.com", 25);
                client.EnableSsl = false;
                client.Credentials = new NetworkCredential("automated@loconomics.com", "Loconomic$2011");
                MailAddress from = new MailAddress(from);
                MailAddress to = new MailAddress(mail);
                MailMessage message = new MailMessage(from, to);
                client.SendAsync(message,"testing");
             */
        }
        catch (Exception ex)
        {
            if (HttpContext.Current != null)
                HttpContext.Current.Trace.Warn("LcMessaging.ScheduleEmail=>CacheItemRemovedCallback Error: " + ex.ToString());
            using (var logger = new LcLogger("SendMail"))
            {
                logger.LogEx("ScheduleEmail exception getting details from cache", ex);
                logger.Save();
            }
        }
    }
    #endregion
}