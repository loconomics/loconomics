using DDay.iCal;
using DDay.iCal.Serialization;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;

namespace iCalendarToGoogle.Models
{
    public static class Calendar{
        

        static Calendar() {
            var db = new loconomicsDbEntities();

            iCal = new iCalendar()
            {
                Version = "2.0"
            };
            var local = iCal.AddLocalTimeZone();
            
            
            // Create the event    
            var evt = new Event()
            {
                Summary = "Serializar Calendario",
                Start = new iCalDateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day, DateTime.Now.Hour, DateTime.Now.Minute, DateTime.Now.Second).SetTimeZone(local),
                Duration = TimeSpan.FromHours(2),
                Location = "Oficina",
                IsAllDay = true,
                Status = EventStatus.Confirmed,
                Priority = 7,
                UID = Guid.NewGuid().ToString(),
                Organizer = new Organizer("MAILTO:farid.aldana@ca2s.com")//organizer is mandatory for outlook 2007,
                

            };

            //create the alarm
            var alarm = new Alarm
            {
                Duration = new TimeSpan(0, 15, 0),
                Trigger = new Trigger(new TimeSpan(0, 15, 0)),
                Action = AlarmAction.Display,
                Description = "Reminder"
            };

            evt.Alarms.Add(alarm);

            //create the recurrence
            var rp = new RecurrencePattern();
            rp.Frequency = FrequencyType.Monthly;            
            rp.ByDay.Add(new WeekDay(DayOfWeek.Monday, FrequencyOccurrence.First));
            rp.ByDay.Add(new WeekDay(DayOfWeek.Monday, FrequencyOccurrence.SecondToLast));
            evt.RecurrenceRules.Add(rp);

            iCal.Events.Add(evt);

            

        }

        public static iCalendar GetCalendar {
            get { return iCal; }
        }

        private static iCalendar iCal = null;




    }

 

    public class CalendarProviders
    {
        

    }
}