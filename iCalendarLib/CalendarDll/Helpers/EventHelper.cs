using CalendarDll.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CalendarDll.Helpers
{
    public static class EventHelpers
    {
        private static loconomicsEntities db = new loconomicsEntities();

        public static IQueryable<CalendarEvents> GetEventsByUser(int IdUser)
        {
            return db.CalendarEvents.Include("CalendarAvailabilityType").Include("CalendarEventType").Where(c => c.UserId == IdUser);

        }
    }
}
