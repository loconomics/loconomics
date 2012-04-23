using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net.Mail;
using System.Net.Mime;
using System.Globalization;

namespace LcCommonLib
{
    /// <summary>
    /// Summary description for MailHelper
   /// 
    /// Remember Localization for Dates -- come back to this
    /// </summary>
    public class MailHelper
    {
        /// <summary>
        /// Actual method that executes sending of the mail message. SMTP configuration is stored in the 
        /// Web.config the configuration was matched tot that found in the root "_AppStart.cshtml" which makes
        /// use of the Webmatrix WebMAIL class, however, this class does not accept a MailMessage type
        /// needed to send the meeting invite, so the standard "System.Net.Mail" namespace is used here
        /// instead.
        /// </summary>
        /// <param name="Message"></param>
        public static void SendMailMessage(MailMessage Message)
        {
            //can't use WebMAIL class since it doesn't take a mail message type
            System.Net.Mail.SmtpClient MailClient  = new SmtpClient();
            MailClient.Send(Message);            
        }


        /// <summary>
        /// this creates the meeting invite sent out after the provider clicks on one of the three acknowledgement links 
        /// in the initial email. This provides additional detail and the ability to block the time off in the providers
        /// calendar
        /// </summary>
        /// <param name="AckResponse"></param>
        /// <param name="template"></param>
        /// <returns></returns>
        public static MailMessage CreateServiceMeetingRequest(AckDTOResponse AckResponse, MailMessageTemplate template)
        {
            MailMessage msg = null;
            template.Greeting = string.Format(CustomStringWriter.Provider_Email_Greeting, AckResponse.ProviderName);

            template.AddBodyText(string.Format(CustomStringWriter.Ack_Invite_Detail_Line1, AckResponse.CustomerName));
            template.AddBodyText(string.Format(CustomStringWriter.Ack_Invite_Detail_Line2, AckResponse.CustomerEmail));
            template.AddBodyText(string.Format(CustomStringWriter.Ack_Invite_Detail_Line3, AckResponse.ServiceStartDate.ToString("F", new CultureInfo(AckResponse.CultureString))));
            template.AddBodyText(string.Format(CustomStringWriter.Ack_Invite_Detail_Line4, AckResponse.ServiceDuration.ToString())); 
            template.AddBodyText(CustomStringWriter.Ack_Invite_Detail_Line5);
            template.AddBodyText(AckResponse.JobDetails);

            //Create the MailMessage Instance
            msg = new MailMessage( template.From
                                 , AckResponse.ProviderEmail
                                 , template.Subject
                                 , template.BodyText);

            EventNotificationDTO EventDetail = new EventNotificationDTO(AckResponse);
            EventDetail.Subject = msg.Subject;
            EventDetail.Summary = msg.Body;
            EventDetail.FromEmail = CustomStringWriter.Provider_Email_From;
            EventDetail.FromName = CustomStringWriter.Provider_Email_From_Discription;
            EventDetail.organizerName = CustomStringWriter.Provider_Email_Organizer;

            //return the populated MailMessage Object as updated by CreateMeetingRequest        
            //CalendarEventFactory will instantiate the appropriate provider type: e.g. gmail, hotmail, Outlook, yahoo, etc.
            return CreateMeetingRequest(CalendarProviderEventFactory.Create(EventDetail.ProviderEmail, EventDetail)); 
        }


        /// <summary>
        /// Creates a ServiceRequest MailMessage, this is the initial email sent to a provider, containing
        /// four email links, three date times links, and one cancel link
        /// </summary>
        /// <param name="svcResponse"></param>
        /// <param name="template"></param>
        /// <returns></returns>
        public static MailMessage CreateServiceRequestNotification(ServiceResponseDTO svcResponse, ref MailMessageTemplate template)
        {
            MailMessage msg = null;         
                        
            string SrId  = string.Empty;
            string WfId = string.Empty;
            string Url = string.Empty;
            string StartDate = string.Empty;

            template.Greeting = string.Format(CustomStringWriter.Provider_Email_Greeting, svcResponse.ProviderName);
                      
            SrId = svcResponse.ServiceRequestID.ToString();
            WfId = svcResponse.WorkflowId;
            StartDate = svcResponse.SrDateTime.ToString("F", new CultureInfo(svcResponse.CultureString));

            string UrlFormat = CustomStringWriter.schedulemanager_acceptLink;

            //Create 1st link 
            Url = string.Format(  UrlFormat
                                , ((int)LcCommonLib.ACKProcessTypeId.Accepted).ToString()
                                , WfId
                                , SrId);
            template.AddLink(Url, string.Format(CustomStringWriter.Primary_Link_Text, StartDate), "Accept" );

            //Create 2nd link 
            StartDate = svcResponse.SrAlt1DateTime.ToString("F", new CultureInfo(svcResponse.CultureString)); 
            SrId = svcResponse.Alternate1SrID.ToString();            
            Url = string.Format(  UrlFormat
                                , ((int)LcCommonLib.ACKProcessTypeId.Accepted).ToString()
                                , WfId
                                , SrId);
            template.AddLink(Url, string.Format(CustomStringWriter.Alternate1_Link_Text, StartDate), "Accept");
            
            //Create 3rd link 
            StartDate = svcResponse.SrAlt2DateTime.ToString("F", new CultureInfo(svcResponse.CultureString)); 
            SrId = svcResponse.Alternate2SrID.ToString();
            Url = string.Format(UrlFormat
                                , ((int)LcCommonLib.ACKProcessTypeId.Accepted).ToString()
                                , WfId
                                , SrId);
            template.AddLink(Url, string.Format(CustomStringWriter.Alternate2_Link_Text, StartDate), "Accept");
            
            //Create 4th link for cancel
            SrId = svcResponse.ServiceRequestID.ToString();

            Url = string.Format( CustomStringWriter.schedulemanager_cancelLink
                                , ((int)LcCommonLib.ACKProcessTypeId.Canceled).ToString()
                                , WfId);
            template.AddLink(Url, CustomStringWriter.Cancel_Link_Text, "Cancel");

           
            //Create the MailMessage Instance
            //msg = new MailMessage( template.From
            //                     , svcResponse.ProviderEMail
            //                     , template.Subject
            //                     , template.Body);

            MailAddress From = new MailAddress(template.From, template.FromDescription);
            MailAddress To = new MailAddress(svcResponse.ProviderEMail);
            msg = new MailMessage(From, To);
            msg.Subject = template.Subject;

            //note:
            //If we keep another flag in the DB for provider - Receive Email type PlainText|HTML
            //we can use HTML email body
            if (svcResponse.PrefersHTMLEmail)
            {
                msg.IsBodyHtml = true;
                msg.Body = template.BodyHTML;
            }
            else
            {
                msg.IsBodyHtml = false;
                msg.Body = template.BodyText;

            }
            //System.Net.Mime.ContentType HTMLType = new System.Net.Mime.ContentType("text/html");
            //AlternateView htmlView = AlternateView.CreateAlternateViewFromString(template.BodyHTML, HTMLType);
            //msg.AlternateViews.Add(htmlView);
            
            

            return msg; //return the populated MailMessage Object
        }

        
        /// <summary>
        /// helper method that creates an initial MailMessageTemmplate for meeting invites
        /// </summary>
        /// <returns></returns>
        public static MailMessageTemplate DefaultInviteTemplate()
        {
            MailMessageTemplate mmt = new MailMessageTemplate();
            mmt.From = CustomStringWriter.Provider_Email_From;
            mmt.FromDescription = CustomStringWriter.Provider_Email_From_Discription;
            mmt.Subject = CustomStringWriter.Provider_Email_Subject;
            mmt.AddHeader(CustomStringWriter.Provider_Email_Header_line1);
            mmt.AddHeader(CustomStringWriter.Provider_Email_Header_line2);
            mmt.AddFooter(CustomStringWriter.Provider_Email_Footer_Line1);
            mmt.AddFooter(CustomStringWriter.Provider_Email_Footer_Line2);
            mmt.AddFooter(CustomStringWriter.Loconomics_Trademark);
            return mmt;
        }


        /// <summary>
        /// helper method that creates an initial MailMessageTemmplate for notification emails
        /// </summary>
        /// <returns></returns>
        public static MailMessageTemplate DefaultEmailTemplate()
        {
            MailMessageTemplate mmt = new MailMessageTemplate();
            mmt.From = CustomStringWriter.Provider_Email_From;
            mmt.FromDescription = CustomStringWriter.Provider_Email_From_Discription;
            mmt.Subject = CustomStringWriter.Provider_Email_Subject;
            mmt.AddHeader(CustomStringWriter.Provider_Email_Header_line1);
            mmt.AddHeader(CustomStringWriter.Provider_Email_Header_line2);
            mmt.AddFooter(CustomStringWriter.Provider_Email_Footer_Line1);
            mmt.AddFooter(CustomStringWriter.Provider_Email_Footer_Line2);
            mmt.AddFooter(CustomStringWriter.Loconomics_Trademark);
            return mmt;
        }

        /// <summary>
        /// Simple method overload that provides a single destination email address encapsulated in the EventNotificationDTO within the CalendarEvent
        /// </summary>
        /// <param name="CalendarEvent"></param>
        /// <returns></returns>
        public static MailMessage CreateMeetingRequest(ICalendarProviderEvent CalendarEvent)
        {
            EventNotificationDTO EventDetail = CalendarEvent.EventDetail;
            MailAddress From = new MailAddress(EventDetail.FromEmail, EventDetail.FromName);

            MailAddressCollection AdxCollection = new MailAddressCollection();
            AdxCollection.Add(new MailAddress(EventDetail.ProviderEmail, EventDetail.ProviderName));

            return CreateMeetingRequest(From, EventDetail.Subject, CalendarEvent, AdxCollection);
        }

        /// <summary>
        /// Complex method overload that provides future flexibility
        /// </summary>
        /// <param name="OrganizerEmail"></param>
        /// <param name="MeetingSubject"></param>
        /// <param name="CalendarEvent"></param>
        /// <param name="attendeeList"></param>
        /// <returns></returns>
        public static MailMessage CreateMeetingRequest(MailAddress OrganizerEmail, string MeetingSubject, ICalendarProviderEvent CalendarEvent, MailAddressCollection attendeeList)
        {
            MailMessage msg = new MailMessage();

            System.Net.Mime.ContentType calendarType = new System.Net.Mime.ContentType("text/calendar");
           
            //  Add parameters to the calendar header
            calendarType.Parameters.Add("method", "REQUEST");
            calendarType.Parameters.Add("name", string.Format("Job#{0}.ics", CalendarEvent.EventDetail.SrId));

            AlternateView calendarView = AlternateView.CreateAlternateViewFromString(CalendarEvent.bodyCalendar, calendarType);
           
            //Check for VCAL and set transfer encoding if necessary
            if (CalendarEvent.MailFormat == CalSpecSupportType.VCAL)
                calendarView.TransferEncoding = TransferEncoding.SevenBit;

            msg.AlternateViews.Add(calendarView);
           
            AlternateView HTMLView = AlternateView.CreateAlternateViewFromString(CalendarEvent.bodyHTML, new ContentType("text/html"));
            msg.AlternateViews.Add(HTMLView);

            //AlternateView textView = AlternateView.CreateAlternateViewFromString(CalendarEvent.bodyText, textType);
            //msg.AlternateViews.Add(textView);           

            //  Adress the message
            msg.From = OrganizerEmail;
            foreach (MailAddress attendee in attendeeList)
            {
                msg.To.Add(attendee);
            }
            msg.Subject = MeetingSubject;

            return msg;
        }
    }


    /*
 
    /// <summary>
        /// Helper method that creates the ICAL Meeting invite
        /// Source -- http://weblogs.asp.net/bradvincent/archive/2008/01/16/creating-vcalendars-programmatically.aspx
        /// Last viewed (02/21/2012)
        /// 
        /// related keeper "http://www.codeproject.com/Articles/3634/NET-class-to-create-and-maintain-vCalendar-inform"
        /// </summary>
        /// <param name="start"></param>
        /// <param name="end"></param>
        /// <param name="subject"></param>
        /// <param name="summary"></param>
        /// <param name="location"></param>
        /// <param name="organizerName"></param>
        /// <param name="organizerEmail"></param>
        /// <param name="attendeeName"></param>
        /// <param name="attendeeEmail"></param>
        /// <returns></returns>
        //public static MailMessage CreateMeetingRequest(DateTime start, DateTime end, string subject, string summary,
        //string location, string organizerName, string organizerEmail, string attendeeName, string attendeeEmail)
        //{
        //    MailAddressCollection col = new MailAddressCollection();
        //    col.Add(new MailAddress(attendeeEmail, attendeeName));
        //    return CreateMeetingRequest(start, end, subject, summary, location, organizerName, organizerEmail, col);
        //}
     
     
      public static MailMessage CreateMeetingRequest(DateTime start, DateTime end, string subject, string summary,
            string location, string organizerName, string organizerEmail, MailAddressCollection attendeeList)
        {
            MailMessage msg = new MailMessage();

            //  Set up the different mime types contained in the message
            System.Net.Mime.ContentType textType = new System.Net.Mime.ContentType("text/plain");
            System.Net.Mime.ContentType HTMLType = new System.Net.Mime.ContentType("text/html");
            System.Net.Mime.ContentType calendarType = new System.Net.Mime.ContentType("text/calendar");

            //  Add parameters to the calendar header
            calendarType.Parameters.Add("method", "REQUEST");
            calendarType.Parameters.Add("name", "meeting.ics");

            //  Create message body parts
            //  create the Body in text format
            string bodyText = "Type:Single Meeting\r\nOrganizer: {0}\r\nStart Time:{1}\r\nEnd Time:{2}\r\nTime Zone:{3}\r\nLocation: {4}\r\n\r\n*~*~*~*~*~*~*~*~*~*\r\n\r\n{5}";
            bodyText = string.Format(bodyText,
                organizerName,
                start.ToLongDateString() + " " + start.ToLongTimeString(),
                end.ToLongDateString() + " " + end.ToLongTimeString(),
                System.TimeZone.CurrentTimeZone.StandardName,
                location,
                summary);

            AlternateView textView = AlternateView.CreateAlternateViewFromString(bodyText, textType);
            msg.AlternateViews.Add(textView);

            //create the Body in HTML format
            string bodyHTML = "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 3.2//EN\">\r\n<HTML>\r\n<HEAD>\r\n<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=utf-8\">\r\n<META NAME=\"Generator\" CONTENT=\"MS Exchange Server version 6.5.7652.24\">\r\n<TITLE>{0}</TITLE>\r\n</HEAD>\r\n<BODY>\r\n<!-- Converted from text/plain format -->\r\n<P><FONT SIZE=2>Type:Single Meeting<BR>\r\nOrganizer:{1}<BR>\r\nStart Time:{2}<BR>\r\nEnd Time:{3}<BR>\r\nTime Zone:{4}<BR>\r\nLocation:{5}<BR>\r\n<BR>\r\n*~*~*~*~*~*~*~*~*~*<BR>\r\n<BR>\r\n{6}<BR>\r\n</FONT>\r\n</P>\r\n\r\n</BODY>\r\n</HTML>";
            bodyHTML = string.Format(bodyHTML,
                summary,
                organizerName,
                start.ToLongDateString() + " " + start.ToLongTimeString(),
                end.ToLongDateString() + " " + end.ToLongTimeString(),
                System.TimeZone.CurrentTimeZone.StandardName,
                location,
                summary);

            AlternateView HTMLView = AlternateView.CreateAlternateViewFromString(bodyHTML, HTMLType);
            msg.AlternateViews.Add(HTMLView);

            //create the Body in VCALENDAR format
            string calDateFormat = "yyyyMMddTHHmmssZ";
            string bodyCalendar = "BEGIN:VCALENDAR\r\nMETHOD:REQUEST\r\nPRODID:Microsoft CDO for Microsoft Exchange\r\nVERSION:2.0\r\nBEGIN:VTIMEZONE\r\nTZID:(GMT-06.00) Central Time (US & Canada)\r\nX-MICROSOFT-CDO-TZID:11\r\nBEGIN:STANDARD\r\nDTSTART:16010101T020000\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0600\r\nRRULE:FREQ=YEARLY;WKST=MO;INTERVAL=1;BYMONTH=11;BYDAY=1SU\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:16010101T020000\r\nTZOFFSETFROM:-0600\r\nTZOFFSETTO:-0500\r\nRRULE:FREQ=YEARLY;WKST=MO;INTERVAL=1;BYMONTH=3;BYDAY=2SU\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nDTSTAMP:{8}\r\nDTSTART:{0}\r\nSUMMARY:{7}\r\nUID:{5}\r\nATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=\"{9}\":MAILTO:{9}\r\nACTION;RSVP=TRUE;CN=\"{4}\":MAILTO:{4}\r\nORGANIZER;CN=\"{3}\":mailto:{4}\r\nLOCATION:{2}\r\nDTEND:{1}\r\nDESCRIPTION:{7}\\N\r\nSEQUENCE:1\r\nPRIORITY:5\r\nCLASS:\r\nCREATED:{8}\r\nLAST-MODIFIED:{8}\r\nSTATUS:CONFIRMED\r\nTRANSP:OPAQUE\r\nX-MICROSOFT-CDO-BUSYSTATUS:BUSY\r\nX-MICROSOFT-CDO-INSTTYPE:0\r\nX-MICROSOFT-CDO-INTENDEDSTATUS:BUSY\r\nX-MICROSOFT-CDO-ALLDAYEVENT:FALSE\r\nX-MICROSOFT-CDO-IMPORTANCE:1\r\nX-MICROSOFT-CDO-OWNERAPPTID:-1\r\nX-MICROSOFT-CDO-ATTENDEE-CRITICAL-CHANGE:{8}\r\nX-MICROSOFT-CDO-OWNER-CRITICAL-CHANGE:{8}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:REMINDER\r\nTRIGGER;RELATED=START:-PT00H15M00S\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
            bodyCalendar = string.Format(bodyCalendar,
                start.ToUniversalTime().ToString(calDateFormat),
                end.ToUniversalTime().ToString(calDateFormat),
                location,
                organizerName,
                organizerEmail,
                Guid.NewGuid().ToString("B"),
                summary,
                subject,
                DateTime.Now.ToUniversalTime().ToString(calDateFormat),
                attendeeList.ToString());

            AlternateView calendarView = AlternateView.CreateAlternateViewFromString(bodyCalendar, calendarType);
            calendarView.TransferEncoding = TransferEncoding.SevenBit;
            msg.AlternateViews.Add(calendarView);

            //  Adress the message
            msg.From = new MailAddress(organizerEmail);
            foreach (MailAddress attendee in attendeeList)
            {
                msg.To.Add(attendee);
            }
            msg.Subject = subject;

            return msg;
        }
     
    public static class CalendarAppointmentService
    {>
         public static void CreateiCalAppointment(string toEmail,
              string attendeeName,
              string subject,
              string emailBody,
              string loc,
              string sum,
              DateTime startDate,
              DateTime endDate,
              string iCalFilePath)
         {
              const string c_strTimeFormat = "yyyyMMdd\\THHmmss\\Z";
              string strStartTime = "";
              string strEndTime = "";
              string strTimeStamp = "";
              string strTempStartTime = "";
              string strTempEndTime = "";
              string vCalendarFile = "";
              string location = loc;
              string summary = sum;

     * 
     * 
     * 
     * 
     * 
     * 
    const string VCAL_FILE =
         "BEGIN:VCALENDAR\n" +
         "VERSION:1.0\n" +
         "BEGIN:VEVENT\n" +
         "DTSTART{0}\n" +
         "DTEND{1}\n" +
         "LOCATION;ENCODING=QUOTED-PRINTABLE:{2}\n" +
         "DESCRIPTION;ENCODING=QUOTED-PRINTABLE:{3}\n" +
         "SUMMARY;ENCODING=QUOTED-PRINTABLE:{4}\n" +
         "TRIGGER:-PT15M\n" +
         "PRIORITY:3\n" +
         "END:VEVENT\n" +
         "END:VCALENDAR";
    DateTime dtmStartDate = DateTime.Parse(startDate.ToString("d"));
    DateTime dtmStartTime = DateTime.Parse(startDate.ToString("d") + " " + startDate.TimeOfDay.ToString());
    DateTime dtmEndTime = DateTime.Parse(startDate.ToString("d") + " " + endDate.TimeOfDay.ToString());
    strTempStartTime = string.Format("{0} {1}", dtmStartDate.ToShortDateString(), dtmStartTime.ToLongTimeString());
    strTempEndTime = string.Format("{0} {1}", dtmStartDate.ToShortDateString(), dtmEndTime.ToLongTimeString());
    strTimeStamp = (DateTime.Parse(strTempStartTime)).ToUniversalTime().ToString(c_strTimeFormat);
    strStartTime = string.Format(":{0}", strTimeStamp);
    strEndTime = string.Format(":{0}", (DateTime.Parse(strTempEndTime)).ToUniversalTime().ToString(c_strTimeFormat));
    vCalendarFile =
         String.Format(VCAL_FILE,
              strStartTime,
              strEndTime,
              location,
              summary,
              subject,
              strTimeStamp,
              toEmail.Trim(),
              toEmail.Trim(),
              attendeeName.Trim(),
              toEmail.Trim(),
              toEmail.Trim());

    */


    /*

    public void ProcessRequest(HttpContext ctx)
      {
       DateTime startDate = DateTime.Now.AddDays(5);
       DateTime endDate = startDate.AddMinutes(35);
       string organizer = "foo@bar.com";
       string location = "My House";
       string summary = "My Event";
       string description = "Please come to\\nMy House";
   
       ctx.Response.ContentType="text/calendar";
       ctx.Response.AddHeader("Content-disposition", "attachment; filename=appointment.ics");
   
       ctx.Response.Write("BEGIN:VCALENDAR");
       ctx.Response.Write("\nVERSION:2.0");
       ctx.Response.Write("\nMETHOD:PUBLISH");
       ctx.Response.Write("\nBEGIN:VEVENT");
       ctx.Response.Write("\nORGANIZER:MAILTO:" + organizer);
       ctx.Response.Write("\nDTSTART:" + startDate.ToUniversalTime().ToString(DateFormat));
       ctx.Response.Write("\nDTEND:" + endDate.ToUniversalTime().ToString(DateFormat));
       ctx.Response.Write("\nLOCATION:" + location);
       ctx.Response.Write("\nUID:" + DateTime.Now.ToUniversalTime().ToString(DateFormat) + "@mysite.com");
       ctx.Response.Write("\nDTSTAMP:" + DateTime.Now.ToUniversalTime().ToString(DateFormat));
       ctx.Response.Write("\nSUMMARY:" + summary);
       ctx.Response.Write("\nDESCRIPTION:" + description);
       ctx.Response.Write("\nPRIORITY:5");
       ctx.Response.Write("\nCLASS:PUBLIC");
       ctx.Response.Write("\nEND:VEVENT");
       ctx.Response.Write("\nEND:VCALENDAR");
       ctx.Response.End();
      }
     }
    }
    */
}