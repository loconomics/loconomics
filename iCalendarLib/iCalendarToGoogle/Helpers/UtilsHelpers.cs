using CalendarDll.Data;
using DDay.iCal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace iCalendarToGoogle.Helpers
{
    public static class UtilsHelpers
    {
       

        public static dynamic GetDaysOfWeek(int? day)
        {
            var values = from DayOfWeek d in Enum.GetValues(typeof(DayOfWeek)) select new { Id = (Int32)d, Day = d.ToString() };
            return new SelectList(values, "Id", "Day", day);
        }

        public static dynamic GetDaysOfWeek()
        {
            var values = from DayOfWeek d in Enum.GetValues(typeof(DayOfWeek)) 
                         select new { Id = (Int32)d, Day = d.ToString() };
            return new SelectList(values, "Id", "Day");
        }

        public static dynamic GetFrequencies(int? frequency)
        {
            var values = from FrequencyType f in Enum.GetValues(typeof(FrequencyType))
                         select new { Id = (Int32)f, Frequency = f.ToString() };
            return new SelectList(values, "Id", "Frequency", frequency);
        }

        public static dynamic GetFrequencies(){
            var values = from FrequencyType f in Enum.GetValues(typeof(FrequencyType)) 
                         select new{ Id =(Int32)f, Frequency = f.ToString() };
            return new SelectList(values, "Id", "Frequency");
        }

        
    }
}