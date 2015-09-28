using CalendarDll.Data;
using DDay.iCal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CalendarDll
{
   

    public enum AvailabilityTypes
    {
        UNAVAILABLE = 0,
        FREE = 1,
        BUSY = 2,
        TENTATIVE = 3,
        TRANSPARENT = 4
    }

    public class CalendarUser
    {
        public int Id { get; set; }
        public TimeSpan BetweenTime { set; get; }
        public TimeSpan AdvanceTime { set; get; }
        public users UserInfo { set; get; }
        public TimeZoneInfo DefaultTimeZone { set; get; }
        public CalendarUser(int id)
        {
            var db = new loconomicsEntities();
            var UserInfo = db.users.FirstOrDefault(u => u.UserID == id);

            if (UserInfo != null && UserInfo.CalendarProviderAttributes != null)
            {
                Id = UserInfo.UserID;
                AdvanceTime = TimeSpan.FromHours((double)UserInfo.CalendarProviderAttributes.AdvanceTime);
                BetweenTime = TimeSpan.FromHours((double)UserInfo.CalendarProviderAttributes.BetweenTime);
            }

        }
    }

    public class DataContainer
    {
        public IList<Occurrence> Ocurrences { set; get; }
        public TimeSpan TimeBlock { get; set; }
        public DateTime DT { get; set; }
        public TimeSpan AddBusyTime { get; set; }
    }

    public partial class ProviderAvailabilityResult
    {
        public string EventSummary { get; set; }
        public DateTime DateSet { get; set; }
        public int DayOfWeek { get; set; }
        public TimeSpan TimeBlock { get; set; }
        public DateTime DT { get; set; }
        public int CalendarAvailabilityTypeID { get; set; }
    }

    public class ProviderAvailability
    {

        public iEvent eventSource { set; get; }
        public ProviderAvailabilityResult result { get; set; }
        public IList<Occurrence> ocurrences { get; set; }
        private Occurrence ocurrence { set; get; }
        public ProviderAvailability(DataContainer obj)
        {
            var dateref = new DateTime(obj.DT.Year, obj.DT.Month, obj.DT.Day, 0, 0, 0);
            ocurrences = obj.Ocurrences;

            if (ocurrences.Count > 1)
            {

                var unavOc = ocurrences.FirstOrDefault(oc => ((iEvent)oc.Source).AvailabilityID == (Int32)AvailabilityTypes.UNAVAILABLE); //unavailable
                var freeOc = ocurrences.FirstOrDefault(oc => ((iEvent)oc.Source).AvailabilityID == (Int32)AvailabilityTypes.FREE); //free
                var busyOc = ocurrences.FirstOrDefault(oc => ((iEvent)oc.Source).AvailabilityID == (Int32)AvailabilityTypes.BUSY); //busy
                var tentOc = ocurrences.FirstOrDefault(oc => ((iEvent)oc.Source).AvailabilityID == (Int32)AvailabilityTypes.TENTATIVE); //tentative
                //var tranOc = ocurrences.FirstOrDefault(oc => ((iEvent)oc.Source).AvailabilityID == (Int32)AvailabilityTypes.TRANSPARENT); //Transparent

                /*
                 take the occurrences in order of status, on top always, busy occurrence
                 */
                /* IagoSRL@2015-09-28:
                 * 
                 * - removed transparent from computation, is a bugfix because transparent
                 * just means 'does not affects availability', so must not be taked into consideration, not overlapping
                 * 'free' as was happen. Minor performance benefit removing that
                 * 
                 * - changed next lines order and added 'else if', performance benefit since now small priority statuses
                 * will not being analized when a higher is found (this happens per each slot, and there are a lot)
                 * */

                if (busyOc.Source != null) ocurrence = busyOc;
                else if (unavOc.Source != null) ocurrence = unavOc;
                else if (tentOc.Source != null) ocurrence = tentOc;
                else if (freeOc.Source != null) ocurrence = freeOc;

                //if (tranOc.Source != null) ocurrence = tranOc;
            }
            else ocurrence = ocurrences.FirstOrDefault();


            result = new ProviderAvailabilityResult()
            {

                TimeBlock = obj.TimeBlock,
                DateSet = dateref,
                DT = obj.DT,
                DayOfWeek = (int)dateref.DayOfWeek
            };

            if (ocurrence.Source != null)
            {
                eventSource = ocurrence.Source as iEvent;
                result.CalendarAvailabilityTypeID = (int)eventSource.AvailabilityID;
                result.EventSummary = eventSource.Summary;
            }
            else
            {
                result.CalendarAvailabilityTypeID = 0;
            }
        }
    }

    public class iEvent : Event
    {
        public int AvailabilityID { set; get; }
        public int EventType { set; get; }
    }
}
