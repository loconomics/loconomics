using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;
using ASP;
using System.Net;

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
        SET     MessageThreadStatusID = @1,
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
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
            VALUES (@0, @1, @2, @3, @4, getdate(), getdate(), 'sys')
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
    public static int CreateThread(int CustomerUserID, int ProviderUserID, int PositionID, string ThreadSubject, int FirstMessageTypeID, string FirstMessageBody, int FirstMessageAuxID = -1, string FirstMessageAuxT = null)
    {
        int threadID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            threadID = (int)db.QueryValue(sqlInsThread, CustomerUserID, ProviderUserID, PositionID, ThreadSubject);
            db.Execute(sqlInsMessage, threadID, FirstMessageTypeID, FirstMessageBody, (FirstMessageAuxID == -1 ? null : (object)FirstMessageAuxID), FirstMessageAuxT);
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
    public static int CreateMessage(int ThreadID, int MessageThreadStatusID, int MessageTypeID, string MessageBody, int MessageAuxID = -1, string MessageAuxT = null)
    {
        int messageID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            // Create Message
            messageID = (int)db.QueryValue(sqlInsMessage, ThreadID, MessageTypeID, MessageBody, (MessageAuxID == -1 ? null : (object)MessageAuxID), MessageAuxT);
            // Update Thread status (and date automatically)
            db.Execute(sqlUpdThread, ThreadID, MessageThreadStatusID);
        }
        return messageID;
    }
    #endregion

    #region Type:Booking and Booking Request
    /// <summary>
    /// A Booking Request is ever sent by a customer
    /// </summary>
    /// <param name="CustomerUserID"></param>
    /// <param name="ProviderUserID"></param>
    /// <param name="PositionID"></param>
    /// <param name="BookingRequestID"></param>
    public static void SendBookingRequest(int CustomerUserID, int ProviderUserID, int PositionID, int BookingRequestID)
    {
        dynamic customer = null, provider = null, booking = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Customer information
            customer = db.QuerySingle(sqlGetUserData, CustomerUserID);
            // Get Provider information
            provider = db.QuerySingle(sqlGetUserData, ProviderUserID);
            // Get Booking Request information
           // booking = db.QuerySingle("", BookingRequestID);
        }
        if (customer != null && provider != null && booking != null)
        {
            // Create message subject and message body based on detailed booking data
            string subject = "", message = "";

            int threadID = CreateThread(CustomerUserID, ProviderUserID, PositionID, subject, 4, message, BookingRequestID, "BookingRequest");

            WebMail.Send(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
        }
    }
    public static void SendBookingRequestConfirmation(int BookingRequestID, int BookingID, bool sentByProvider)
    {
        dynamic customer = null, provider = null, booking = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThreadByAux, BookingRequestID, "BookingRequest");
            if (thread != null)
            {
                // Get Customer information
                customer = db.QuerySingle(sqlGetUserData, thread.CustomerUserID);
                // Get Provider information
                provider = db.QuerySingle(sqlGetUserData, thread.ProviderUserID);
                // Get Booking Request information
               // booking = db.QuerySingle("", BookingID);
            }
        }
        if (customer != null && provider != null && booking != null)
        {
            // Create message body based on detailed booking data
            string message = "";

            // ThreadStatus=2, responded; MessageType=6-7 Booking Request Confirmation: 6 by customer, 7 by provider
            int messageID = CreateMessage(thread.ThreadID, 2, sentByProvider ? 7 : 6, message, BookingID);

            WebMail.Send(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
        }
    }
    public static void SendBookingRequestDenegation(int BookingRequestID, bool sentByProvider)
    {
        dynamic customer = null, provider = null, booking = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThreadByAux, BookingRequestID, "BookingRequest");
            if (thread != null)
            {
                // Get Customer information
                customer = db.QuerySingle(sqlGetUserData, thread.CustomerUserID);
                // Get Provider information
                provider = db.QuerySingle(sqlGetUserData, thread.ProviderUserID);
                // Get Booking Request information
               // booking = db.QuerySingle("", BookingID);
            }
        }
        if (customer != null && provider != null && booking != null)
        {
            // Create message body based on detailed booking data
            string message = "";

            // ThreadStatus=2, responded; MessageType=13-14 Booking Request denegation: 14 cancelled by customer, 13 declined by provider
            int messageID = CreateMessage(thread.ThreadID, 2, sentByProvider ? 13 : 14, message, BookingRequestID);

            WebMail.Send(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
            }));
        }
    }
    #endregion

    #region Type:Inquiry
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
            int threadID = CreateThread(CustomerUserID, ProviderUserID, PositionID, InquirySubject, 1, InquiryText);

            /* Using static strings for templates:
            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", 
                ApplyInquiryTemplate(TplInquiry,
                new Dictionary<string, object> {
                { "ItsUserName", CommonHelpers.GetUserDisplayName(customer) },
                { "Subject", InquirySubject },
                { "MessageText", InquiryText },
                { "ReplyUrl", UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + threadID.ToString() }
            })); */

            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", threadID }
                ,{ "Kind", 1 } // Customer inquiry (first message)
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", threadID }
                ,{ "Kind", -1 } // Copy to author of Customer inquiry (first message)
                ,{ "RequestKey", SecurityRequestKey }
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
            int messageID = CreateMessage(ThreadID, 2, 3, InquiryAnswer);

            /* Using static strings for templates:
            WebMail.Send(provider.Email, "Loconomics.com: Inquiry",
                ApplyInquiryTemplate(TplInquiryAnswer,
                new Dictionary<string, object> {
                { "ItsUserName", CommonHelpers.GetUserDisplayName(provider) },
                { "Subject", thread.Subject },
                { "MessageText", InquiryAnswer },
                { "ReplyUrl", UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + ThreadID + "_Message-" + messageID.ToString() }
            }));*/

            WebMail.Send(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 2 } // Provider inquiry answer (second message and upper evens)
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", -2 } // Copy to author of Provider inquiry answer (second message and upper evens)
                ,{ "RequestKey", SecurityRequestKey }
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
            int messageID = CreateMessage(ThreadID, 1, 1, InquiryAnswer);

            /* Using static strings for templates:
            WebMail.Send(provider.Email, "Loconomics.com: Inquiry",
                ApplyInquiryTemplate(TplInquiry,
                new Dictionary<string, object> {
                { "ItsUserName", CommonHelpers.GetUserDisplayName(customer) },
                { "Subject", thread.Subject },
                { "MessageText", InquiryAnswer },
                { "ReplyUrl", UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + ThreadID + "_Message-" + messageID.ToString() }
            }));*/

            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 3 } // Customer inquiry answer (third message and upper odds)
                ,{ "RequestKey", SecurityRequestKey }
            }));
            WebMail.Send(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", -3 } // Copy to author of Customer inquiry answer (third message and upper odds)
                ,{ "RequestKey", SecurityRequestKey }
            }));
        }
    }
    #endregion

    #region Template System
    private static string ApplyTemplate(string tplUrl, Dictionary<string, object> data)
    {
        using (WebClient w = new WebClient())
        {
            foreach (var d in data)
            {
                w.QueryString.Add(d.Key, d.Value.ToString());
            }
            return w.DownloadString(UrlUtil.SiteUrl + tplUrl);
            // Next commented line are test for another tries to get web content processed,
            // can be usefull test if someone have best performance than others, when need.
            //HttpContext.Current.Response.Output = null;
            //var o = new System.IO.StringWriter();
            //var r = new System.Web.Hosting.SimpleWorkerRequest(tplUrl, "", o);
        }
    }
    private static readonly string SecurityRequestKey = "abcd3";
    public static void SecureTemplate()
    {
        if (!HttpContext.Current.Request.IsLocal ||
            HttpContext.Current.Request["RequestKey"] != SecurityRequestKey)
            throw new HttpException(403, "Forbidden");
    }
    private static string ApplyInquiryTemplate(string tpl, Dictionary<string, object> data)
    {
        return String.Format(TplLayout, String.Format(tpl,
            data["ItsUserName"], data["Subject"], data["MessageText"],
            data["ReplyUrl"]));
    }
    #endregion

    #region Specific Message Templates
    private static readonly string TplLayout = @"
        <html><head><style type='text/css'>
            body {{
                font-size: 13px;
            }}
            .respond a {{
                background: none repeat scroll 0 0 #8B2143 !important;
                border-radius: 20px 20px 20px 20px;
                color: White;
                font-size: 1em;
                padding: 0 1em;
                text-transform: lowercase;
                display: inline-block;
            }}
        </style></head><body>{0}</body></html>
    ";
    private static readonly string TplInquiry = @"
        <h1>Customer Inquiry</h1>
        <p><strong>Customer: </strong>{0}</p>
        <p><strong>Subject: </strong>{1}</p>
        <p><strong>Inquiry: </strong>{2}</p>
        <p class='respond'><a href='{3}'>Respond to this inquiry at loconomics.com</a></p>
    ";
    private static readonly string TplInquiryAnswer = @"
        <h1>Provider answer to your inquiry</h1>
        <p><strong>Provider: </strong>{0}</p>
        <p><strong>Subject: </strong>{1}</p>
        <p><strong>Answer: </strong>{2}</p>
        <p class='respond'><a href='{3}'>Reply again at loconomics.com</a></p>
    ";
    #endregion
}