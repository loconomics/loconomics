using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Globalization;

namespace LcCommonLib
{
    public class GoogleCalendarEvent: ICalendarProviderEvent
    {
        private string _mailhost = "gmail.com";
        private CalSpecSupportType _mailformat = CalSpecSupportType.ICAL;

        #region public ICalendarEvent properties
        /// <summary>
        /// used to determine Transfer encoding
        /// </summary>
        public CalSpecSupportType MailFormat
        {
            get { return _mailformat; }
        }

        /// <summary>
        ///Differentiation property and field used by CalendarProviderEventFactory
        ///To determine whether or not to instantiate this "ICalendarProviderEvent" implementation
        /// </summary>
        public string MailHost
        {
            get { return _mailhost; }            
        }
        
        public string bodyText { get; set; }

        public string bodyHTML { get; set; }

        public string calDateFormat { get; set; }

        public string bodyCalendar { get; set; }

        public EventNotificationDTO EventDetail { get; set; }
        #endregion

        /// <summary>
        /// This Creates an ICAL format specifically tailored to "gmail.com"
        /// </summary>
        /// <param name="EventDetail">Contains all relevant EventDetail</param>
        public void CreateCalendarEvent(EventNotificationDTO EventDetail)
        {
            this.EventDetail = EventDetail;
           
            string startdate = EventDetail.ServiceStartDate.ToString("D", CultureInfo.CreateSpecificCulture(EventDetail.CultureString));
            string starttime = EventDetail.ServiceStartDate.ToString("t", CultureInfo.CreateSpecificCulture(EventDetail.CultureString));

            DateTime EndTime = EventDetail.ServiceStartDate.AddMinutes(EventDetail.ServiceDuration);
            string enddate = EndTime.ToString("D", CultureInfo.CreateSpecificCulture(EventDetail.CultureString));
            string endtime = EndTime.ToString("t", CultureInfo.CreateSpecificCulture(EventDetail.CultureString));
            
            string bodyText = "Type:Single Meeting\r\nOrganizer: {0}\r\nStart Time:{1}\r\nEnd Time:{2}\r\nTime Zone:{3}\r\nLocation: {4}\r\n\r\n*~*~*~*~*~*~*~*~*~*\r\n\r\n{5}";
            this.bodyText = string.Format(bodyText
                                        , EventDetail.organizerName
                                        , string.Format("{0} {1}", startdate, starttime)
                                        , string.Format("{0} {1}", enddate, endtime)
                                        , System.TimeZone.CurrentTimeZone.StandardName
                                        , EventDetail.Location
                                        , EventDetail.Summary);

            string bodyHTML = "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 3.2//EN\">\r\n<HTML>\r\n<HEAD>\r\n<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=utf-8\">\r\n<META NAME=\"Generator\" CONTENT=\"MS Exchange Server version 6.5.7652.24\">\r\n<TITLE>{0}</TITLE>\r\n</HEAD>\r\n<BODY>\r\n<!-- Converted from text/plain format -->\r\n<P><FONT SIZE=2>Type:Single Meeting<BR>\r\nOrganizer:{1}<BR>\r\nStart Time:{2}<BR>\r\nEnd Time:{3}<BR>\r\nTime Zone:{4}<BR>\r\nLocation:{5}<BR>\r\n<BR>\r\n*~*~*~*~*~*~*~*~*~*<BR>\r\n<BR>\r\n<BR>\r\n</FONT>\r\n</P>\r\n\r\n</BODY>\r\n</HTML>";
            this.bodyHTML = string.Format(bodyHTML
                                        , EventDetail.organizerName
                                        , string.Format("{0} {1}", startdate, starttime)
                                        , string.Format("{0} {1}", enddate, endtime)
                                        , System.TimeZone.CurrentTimeZone.StandardName
                                        , EventDetail.Location
                                        , EventDetail.Summary);

            string calDateFormat = "yyyyMMddTHHmmssZ";
            //string bodyCalendar = "BEGIN:VCALENDAR\r\nMETHOD:REQUEST\r\nPRODID:Microsoft CDO for Microsoft Exchange\r\nVERSION:2.0\r\nBEGIN:VTIMEZONE\r\nTZID:(GMT-06.00) Central Time (US & Canada)\r\nX-MICROSOFT-CDO-TZID:11\r\nBEGIN:STANDARD\r\nDTSTART:16010101T020000\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0600\r\nRRULE:FREQ=YEARLY;WKST=MO;INTERVAL=1;BYMONTH=11;BYDAY=1SU\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:16010101T020000\r\nTZOFFSETFROM:-0600\r\nTZOFFSETTO:-0500\r\nRRULE:FREQ=YEARLY;WKST=MO;INTERVAL=1;BYMONTH=3;BYDAY=2SU\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nDTSTAMP:{8}\r\nDTSTART:{0}\r\nSUMMARY:{7}\r\nUID:{5}\r\nATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=\"{9}\":MAILTO:{9}\r\nACTION;RSVP=TRUE;CN=\"{4}\":MAILTO:{4}\r\nORGANIZER;CN=\"{3}\":mailto:{4}\r\nLOCATION:{2}\r\nDTEND:{1}\r\nDESCRIPTION:{7}\\N\r\nSEQUENCE:1\r\nPRIORITY:5\r\nCLASS:\r\nCREATED:{8}\r\nLAST-MODIFIED:{8}\r\nSTATUS:CONFIRMED\r\nTRANSP:OPAQUE\r\nX-MICROSOFT-CDO-BUSYSTATUS:BUSY\r\nX-MICROSOFT-CDO-INSTTYPE:0\r\nX-MICROSOFT-CDO-INTENDEDSTATUS:BUSY\r\nX-MICROSOFT-CDO-ALLDAYEVENT:FALSE\r\nX-MICROSOFT-CDO-IMPORTANCE:1\r\nX-MICROSOFT-CDO-OWNERAPPTID:-1\r\nX-MICROSOFT-CDO-ATTENDEE-CRITICAL-CHANGE:{8}\r\nX-MICROSOFT-CDO-OWNER-CRITICAL-CHANGE:{8}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:REMINDER\r\nTRIGGER;RELATED=START:-PT00H15M00S\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
            //this.bodyCalendar = string.Format(bodyCalendar
            //                           , EventDetail.ServiceStartDate.ToUniversalTime().ToString(calDateFormat)
            //                           , EndTime.ToUniversalTime().ToString(calDateFormat)
            //                           , EventDetail.Location
            //                           , EventDetail.organizerName
            //                           , EventDetail.OrganizerEmail
            //                           , Guid.NewGuid().ToString("B")
            //                           , EventDetail.Summary
            //                           , EventDetail.Subject
            //                           , DateTime.Now.ToUniversalTime().ToString(calDateFormat)
            //                           , string.Join(",", EventDetail.DistributionList.ToArray()));

            //should create the following format:
            #region Sample Format
            /*
            BEGIN:VCALENDAR
            PRODID:-//Google Inc//Google Calendar 70.9054//EN
            VERSION:2.0
            CALSCALE:GREGORIAN
            METHOD:REQUEST
            BEGIN:VEVENT
            DTSTART:20120319T180000Z
            DTEND:20120319T190000Z
            DTSTAMP:20120320T140751Z
            UID:c2hbn5fflsjahpth0cehj5shug@google.com
            ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
             TRUE;CN=coelho.patricka@gmail.com;X-NUM-GUESTS=0:mailto:coelho.patricka@gma
             il.com
            CREATED:20120320T140604Z
            DESCRIPTION:
            LAST-MODIFIED:20120320T140604Z
            LOCATION:
            SEQUENCE:0
            STATUS:CONFIRMED
            SUMMARY:test
            TRANSP:OPAQUE
            END:VEVENT
            END:VCALENDAR
            */
            #endregion
            VCalLineWriter cw = new VCalLineWriter();

            cw.WriteLine("BEGIN:VCALENDAR");
            cw.WriteLine("PRODID:-//Google Inc//Google Calendar 70.9054//EN");
            cw.WriteLine("VERSION:2.0");
            cw.WriteLine("CALSCALE:GREGORIAN");
            cw.WriteLine("METHOD:REQUEST");
            cw.WriteLine("BEGIN:VEVENT");
            cw.WriteLine(string.Format("DTSTART:", EventDetail.ServiceStartDate.ToUniversalTime().ToString(calDateFormat)));
            cw.WriteLine(string.Format("DTEND:", EndTime.ToUniversalTime().ToString(calDateFormat)));
            cw.WriteLine(string.Format("DTSTAMP:", DateTime.Now.ToUniversalTime().ToString("yyyyMMddTHHmmssZ")));
            cw.WriteLine(string.Format("UID:{0}@google.com", Guid.NewGuid().ToString("N")));
           
            cw.BufferedWrite("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;");
            cw.BufferedWrite(string.Format("CN={0};", EventDetail.ProviderEmail));
            cw.BufferedWrite(string.Format("X-NUM-GUESTS=0:mailto:{0};", EventDetail.ProviderEmail));
            cw.BufferedWriteEnd(); //write the current buffer to the underlying stringwriter/builder
           
            cw.WriteLine(string.Format("CREATED:", DateTime.Now.ToUniversalTime().ToString("yyyyMMddTHHmmssZ")));
            cw.WriteLine(string.Format("DESCRIPTION:{0}", EventDetail.Subject));
            cw.WriteLine(string.Format("LAST-MODIFIED:", DateTime.Now.ToUniversalTime().ToString("yyyyMMddTHHmmssZ")));
            cw.WriteLine(string.Format("LOCATION:{0}", EventDetail.Location));
            cw.WriteLine("SEQUENCE:0");
            cw.WriteLine("STATUS:CONFIRMED");
            cw.WriteLine(string.Format("SUMMARY:{0}", EventDetail.Summary));
            cw.WriteLine("TRANSP:OPAQUE");
            cw.WriteLine("END:VEVENT");
            cw.WriteLine("END:VCALENDAR");
         
            string CalendarEventBody = cw.ToString();
                                       
         }

       
    }
}
