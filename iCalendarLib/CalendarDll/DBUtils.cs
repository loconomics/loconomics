using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DDay.iCal;
using DDay.Collections;
using antlr;
using DDay.iCal.Serialization;
using System.Resources;
using System.Threading;
using System.Globalization;

namespace CalendarDll.Data
{
    public static class Utils
    {

        #region Declarations


        //public static CalendarUser User { set; get; }
        //public static loconomicsEntities DataContext { get { return db; } }


        #endregion

        #region Constructor


        ///// <summary>
        ///// Constructor
        ///// </summary>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //static Utils()
        //{
        //    db = new loconomicsEntities();
        //    iCalc = new iCalendar() { Version = "2.0" };
        //}



        #endregion

        #region Get Free Events



        ////----------------------------------------------------------------------
        //// CA2S RM. TEST
        //// This is for Testing Purposes - 
        //// to see if Static Methods are persisting, 
        //// which may not be desirable 
        //// 
        //// (Note: It would seem they are persisting, 
        //// each iCOUNTER from different web brosers opened
        //// has the next value: 1, 2, 3, ...)
        ////----------------------------------------------------------------------

        //static int iCOUNTER;

        ////----------------------------------------------------------------------



        ///// <summary>
        ///// Get Free Events
        ///// </summary>
        ///// <param name="startDate"></param>
        ///// <param name="endDate"></param>
        ///// <param name="currentDateForAdvanceTime">Currend Date-Time for Calculating Advance Time.
        ///// We consider the time BEFORE this parameter + Advance Time as unavailable.
        ///// For two reasons: It is in the past, or we have to wait for the Advance Time to pass</param>
        ///// <returns>2012/11 by CA2S FA</returns>
        //public static List<ProviderAvailabilityResult> GetFreeEvents(
        //    DateTime startDate,
        //    DateTime endDate,
        //    DateTime currentDateTimeForAdvanceTime) // currentDateTime is to add the Advance Time to
        //{

        //    ////----------------------------------------------------------------------
        //    //// CA2S RM. TEST
        //    //// This is for Testing Purposes - 
        //    //// to see if Static Methods are persisting, 
        //    //// which may not be desirable 
        //    //// 
        //    //// (Note: It would seem they are persisting, 
        //    //// each iCOUNTER from different web brosers opened
        //    //// has the next value: 1, 2, 3, ...)
        //    ////----------------------------------------------------------------------


        //    //iCOUNTER += 1; 


        //    //----------------------------------------------------------------------
        //    // Time Slices Size (in Minutes)
        //    // That can be Free or Busy
        //    //----------------------------------------------------------------------


        //    const int TIME_SLICE_SIZE = 15; // in Minutes


        //    //----------------------------------------------------------------------
        //    // For purposes of showing all the Time Slices of a day
        //    // we start on 0:00 AM and we end x minutes before the end of the day
        //    // (x minutes is the size of each Time Slice - see TIME_SLICE_SIZE above)
        //    //
        //    // What we do to get the endDate is 
        //    // Add a Day and then Subtract the Time Slice size
        //    //----------------------------------------------------------------------

        //    // Takes out the Time component,
        //    // So that it starts at 00:00:00 
        //    DateTime startDateTime =
        //        new DateTime( startDate.Year, startDate.Month, startDate.Day);


        //    // To get to the Start of the last Time Slice of the day
        //    // First, it goes to the Next Day ( .AddDays(1) )
        //    // and then reverses by the size of the Time Slice
        //    // ( .AddMinutes(-TIME_SLICE_SIZE) )
        //    // We want to stop short of the TIME_SLICE_SIZE 
        //    // as this is the last iteration for all the Timeslices in the Date Rante
            
        //    DateTime endDateTime =
        //        new DateTime( 
        //            endDate.Year, endDate.Month, endDate.Day).
        //            AddDays(1).AddMinutes(-TIME_SLICE_SIZE);

        //    //// Old code: Time Slice was hard coded at 15 minutes
        //    //var endDate   = new DateTime(end.Year, end.Month, end.Day, 23, 45, 0);

        //    //----------------------------------------------------------------------
        //    // The Providers (Users) have an Advance Time.
        //    //
        //    // They aren't available for Jobs before that.
        //    // We calculate this non-available time from the Current Time on.
        //    //----------------------------------------------------------------------


        //    DateTime advanceTime = currentDateTimeForAdvanceTime + User.AdvanceTime; 

        //    //// Old code: didn't use a currentDateTimeForAdvanceTime parameter
        //    //// so, the Advance Time started ALLWAYS from 00:00 of the Start Date
        //    //// and I think it should start from the current Time...
        //    //DateTime advanceTime = startDate + User.AdvanceTime;


        //    //----------------------------------------------------------------------


        //    var ldates = new List<DataContainer>();
        //    var refDate = startDateTime;
        //    var stamp = new TimeSpan(0, 0, 0);
        //    var ocurrences = new List<ProviderAvailability>();


        //    //----------------------------------------------------------------------
        //    // Loop to generate all the Time Slices
        //    // for the Date Range
        //    //----------------------------------------------------------------------

        //    while (refDate < endDateTime)
        //    {
        //        DateTime newdate = refDate.AddMinutes(TIME_SLICE_SIZE);

        //        ldates.Add(

        //        //User.AdvanceTime > stamp ?
        //        (newdate <= advanceTime) ?

        //            new DataContainer() // Not Available because of Advance Time
        //            {
        //                Ocurrences = new List<Occurrence>(),
        //                TimeBlock = stamp,
        //                DT = refDate,
        //                AddBusyTime = new TimeSpan()
        //            } :

        //            new DataContainer() // Timeslices after Advance Time
        //            {
        //                Ocurrences = iCalc.GetOccurrences(refDate, newdate),
        //                TimeBlock = stamp,
        //                DT = refDate,
        //                AddBusyTime = User.BetweenTime
        //            });


        //        refDate = newdate;


        //        //----------------------------------------------------------------------
        //        // If we are getting to the Last Time Slice of the Day
        //        // (24:00:00 minus the Time Slice size)
        //        // then we start anew from 00:00:00
        //        //----------------------------------------------------------------------

        //        stamp =
        //            (stamp == new TimeSpan(24, 0, 0).Subtract(new TimeSpan(0, TIME_SLICE_SIZE, 0))) ?
        //                stamp = new TimeSpan() :                         // Starting anew from 00:00:00 
        //                stamp.Add(new TimeSpan(0, TIME_SLICE_SIZE, 0));  // Continue with next Time Slice


        //        //// Old code: Time Slice was hard coded at 15 minutes
        //        //stamp = 
        //        //    (stamp == new TimeSpan(23, 45, 0)) ? 
        //        //        stamp = new TimeSpan() : 
        //        //        stamp.Add(new TimeSpan(0, 15, 0));

        //    }

        //    ocurrences =
        //        ldates.Select(
        //            dts => new ProviderAvailability(dts)).ToList();


        //    //var dates = db.GetProviderAvailabilityFullSet(141, start, end);
        //    /*
        //     * another fields inside of "ProviderAvailability" type might be important to take relevant information
        //     * it includes the event related to ocurrence
        //     * and ocurrences if exist in given time lapse
        //     * 
        //     * in order to access to these files, this function should return "ocurrences" variable and should be  process it in a loop (foreach ex)
        //     */

        //    return ocurrences.
        //                Select(av => av.result).ToList();
        //}


        #endregion

        #region Get the Calendar filled with the Events for the User


        ///// <summary>
        ///// Get the Calendar filled with the Events for the User
        ///// </summary>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //public static iCalendar GetCalendar()
        //{
        //    //cass:generate event from db data

        //    iCalc.Events.Clear();

        //    if (User != null)
        //    {
        //        foreach (var even in GetEventsByUserId(User.Id))
        //        {
        //            iCalc.Events.Add(even);
        //        }
        //    }

        //    return iCalc;
        //}


        //public static iCalendar GetCalendar(DateTime startDate, DateTime endDate)
        //{
        //    //cass:generate event from db data

        //    iCalc.Events.Clear();

        //    if (User != null)
        //    {
        //        foreach (var even in GetEventsByUserId(User.Id, startDate, endDate))
        //        {
        //            iCalc.Events.Add(even);
        //        }
        //    }

        //    return iCalc;
        //}


        ///// <summary>
        ///// 
        ///// </summary>
        ///// <returns></returns>
        //public static iCalendar GetCalendarForExport()
        //{
        //    iCalendar iCalForExport = GetCalendar();

        //    iCalForExport.Events.Clear();

        //    if (User != null)
        //    {
        //        foreach (var currEvent in GetEventsByUserId(User.Id))
        //        {
        //            // Only add Events that have an UID with a "*" in front
        //            if (currEvent.UID.Length > 0 && currEvent.UID.Substring(0, 1) == "*")
        //            {
        //                iCalc.Events.Add(currEvent);
        //            }
        //        }

        //    }

        //    return iCalForExport;
        //}

        #endregion

        #region Prepare Data for Export

        ///// <summary>
        ///// Prepare Data for Export
        ///// </summary>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //public static Tuple<byte[], string> PrepareExportData()
        //{
        //    //iCalc = GetCalendar();

        //    iCalendar iCalForExport = GetCalendarForExport();

        //    //var ctx = new SerializationContext();
        //    //var factory = new DDay.iCal.Serialization.iCalendar.SerializerFactory();
        //    //// Get a serializer for our object
        //    //var serializer = factory.Build(iCalc.GetType(), ctx) as IStringSerializer;

        //    //var output = serializer.SerializeToString(iCalc);
        //    //var contentType = "text/calendar";
        //    //var bytes = Encoding.UTF8.GetBytes(output);

        //    var ctx = new SerializationContext();
        //    var factory = new DDay.iCal.Serialization.iCalendar.SerializerFactory();

        //    // Get a serializer for our object
        //    var serializer =
        //        factory.Build(
        //            iCalForExport.GetType(),
        //            ctx) as IStringSerializer;

        //    var output = serializer.SerializeToString(iCalForExport);

        //    var contentType = "text/calendar";

        //    var bytes = Encoding.UTF8.GetBytes(output);

        //    return new Tuple<byte[], string>(bytes, contentType);

        //}

        #endregion

        #region Import Calendar



        ///// <summary>
        ///// Import Calendar
        ///// </summary>
        ///// <param name="calendar"></param>
        ///// <param name="IdUser"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //public static bool ImportCalendar(
        //    IICalendarCollection calendar,
        //    Int32 IdUser)
        //{
        //    try
        //    {

        //        var eventListForDB = new List<CalendarEvents>();


        //        //----------------------------------------------------------------------
        //        // Loop that adds the Imported Events to a List of CalendarEvents 
        //        // which are compatible in their fields with the Loconomics database
        //        //----------------------------------------------------------------------

        //        foreach (Event currEvent in calendar.FirstOrDefault().Events.Where(_ => (Int32)_.Status != 2 && !_.UID.StartsWith("*")))
        //        {
        //            /*Event types*/
        //            /*
        //             * 1	booking - GENERATES BETWEEN TIME
        //             * 2	work hours
        //             * 3	availibility events
        //             * 4	imported
        //             * 5	other
        //             */

        //            CalendarEvents eventForDB = new CalendarEvents()
        //            {
        //                CreatedDate = DateTime.Now,
        //                //UID = "*"+ev.UID, // CA2S RM: Imported Events don't add the "*" so we can discriminate between Imported and Native
        //                UID = currEvent.UID,
        //                UserId = IdUser,
        //                StartTime = currEvent.Start.Date.Year != 1 ? currEvent.Start.Date.Add(currEvent.Start.TimeOfDay) : DateTime.Now,
        //                EndTime = currEvent.End.Date.Year != 1 ? currEvent.End.Date.Add(currEvent.End.TimeOfDay) : DateTime.Now,
        //                Organizer = currEvent.Organizer.CommonName,
        //                CalendarAvailabilityTypeID = getAvailabilityId((int)currEvent.Status),
        //                Transparency = getTransparency((int)currEvent.Status),
        //                //Summary = ev.Status.ToString(), // CA2S RM: Leave the original Summary text
        //                Summary = currEvent.Summary,
        //                EventType = 4,
        //                IsAllDay = false,
        //            };

        //            eventListForDB.Add(eventForDB);
        //        }


        //        //----------------------------------------------------------------------
        //        // Saves the Events to the Database
        //        //----------------------------------------------------------------------


        //        db = new loconomicsEntities();

        //        foreach (var currEventForDB in eventListForDB)
        //        {
        //            db.CalendarEvents.Add(currEventForDB);
        //        }

        //        db.SaveChanges();


        //        //----------------------------------------------------------------------
        //        // Gets the Updated Calendar for Future Uses
        //        //----------------------------------------------------------------------

        //        iCalc = GetCalendar();

        //        //----------------------------------------------------------------------
        //        // Reports Import was successful
        //        //----------------------------------------------------------------------

        //        return true;

        //    }
        //    catch
        //    {
        //        return false;
        //    }

        //}




        #endregion

        #region Create Event


        ///// <summary>
        ///// Create Event 
        ///// 
        ///// In iCal format, from the Loconomics DB
        ///// </summary>
        ///// <param name="eventFromDB"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static iEvent CreateEvent(
        //    CalendarEvents eventFromDB)
        //{

        //    iEvent iCalEvent = new iEvent()
        //    {
        //        Summary = eventFromDB.Summary ?? null,
        //        Start = new iCalDateTime((DateTime)eventFromDB.StartTime),
        //        Duration = (eventFromDB.EndTime - eventFromDB.StartTime),
        //        Location = eventFromDB.Location ?? null,
        //        AvailabilityID = eventFromDB.CalendarAvailabilityTypeID,
        //        EventType = eventFromDB.EventType,
        //        IsAllDay = eventFromDB.IsAllDay,
        //        Status = GetEventStatus(eventFromDB.CalendarAvailabilityTypeID),
        //        Priority = eventFromDB.Priority ?? 0,
        //        UID = (string.IsNullOrEmpty(eventFromDB.UID)) ? "*" + Guid.NewGuid().ToString() : eventFromDB.UID,
        //        Class = eventFromDB.Class,
        //        Organizer = eventFromDB.Organizer != null ? new Organizer(eventFromDB.Organizer) : null,
        //        Transparency = (TransparencyType)(eventFromDB.Transparency ? 1 : 0),
        //        Created = new iCalDateTime((DateTime)(eventFromDB.CreatedDate ?? DateTime.Now)),
        //        DTEnd = new iCalDateTime((DateTime)eventFromDB.EndTime),
        //        DTStamp = new iCalDateTime((DateTime)(eventFromDB.StampTime ?? DateTime.Now)),
        //        DTStart = new iCalDateTime((DateTime)eventFromDB.StartTime),
        //        LastModified = new iCalDateTime((DateTime)(eventFromDB.UpdatedDate ?? DateTime.Now)),
        //        Sequence = eventFromDB.Sequence ?? 0,
        //        RecurrenceID = eventFromDB.RecurrenceId != null ? new iCalDateTime((DateTime)eventFromDB.RecurrenceId) : null,
        //        GeographicLocation = eventFromDB.Geo != null ? new GeographicLocation(eventFromDB.Geo) : null/*"+-####;+-####"*/,
        //        Description = eventFromDB.Description ?? null
        //    };


        //    //----------------------------------------------------------------------
        //    // Additional Processing
        //    //----------------------------------------------------------------------


        //    FillExceptionsDates(iCalEvent, eventFromDB);
        //    FillRecurrencesDates(iCalEvent, eventFromDB);
        //    FillContacts(iCalEvent, eventFromDB);
        //    FillAttendees(iCalEvent, eventFromDB);
        //    FillComments(iCalEvent, eventFromDB);
        //    FillRecurrences(iCalEvent, eventFromDB);


        //    //----------------------------------------------------------------------

        //    return iCalEvent;
        //}


        #endregion

        #region Create Between Events


        ///// <summary>
        ///// Create Between Events
        ///// 
        ///// It takes the Original iCal Event
        ///// and creates another iCal Event 
        ///// following the original, 
        ///// and with the duration of the Between Event of the User
        ///// </summary>
        ///// <param name="originalICalEvent"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static iEvent CreateBetweenEvent(iEvent originalICalEvent)
        //{
        //    //CultureInfo.CreateSpecificCulture("es-ES");
        //    var resources = new ResourceManager(typeof(CalendarDll.Resources));
        //    iEvent events = new iEvent()
        //    {

        //        Summary = resources.GetString("BetweenTime", Thread.CurrentThread.CurrentCulture),// "Between Time",
        //        UID = "*" + Guid.NewGuid().ToString(),
        //        Start = originalICalEvent.DTEnd,
        //        Duration = User.BetweenTime,
        //        AvailabilityID = originalICalEvent.AvailabilityID,
        //        Status = originalICalEvent.Status,
        //        Priority = originalICalEvent.Priority,
        //        Description = originalICalEvent.Description,
        //        Organizer = originalICalEvent.Organizer,
        //        Transparency = originalICalEvent.Transparency,
        //        Created = originalICalEvent.Created,
        //        DTEnd = originalICalEvent.DTEnd.Add(User.BetweenTime),
        //        DTStamp = originalICalEvent.DTEnd,
        //        DTStart = originalICalEvent.DTEnd,
        //        Sequence = originalICalEvent.Sequence,
        //        RecurrenceID = originalICalEvent.RecurrenceID,
        //        //RecurrenceRules = evt.RecurrenceRules,

        //    };

        //    //----------------------------------------------------------------------
        //    // If there are Recurrence Rules in the Original
        //    // add them to the "Between Event" too
        //    //----------------------------------------------------------------------

        //    events.RecurrenceRules.AddRange(originalICalEvent.RecurrenceRules);

        //    //----------------------------------------------------------------------

        //    return events;
        //}


        #endregion

        #region Get Event Status


        ///// <summary>
        ///// Get Event Status
        ///// </summary>
        ///// <param name="statusID"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static EventStatus GetEventStatus(int statusID)
        //{

        //    //TODO
        //    /*
        //        Tentative = 0,
        //        Confirmed = 1,
        //        Cancelled = 2,
        //     */
        //    //cancelled excluded

        //    if (statusID == 3) return EventStatus.Tentative;
        //    else if (statusID == 1 || statusID == 4) return EventStatus.Confirmed;
        //    else if (statusID == 2 || statusID == 0) return EventStatus.Confirmed;

        //    return EventStatus.Confirmed;

        //}

        #endregion

        #region Get Transparency


        ///// <summary>
        ///// Get Transparency
        ///// </summary>
        ///// <param name="eventStatus"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static bool getTransparency(int eventStatus)
        //{
        //    if (eventStatus == 0) return true;
        //    return false;
        //}


        #endregion

        #region Get Availability Id


        ///// <summary>
        ///// Get Availability Id
        ///// </summary>
        ///// <param name="eventStatus"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static int getAvailabilityId(int eventStatus)
        //{

        //    if (eventStatus == 0) return 4;
        //    return 2;

        //}


        #endregion

        #region Get Events by User Id


        ///// <summary>
        ///// Get Events by User Id
        ///// </summary>
        ///// <param name="UserId"></param>
        ///// <returns></returns>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static IEnumerable<iEvent> GetEventsByUserId(Int32 UserId)
        //{
        //    var listEventsFromDB =
        //        db.CalendarEvents.Where(c => c.UserId == UserId).ToList();

        //    var iCalEvents = new List<iEvent>();

        //    foreach (var currEventFromDB in listEventsFromDB)
        //    {
        //        var iCalEvent = CreateEvent(currEventFromDB);

        //        iCalEvents.Add(iCalEvent);

        //        //----------------------------------------------------------------------
        //        // If the Event is a Busy Event
        //        // that is Work of a Provider,
        //        // it adds a "Between Time" or buffer time
        //        // so that the next Job is not completely next in the Calendar.
        //        //
        //        // This is to give some preparation or transportation time
        //        // between Jobs to the Provider
        //        //----------------------------------------------------------------------

        //        //----------------------------------------------------------------------
        //        // Event types
        //        //----------------------------------------------------------------------
        //        //
        //        // 1	booking - GENERATES BETWEEN TIME
        //        // 2	work hours
        //        // 3	availibility events
        //        // 4	imported
        //        // 5	other
        //        //
        //        //----------------------------------------------------------------------


        //        if (iCalEvent.EventType == 1)
        //        {
        //            var evExt = CreateBetweenEvent(iCalEvent);
        //            iCalEvents.Add(evExt);
        //        }

        //        //var newEv = CreateEvent(c);
        //        //yield return newEv;

        //        //----------------------------------------------------------------------

        //    }
        //    return iCalEvents;
        //}

        ///// <summary>
        ///// Get Events By User Id
        ///// (overloads another version without Dates parameters)
        ///// 
        ///// And also by Range of Dates
        ///// Note: Because recurrence events are more complicated,
        ///// they are recovered regardless of dates
        ///// </summary>
        ///// <param name="UserId"></param>
        ///// <param name="StartEvaluationDate"></param>
        ///// <param name="EndEvaluationDate"></param>
        ///// <returns></returns>
        ///// <remarks>2012/12 by CA2S FA</remarks>
        //private static IEnumerable<iEvent> GetEventsByUserId(
        //    Int32 UserId, 
        //    DateTime StartEvaluationDate, 
        //    DateTime EndEvaluationDate)
        //{

        //    // Recovers Events 
        //    // for a particular User
        //    // and a particular Date Range
        //    // OR, if they are Recurrence, any Date Range
        //    var listEventsFromDB =
        //        db.CalendarEvents.Where(
        //            c => c.UserId == UserId && 
        //            ((c.EndTime <= EndEvaluationDate && 
        //            c.StartTime >=StartEvaluationDate) || 
        //                c.CalendarReccurrence.Any())).ToList();

        //    var iCalEvents = new List<iEvent>();

        //    foreach (var currEventFromDB in listEventsFromDB)
        //    {
        //        var iCalEvent = CreateEvent(currEventFromDB);

        //        iCalEvents.Add(iCalEvent);

        //        //----------------------------------------------------------------------
        //        // If the Event is a Busy Event
        //        // that is Work of a Provider,
        //        // it adds a "Between Time" or buffer time
        //        // so that the next Job is not completely next in the Calendar.
        //        //
        //        // This is to give some preparation or transportation time
        //        // between Jobs to the Provider
        //        //----------------------------------------------------------------------

        //        //----------------------------------------------------------------------
        //        // Event types
        //        //----------------------------------------------------------------------
        //        //
        //        // 1	booking - GENERATES BETWEEN TIME
        //        // 2	work hours
        //        // 3	availibility events
        //        // 4	imported
        //        // 5	other
        //        //
        //        //----------------------------------------------------------------------

        //        if (iCalEvent.EventType == 1)
        //        {
        //            var evExt = CreateBetweenEvent(iCalEvent);
        //            iCalEvents.Add(evExt);
        //        }

        //        //var newEv = CreateEvent(c);
        //        //yield return newEv;

        //        //----------------------------------------------------------------------

        //    }

        //    return iCalEvents;


        //}



        #endregion

        #region Fill Recurrence Dates



        ///// <summary>
        ///// Fill Recurrence Dates
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static void FillRecurrencesDates(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{
        //    var rdates = eventFromDB.CalendarEventRecurrencesPeriodList;
        //    if (!rdates.Any()) return;

        //    var periodsList = new List<PeriodList>();

        //    foreach (var prd in rdates)
        //    {
        //        var period = new PeriodList();

        //        foreach (var dates in prd.CalendarEventRecurrencesPeriod)
        //        {
        //            period.Add(
        //                new Period(
        //                    new iCalDateTime(dates.DateStart),
        //                    new iCalDateTime(dates.DateEnd)));
        //        }

        //        iCalEvent.RecurrenceDates.Add(period);
        //    }
        //}



        #endregion

        #region Fill Exceptions Dates



        ///// <summary>
        ///// Fill Exceptions Dates
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        //private static void FillExceptionsDates(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{
        //    var edates = eventFromDB.CalendarEventExceptionsPeriodsList;
        //    if (!edates.Any()) return;

        //    var periodsList = new List<PeriodList>();

        //    foreach (var prd in edates)
        //    {
        //        var period = new PeriodList();
        //        foreach (var dates in prd.CalendarEventExceptionsPeriod)
        //        {
        //            period.Add(
        //                new Period(
        //                    new iCalDateTime(dates.DateStart),
        //                    new iCalDateTime(dates.DateEnd)));
        //        }
        //        iCalEvent.ExceptionDates.Add(period);
        //    }
        //}


        #endregion

        #region Fill Contacts


        ///// <summary>
        ///// Fill Contacts
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static void FillContacts(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{

        //    if (eventFromDB.CalendarEventsContacts.Any())
        //        iCalEvent.Contacts.AddRange(
        //            eventFromDB.CalendarEventsContacts.Select(
        //                ct => ct.Contact));

        //}


        #endregion

        #region Fill Comments


        ///// <summary>
        ///// Fill Comments
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static void FillComments(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{
        //    if (eventFromDB.CalendarEventComments.Any())
        //        iCalEvent.Comments.AddRange(
        //            eventFromDB.CalendarEventComments.Select(
        //                cmts => cmts.Comment));
        //}


        #endregion

        #region Fill Attendees


        ///// <summary>
        ///// Fill Attendees
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        ///// <remarks></remarks>
        //private static void FillAttendees(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{
        //    //cass attendee[0] type: 'MAILTO:myid@mymaildomain.com'
        //    //cass attendee[1] type: 'John Doe'
        //    //cass attemdee[2] type: 'Admin, Administrator'
        //    if (!eventFromDB.CalendarEventsAttendees.Any()) return;

        //    foreach (var att in eventFromDB.CalendarEventsAttendees.Select(ats => ats.Attendee))
        //    {
        //        var res = att.Split(';');
        //        switch (res.Count())
        //        {
        //            case 2:
        //                iCalEvent.Attendees.Add(new Attendee(res[0]) { CommonName = res[1] });
        //                break;
        //            case 3:
        //                iCalEvent.Attendees.Add(new Attendee(res[0]) { CommonName = res[1], Role = res[2] });
        //                break;
        //            default:
        //                iCalEvent.Attendees.Add(new Attendee(res[0]));
        //                break;
        //        }
        //    }
        //}


        #endregion

        #region Fill Recurrences



        ///// <summary>
        ///// Fill Recurrences
        ///// </summary>
        ///// <param name="iCalEvent"></param>
        ///// <param name="eventFromDB"></param>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static void FillRecurrences(
        //    Event iCalEvent,
        //    CalendarEvents eventFromDB)
        //{

        //    var recur = eventFromDB.CalendarReccurrence;
        //    if (!recur.Any()) return;

        //    foreach (var rec in recur)
        //    {
        //        var recPattern = new RecurrencePattern();

        //        recPattern.Frequency = (FrequencyType)rec.Frequency;
        //        if (rec.Count != null) recPattern.Count = (Int32)rec.Count;
        //        if (rec.Until != null) recPattern.Until = (DateTime)rec.Until;
        //        if (rec.Interval != null) recPattern.Interval = (Int32)rec.Interval;
        //        SetFrecuencies(rec, recPattern);

        //        iCalEvent.RecurrenceRules.Add(recPattern);
        //    }



        //}

        #endregion

        #region Set Frecuencies - for Recurrences


        ///// <summary>
        ///// Set Frecuencies - for Recurrences
        ///// </summary>
        ///// <param name="rec"></param>
        ///// <param name="recPattern"></param>
        ///// <remarks>2012/11 by CA2S FA</remarks>
        //private static void SetFrecuencies(
        //    CalendarReccurrence rec,
        //    RecurrencePattern recPattern)
        //{

        //    var frec = rec.CalendarReccurrenceFrequency.ToList();

        //    foreach (var fr in frec)
        //    {
        //        if (fr.ByDay ?? false)
        //        {
        //            //var frecDay = fr.FrequencyDay??-2147483648;
        //            recPattern.ByDay.Add(new WeekDay((DayOfWeek)fr.DayOfWeek, (FrequencyOccurrence)(fr.FrequencyDay ?? -2147483648)));
        //        }
        //        else if (fr.ByHour ?? false)
        //        {
        //            recPattern.ByHour.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.ByMinute ?? false)
        //        {
        //            recPattern.ByMinute.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.ByMonth ?? false)
        //        {
        //            recPattern.ByMonth.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.ByMonthDay ?? false)
        //        {
        //            recPattern.ByMonthDay.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.BySecond ?? false)
        //        {
        //            recPattern.BySecond.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.BySetPosition ?? false)
        //        {
        //            recPattern.BySetPosition.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.ByWeekNo ?? false)
        //        {
        //            recPattern.ByWeekNo.Add(fr.ExtraValue ?? 0);
        //        }
        //        else if (fr.ByYearDay ?? false)
        //        {
        //            recPattern.ByYearDay.Add(fr.ExtraValue ?? 0);
        //        }
        //    }
        //}

        #endregion

        #region Private Declarations


        //private static iCalendar iCalc;
        //private static loconomicsEntities db;


        #endregion

    }

    
}
