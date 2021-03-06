//------------------------------------------------------------------------------
// <auto-generated>
//    Este código se generó a partir de una plantilla.
//
//    Los cambios manuales en este archivo pueden causar un comportamiento inesperado de la aplicación.
//    Los cambios manuales en este archivo se sobrescribirán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------

namespace CalendarDll.Data
{
    using System;
    using System.Collections.Generic;
    
    public partial class CalendarEvents
    {
        public CalendarEvents()
        {
            this.CalendarEventComments = new HashSet<CalendarEventComments>();
            this.CalendarEventExceptionsPeriodsList = new HashSet<CalendarEventExceptionsPeriodsList>();
            this.CalendarEventRecurrencesPeriodList = new HashSet<CalendarEventRecurrencesPeriodList>();
            this.CalendarEventsAttendees = new HashSet<CalendarEventsAttendees>();
            this.CalendarEventsContacts = new HashSet<CalendarEventsContacts>();
            this.CalendarReccurrence = new HashSet<CalendarReccurrence>();
        }
    
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Summary { get; set; }
        public string UID { get; set; }
        public int CalendarAvailabilityTypeID { get; set; }
        public bool Transparency { get; set; }
        public System.DateTimeOffset StartTime { get; set; }
        public System.DateTimeOffset EndTime { get; set; }
        public bool IsAllDay { get; set; }
        public Nullable<System.DateTimeOffset> StampTime { get; set; }
        public string TimeZone { get; set; }
        public Nullable<int> Priority { get; set; }
        public string Location { get; set; }
        public Nullable<System.DateTimeOffset> UpdatedDate { get; set; }
        public Nullable<System.DateTimeOffset> CreatedDate { get; set; }
        public string ModifyBy { get; set; }
        public string Class { get; set; }
        public string Organizer { get; set; }
        public Nullable<int> Sequence { get; set; }
        public string Geo { get; set; }
        public Nullable<System.DateTimeOffset> RecurrenceId { get; set; }
        public Nullable<System.TimeSpan> TimeBlock { get; set; }
        public Nullable<int> DayofWeek { get; set; }
        public string Description { get; set; }
        public int EventType { get; set; }
        public DateTimeOffset? Deleted { get; set; }
    
        public virtual CalendarAvailabilityType CalendarAvailabilityType { get; set; }
        public virtual ICollection<CalendarEventComments> CalendarEventComments { get; set; }
        public virtual ICollection<CalendarEventExceptionsPeriodsList> CalendarEventExceptionsPeriodsList { get; set; }
        public virtual ICollection<CalendarEventRecurrencesPeriodList> CalendarEventRecurrencesPeriodList { get; set; }
        public virtual users users { get; set; }
        public virtual ICollection<CalendarEventsAttendees> CalendarEventsAttendees { get; set; }
        public virtual ICollection<CalendarEventsContacts> CalendarEventsContacts { get; set; }
        public virtual ICollection<CalendarReccurrence> CalendarReccurrence { get; set; }
        public virtual CalendarEventType CalendarEventType { get; set; }
    }
}
