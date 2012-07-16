﻿using System;
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
            int messageID = (int)db.QueryValue(sqlInsMessage, threadID, FirstMessageTypeID, FirstMessageBody, (FirstMessageAuxID == -1 ? null : (object)FirstMessageAuxID), FirstMessageAuxT);
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
    public static int CreateMessage(int ThreadID, int MessageThreadStatusID, int MessageTypeID, string MessageBody, int MessageAuxID = -1, string MessageAuxT = null, string NewThreadSubject = null)
    {
        int messageID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            // Create Message
            messageID = (int)db.QueryValue(sqlInsMessage, ThreadID, MessageTypeID, MessageBody, (MessageAuxID == -1 ? null : (object)MessageAuxID), MessageAuxT);
            // Update Thread status (and date automatically)
            db.Execute(sqlUpdThread, ThreadID, MessageThreadStatusID, messageID, NewThreadSubject);
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
            // Create message subject and message body based on detailed booking data
            string subject = BookingHelper.GetBookingRequestSubject(BookingRequestID);
            string message = BookingHelper.GetBookingRequestDetails(BookingRequestID);

            int threadID = CreateThread(CustomerUserID, ProviderUserID, PositionID, subject, 4, message, BookingRequestID, "BookingRequest");

            SendMail(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
        }
    }
    public static void SendBookingRequestConfirmation(int BookingRequestID, int BookingID, bool sentByProvider)
    {
        dynamic customer = null, provider = null, thread = null;
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
            }
        }
        if (customer != null && provider != null)
        {
            // Create message body based on detailed booking data
            string subject = BookingHelper.GetBookingSubject(BookingID);
            string message = BookingHelper.GetBookingRequestDetails(BookingRequestID);

            // ThreadStatus=2, responded; MessageType=6-7 Booking Request Confirmation: 6 by customer, 7 by provider
            int messageID = CreateMessage(thread.ThreadID, 2, sentByProvider ? 7 : 6, message, BookingID, "Booking", subject);

            SendMail(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
        }
    }
    public static void SendBookingRequestDenegation(int BookingRequestID, bool sentByProvider)
    {
        dynamic customer = null, provider = null, thread = null;
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
            }
        }
        if (customer != null && provider != null)
        {
            // Create message body based on detailed booking data
            string message = BookingHelper.GetBookingRequestDetails(BookingRequestID);

            // ThreadStatus=2, responded; MessageType=13-14 Booking Request denegation: 14 cancelled by customer, 13 declined by provider
            int messageID = CreateMessage(thread.ThreadID, 2, sentByProvider ? 13 : 14, message, BookingRequestID, "BookingRequest");

            SendMail(provider.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Booking Request", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBookingRequest/",
                new Dictionary<string, object> {
                { "BookingRequestID", BookingRequestID }
                ,{ "UserID", thread.CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
        }
    }
    /// <summary>
    /// Send a message notifing of an update in the booking (status mainly, but maybe some data as price change or...),
    /// can be done by (bySystemProviderOrCustomer) a provider 'p', a customer 'c' or a sys-admin 's'
    /// </summary>
    /// <param name="BookingRequestID"></param>
    /// <param name="BookingID"></param>
    /// <param name="bySystemProviderOrCustomer"></param>
    public static void SendBookingUpdate(int BookingID, char bySystemProviderOrCustomer)
    {
        dynamic customer = null, provider = null, thread = null;
        using (var db = Database.Open("sqlloco"))
        {
            // Get Thread info
            thread = db.QuerySingle(sqlGetThreadByAux, BookingID, "Booking");
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
            // Create message body based on detailed booking data
            string subject = BookingHelper.GetBookingSubject(BookingID);
            string message = BookingHelper.GetBookingStatus(BookingID);

            // ThreadStatus=2, responded;
            // MessageType: 'p' provider 15, 'c' customer 16, 's' system 19
            int messageType = bySystemProviderOrCustomer == 'p' ? 15 : bySystemProviderOrCustomer == 'c' ? 16 : 19;
            int messageID = CreateMessage(thread.ThreadID, 2, messageType, message, BookingID, "Booking", subject);

            SendMail(provider.Email, "Loconomics.com: Booking Update", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "UserID", thread.ProviderUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Booking Update", 
                ApplyTemplate(UrlUtil.LangPath + "Booking/EmailBooking/",
                new Dictionary<string, object> {
                { "BookingID", BookingID }
                ,{ "UserID", thread.CustomerUserID }
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
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

            SendMail(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", threadID }
                ,{ "Kind", 1 } // Customer inquiry (first message)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
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
            int messageID = CreateMessage(ThreadID, 2, 3, InquiryAnswer);

            SendMail(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 2 } // Provider inquiry answer (second message and upper evens)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", customer.Email }
            }));
            SendMail(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
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
            int messageID = CreateMessage(ThreadID, 1, 1, InquiryAnswer);

            SendMail(provider.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
                new Dictionary<string, object> {
                { "ThreadID", ThreadID }
                ,{ "MessageID", messageID }
                ,{ "Kind", 3 } // Customer inquiry answer (third message and upper odds)
                ,{ "RequestKey", SecurityRequestKey }
                ,{ "EmailTo", provider.Email }
            }));
            SendMail(customer.Email, "Loconomics.com: Inquiry", 
                ApplyTemplate(UrlUtil.LangPath + "Messaging/EmailInquiry/",
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

    #region Type:Welcome
    public static void SendWelcomeProvider(int providerID, string providerEmail, string confirmationURL)
    {
        SendMail(providerEmail, "Welcome to Loconomics.com",
            ApplyTemplate(UrlUtil.LangPath + "Provider-sign-up/EmailWelcomeProvider/",
            new Dictionary<string,object> {
                { "UserID", providerID },
                { "EmailTo", providerEmail },
                { "ConfirmationURL", HttpUtility.UrlEncode(confirmationURL) }
         }));
    }
    public static void SendWelcomeCustomer(int userID, string userEmail, string confirmationURL, string confirmationToken)
    {
        SendMail(userEmail, "Welcome to Loconomics.com", //"Loconomics.com, please confirm your account",
            ApplyTemplate(UrlUtil.LangPath + "Email/EmailWelcomeCustomer/",
            new Dictionary<string, object> {
                { "UserID", userID },
                { "EmailTo", userEmail },
                { "ConfirmationURL", HttpUtility.UrlEncode(confirmationURL) },
                { "ConfirmationToken", HttpUtility.UrlEncode(confirmationToken) }
        }));
    }
    public static void SendResetPassword(int userID, string userEmail, string resetURL, string resetToken)
    {
        SendMail(userEmail, "Loconomics.com, please reset your password",
            ApplyTemplate(UrlUtil.LangPath + "Email/EmailResetPassword/",
            new Dictionary<string, object> {
                { "UserID", userID },
                { "EmailTo", userEmail },
                { "ResetURL", HttpUtility.UrlEncode(resetURL) },
                { "ResetToken", HttpUtility.UrlEncode(resetToken) }
        }));
    }
    #endregion

    #region Template System
    public static string ApplyTemplate(string tplUrl, Dictionary<string, object> data)
    {
        if (!data.ContainsKey("RequestKey"))
            data["RequestKey"] = SecurityRequestKey;

        using (WebClient w = new WebClient())
        {
            w.Encoding = System.Text.Encoding.UTF8;
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
    #endregion

    #region Send Mail wrapper function
    public static void SendMail(string to, string subject, string body, string from = null)
    {
        WebMail.Send(to, subject, body, from, contentEncoding: "utf-8");
        //ScheduleEmail(TimeSpan.FromMinutes(1), to, subject, body, from);
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
    public static bool ScheduleEmail(TimeSpan delayTime, string emailto, string emailsubject, string emailbody, string from = null)
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

            WebMail.Send(emailto, subject, body, from, contentEncoding: "utf-8");
        }
        catch (Exception ex)
        {
            HttpContext.Current.Trace.Warn("LcMessaging.ScheduleEmail=>CacheItemRemovedCallback Error: " + ex.ToString());
        }
    }
    #endregion
}