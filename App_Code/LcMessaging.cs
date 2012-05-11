using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;
using ASP;

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
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
             VALUES
                   (@0, @1, @2,
                    1, -- Status is 1 ever at first message (not responded)
                    getdate(), getdate(), 'sys')
        SELECT @@Identity As MessagingThreadID
    ";
    private static readonly string sqlInsMessage = @"
        INSERT INTO [Messages]
                   (ThreadID
                   ,MessageTypeID
                   ,BodyText
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
            VALUES (@0, @1, @2, getdate(), getdate(), 'sys')
        SELECT @@Identity As MessageID
    ";
    private static readonly string sqlGetThread = @"
        SELECT CustomerUserID, ProviderUserID, PositionID, MessageThreadStatusID
        FROM    MessagingThreads
        WHERE   MessagingThreadID = @0
    ";
    private static readonly string sqlGetUserData = @"
        SELECT  U.FirstName, U.LastName, U.UserID, P.Email
        FROM Users As U
              INNER JOIN
             UserProfile As P
               ON U.UserID = P.UserID
        WHERE   U.UserID = @0
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
    public static int CreateThread(int CustomerUserID, int ProviderUserID, int PositionID, int FirstMessageTypeID, string FirstMessageBody)
    {
        int threadID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            threadID = (int)db.QueryValue(sqlInsThread, CustomerUserID, ProviderUserID, PositionID);
            db.Execute(sqlInsMessage, threadID, FirstMessageTypeID, FirstMessageBody);
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
    public static int CreateMessage(int ThreadID, int MessageTypeID, string MessageBody)
    {
        int messageID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            messageID = (int)db.QueryValue(sqlInsMessage, ThreadID, MessageTypeID, MessageBody);
        }
        return messageID;
    }
    #endregion

    #region Main
    public static void SendCustomerInquiry(int CustomerUserID, int ProviderUserID, int PositionID, string InquiryText)
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
            int threadID = CreateThread(CustomerUserID, ProviderUserID, PositionID, 1, InquiryText);

            // HTMLizing a bit the InquiryText
            InquiryText = new HtmlString(InquiryText).ToHtmlString().Replace("\n", "<br/>");

            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", String.Format(TplLayout, String.Format(TplInquiry,
                CommonHelpers.GetUserDisplayName(customer), InquiryText,
                UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + threadID.ToString())));
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
            int messageID = CreateMessage(ThreadID, 3, InquiryAnswer);

            // HTMLizing a bit the InquiryText
            InquiryAnswer = new HtmlString(InquiryAnswer).ToHtmlString().Replace("\n", "<br/>");

            WebMail.Send(customer.Email, "Loconomics.com: Inquiry", String.Format(TplLayout, String.Format(TplInquiryAnswer,
                CommonHelpers.GetUserDisplayName(provider), InquiryAnswer,
                UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + ThreadID + "_Message-" + messageID.ToString())));
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
            int threadID = CreateMessage(ThreadID, 3, InquiryAnswer);

            // HTMLizing a bit the InquiryText
            InquiryAnswer = new HtmlString(InquiryAnswer).ToHtmlString().Replace("\n", "<br/>");

            WebMail.Send(provider.Email, "Loconomics.com: Inquiry", String.Format(TplLayout, String.Format(TplInquiry,
                CommonHelpers.GetUserDisplayName(customer), InquiryAnswer,
                UrlUtil.LangUrl + "Dashboard/Mailbox/#!Thread-" + threadID)));
        }
    }
    #endregion

    #region Specific Message Templates
    private static readonly string TplLayout = @"
        <html><head><style type='text/css'>
            .respond a {{
                background: none repeat scroll 0 0 #8B2143 !important;
                border-radius: 20px 20px 20px 20px;
                color: White;
                font-size: 1em;
                padding: 0 1em;
                text-transform: lowercase;
            }}
        </style></head><body>{0}</body></html>
    ";
    private static readonly string TplInquiry = @"
        <h1>Customer Inquiry</h1>
        <p><strong>Customer: </strong>{0}</p>
        <p><strong>Inquiry: </strong>{1}</p>
        <p class='respond'><a href='{2}'>Respond to this inquiry at loconomics.com</a></p>
    ";
    private static readonly string TplInquiryAnswer = @"
        <h1>Provider answer to your inquiry</h1>
        <p><strong>Provider: </strong>{0}</p>
        <p><strong>Answer: </strong>{1}</p>
        <p class='respond'><a href='{2}'>Reply again at loconomics.com</a></p>
    ";
    #endregion
}