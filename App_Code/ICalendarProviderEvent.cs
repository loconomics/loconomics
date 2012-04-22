using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Mail;

namespace LcCommonLib
{
    public enum CalSpecSupportType
    {
        VCAL,
        ICAL
    }

    public interface ICalendarProviderEvent
    {
        string MailHost { get; }
        CalSpecSupportType MailFormat { get; }
        string bodyText { get; set; }
        string bodyHTML { get; set; }
        string calDateFormat { get; set; }
        string bodyCalendar { get; set; }
        EventNotificationDTO EventDetail { get; set; }
        void CreateCalendarEvent(EventNotificationDTO EventDetail);        
    }

    
}
