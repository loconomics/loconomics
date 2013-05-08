using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

// DDay iCalendar Utilities
using DDay.iCal;
using DDay.Collections;
using DDay.iCal.Serialization;
using CalendarDll.Data;





namespace CalendarDll
{


    /// <summary>
    /// Calendar Utils
    /// </summary>
    /// <remarks>2012/12/11 by CA2S (Static version), 2012/12/21 by RM (Dynamic version)</remarks>
    public class CalendarUtils
    {





        #region iCalendar - Get an Instance


        /// <summary>
        /// Gets an Instance of the iCalendar Library
        /// </summary>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public iCalendar GetICalendarLibraryInstance() 
        {

            const string ICALENDAR_VERSION = "2.0";

            iCalendar newICalendar = 
                new iCalendar() 
                { 
                    Version = ICALENDAR_VERSION 
                };

            return newICalendar;
        
        }


        #endregion



        #region Get Free Events



        /// <summary>
        /// Get Free Events
        /// </summary>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <param name="currentDateForAdvanceTime">Currend Date-Time for Calculating Advance Time.
        /// We consider the time BEFORE this parameter + Advance Time as unavailable.
        /// For two reasons: It is in the past, or we have to wait for the Advance Time to pass</param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public List<ProviderAvailabilityResult> GetFreeEvents(
            CalendarUser user,
            DateTime startDate,
            DateTime endDate,
            DateTime currentDateTimeForAdvanceTime) // currentDateTime is to add the Advance Time to
        {



            //----------------------------------------------------------------------
            // Time Slices Size (in Minutes)
            // That can be Free or Busy
            //----------------------------------------------------------------------


            const int TIME_SLICE_SIZE = 15; // in Minutes


            //----------------------------------------------------------------------
            // For purposes of showing all the Time Slices of a day
            // we start on 0:00 AM and we end x minutes before the end of the day
            // (x minutes is the size of each Time Slice - see TIME_SLICE_SIZE above)
            //
            // What we do to get the endDate is 
            // Add a Day and then Subtract the Time Slice size
            //----------------------------------------------------------------------


            // Takes out the Time component of the Start DateTime,
            // So that it starts at 00:00:00            
            
            
            DateTime startDateTime =
                new DateTime( 
                    startDate.Year, 
                    startDate.Month, 
                    startDate.Day);
            

            // To get to the Start of the last Time Slice of the day
            // First, it goes to the Next Day ( .AddDays(1) )
            // and then reverses by the size of the Time Slice
            // ( .AddMinutes(-TIME_SLICE_SIZE) )
            // We want to stop short of the TIME_SLICE_SIZE 
            // as this is the last iteration for all the Timeslices in the Date Range

            
            DateTime endDateTime =
                new DateTime( 
                    endDate.Year, 
                    endDate.Month, 
                    endDate.Day).
                        AddDays(1).                   // Goes to the Next Day
                        AddMinutes(-TIME_SLICE_SIZE); // Goes back by the Time Slice size

            
            
            //----------------------------------------------------------------------
            // Advance Time
            //
            // The Providers (Users) have an Advance Time.
            // They aren't available for Jobs before that.
            // We calculate this non-available time from the Current Time on.
            //----------------------------------------------------------------------


            DateTime advanceTime = 
                currentDateTimeForAdvanceTime + 
                user.AdvanceTime; 


            //----------------------------------------------------------------------


            List<DataContainer>        ldates     = new List<DataContainer>();
            List<ProviderAvailability> ocurrences = new List<ProviderAvailability>();
            DateTime refDate = startDateTime;
            TimeSpan stamp   = new TimeSpan(0, 0, 0);

            //----------------------------------------------------------------------
            // new iCalendar instance
            // filled with Events
            //----------------------------------------------------------------------


            iCalendar iCal =
                GetICalendarLibraryInstance();

            // Fill it with Events

            foreach 
                (var currEvent in 
                    GetEventsByUserDateRange(
                        user, 
                        startDate, 
                        endDate))
            {
                iCal.Events.Add(currEvent);
            }
            




            //----------------------------------------------------------------------
            // Loop to generate all the Time Slices
            // for the Date Range
            //----------------------------------------------------------------------


            while (refDate < endDateTime)
            {
                DateTime newTimeSliceStart = 
                    refDate.AddMinutes(
                        TIME_SLICE_SIZE);

                ////----------------------------------------------------------------------
                //// REMARKED ORIGINAL LDATES.ADD 2013/01/03 CA2S RM
                //// I DID THIS TO REFACTOR IT,
                //// SO IT IS EASIER TO DEBUG LINE BY LINE
                //// INSTEAD OF DOING EVERYTHING IN A SINGLE LDATES.ADD
                //// IT BUILDS THE NECESSARY VALUES FIRST, AND THEN ADDS THEM TO LDATES
                ////----------------------------------------------------------------------

                //ldates.Add(

                //    (newTimeSliceStart <= advanceTime) ?

                //    new DataContainer() // Not Available because of Advance Time
                //    {
                //        Ocurrences = new List<Occurrence>(),
                //        TimeBlock = stamp,
                //        DT = refDate,
                //        AddBusyTime = new TimeSpan()
                //    } :

                //    new DataContainer() // Timeslices after Advance Time
                //    {
                //        Ocurrences = iCal.GetOccurrences(refDate, newTimeSliceStart),
                //        TimeBlock = stamp,
                //        DT = refDate,
                //        AddBusyTime = user.BetweenTime
                //    });

                //----------------------------------------------------------------------

                DataContainer tempDataContainer = new DataContainer();


                if (newTimeSliceStart <= advanceTime)
                {

                    // TimeSlice Not Available because it is inside of the Advance Time

                    tempDataContainer.Ocurrences = new List<Occurrence>();
                    tempDataContainer.TimeBlock = stamp;
                    tempDataContainer.DT = refDate;
                    tempDataContainer.AddBusyTime = new TimeSpan();
                    
                }
                else
                {

                    // Timeslices after Advance Time

                    //----------------------------------------------------------------------
                    // iCal.GetOcurrence recovers the Ocurrences between two dates 
                    // but it is "INCLUSIVE these two dates"
                    //
                    // We want the events just before the ending date, 
                    // but NOT including the ending date.
                    //
                    // So, we did this Hack where 
                    // we subtract 1 Millisecond to the Ending Date
                    // 2013/01/02 CA2S RM
                    //----------------------------------------------------------------------

                    DateTime TimeSliceEndJust1MillisecondBefore = 
                        newTimeSliceStart.AddMilliseconds(-1);

                    //----------------------------------------------------------------------

                    tempDataContainer.Ocurrences =
                        iCal.GetOccurrences(
                            refDate,
                            TimeSliceEndJust1MillisecondBefore);
                    tempDataContainer.TimeBlock = stamp;
                    tempDataContainer.DT = refDate;
                    tempDataContainer.AddBusyTime = user.BetweenTime;

                }

                ldates.Add(tempDataContainer);


                //----------------------------------------------------------------------
                // Prepare for Next TimeSlice
                //----------------------------------------------------------------------


                refDate = newTimeSliceStart;


                //----------------------------------------------------------------------
                // If we are getting to the Last Time Slice of the Day
                // (24:00:00 minus the Time Slice size)
                // then we start anew from 00:00:00
                //----------------------------------------------------------------------

                stamp =
                    (stamp == new TimeSpan(24, 0, 0).Subtract(new TimeSpan(0, TIME_SLICE_SIZE, 0))) ?
                        stamp = new TimeSpan() :                         // Starting anew from 00:00:00 
                        stamp.Add(new TimeSpan(0, TIME_SLICE_SIZE, 0));  // Continue with next Time Slice


            }


            //----------------------------------------------------------------------
            // Gets the TimeSlices with Availability 
            // depending on the Ocurrences inside each TimeSlice
            //----------------------------------------------------------------------

            ocurrences =
                ldates.Select(
                    dts => new ProviderAvailability(dts)).ToList();

            //----------------------------------------------------------------------
            // Returns the Results
            //----------------------------------------------------------------------

            return ocurrences.
                        Select(av => av.result).ToList();

        }


        #endregion

        #region Get the Calendar filled with the Events for the User


        /// <summary>
        /// Get the Calendar, filled with the Events for the User
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public iCalendar GetICalendarEventsFromDBByUser(CalendarUser user)
        {

            iCalendar iCal = GetICalendarLibraryInstance();

            iCal.Events.Clear();

            if (user != null)
            {
                foreach (var currEvent in GetEventsByUser(user))
                {
                    iCal.Events.Add(currEvent);
                }
            }

            return iCal;

        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public iCalendar GetICalendarEventsFromDBByUserDateRange(
            CalendarUser user,
            DateTime startDate, 
            DateTime endDate)
        {

            iCalendar iCal = GetICalendarLibraryInstance();

            if (user != null)
            {
                foreach (var currEvent in GetEventsByUserDateRange(
                    user, 
                    startDate, 
                    endDate))
                {
                    iCal.Events.Add(currEvent);
                }
            }

            return iCal;
        }


        /// <summary>
        /// Get Calendar Events, for Export, by User
        /// 
        /// It only takes into account the Events 
        /// with UIDs starting with Asterisk (*)
        /// </summary>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public iCalendar GetCalendarByUserForExport(
            CalendarUser user)
        {


            iCalendar iCalForExport = GetICalendarLibraryInstance();

            iCalForExport.Events.Clear();


            if (user != null)
            {
                foreach (var currEvent in GetEventsByUser(user))
                {
                    // Only add Events that have an UID with a "*" in front
                    if (currEvent.UID.Length > 0 && 
                        currEvent.UID.Substring(0, 1) == "*")
                    {

                        iCalForExport.Events.Add(currEvent);

                    }

                }

            }

            return iCalForExport;
        }

        #endregion

        


        #region Create Event (iCal Format, having the Loconomics DB Record)


        /// <summary>
        /// Create Event 
        /// 
        /// In iCal format, from the Loconomics DB
        /// </summary>
        /// <param name="eventFromDB"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private iEvent CreateEvent(
            CalendarDll.Data.CalendarEvents eventFromDB)
        {

            iEvent iCalEvent = new iEvent()
            {
                Summary = eventFromDB.Summary ?? null,
                Start = new iCalDateTime((DateTime)eventFromDB.StartTime),
                Duration = (eventFromDB.EndTime - eventFromDB.StartTime),
                Location = eventFromDB.Location ?? null,
                AvailabilityID = eventFromDB.CalendarAvailabilityTypeID,
                EventType = eventFromDB.EventType,
                IsAllDay = eventFromDB.IsAllDay,
                Status = GetEventStatus(eventFromDB.CalendarAvailabilityTypeID),
                Priority = eventFromDB.Priority ?? 0,
                UID = (string.IsNullOrEmpty(eventFromDB.UID)) ? "*" + Guid.NewGuid().ToString() : eventFromDB.UID,
                Class = eventFromDB.Class,
                Organizer = eventFromDB.Organizer != null ? new Organizer(eventFromDB.Organizer) : null,
                Transparency = (TransparencyType)(eventFromDB.Transparency ? 1 : 0),
                Created      = new iCalDateTime((DateTime)(eventFromDB.CreatedDate ?? DateTime.Now)),
                DTEnd        = new iCalDateTime((DateTime)eventFromDB.EndTime),
                DTStamp      = new iCalDateTime((DateTime)(eventFromDB.StampTime ?? DateTime.Now)),
                DTStart      = new iCalDateTime((DateTime)eventFromDB.StartTime),
                LastModified = new iCalDateTime((DateTime)(eventFromDB.UpdatedDate ?? DateTime.Now)),
                Sequence = eventFromDB.Sequence ?? 0,
                RecurrenceID = eventFromDB.RecurrenceId != null ? new iCalDateTime((DateTime)eventFromDB.RecurrenceId) : null,
                GeographicLocation = eventFromDB.Geo != null    ? new GeographicLocation(eventFromDB.Geo) : null/*"+-####;+-####"*/,
                Description = eventFromDB.Description ?? null
            };


            //----------------------------------------------------------------------
            // Additional Processing
            //----------------------------------------------------------------------


            FillExceptionsDates( iCalEvent, eventFromDB);
            FillRecurrencesDates(iCalEvent, eventFromDB);
            FillContacts(        iCalEvent, eventFromDB);
            FillAttendees(       iCalEvent, eventFromDB);
            FillComments(        iCalEvent, eventFromDB);
            FillRecurrences(     iCalEvent, eventFromDB);


            //----------------------------------------------------------------------

            return iCalEvent;
        }


        #endregion

        #region Create Between Events


        /// <summary>
        /// Create Between Events
        /// 
        /// It takes the Original iCal Event
        /// and creates another iCal Event 
        /// following the original, 
        /// and with the duration of the Between Event of the User
        /// </summary>
        /// <param name="originalICalEvent"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA</remarks>
        private iEvent CreateBetweenEvent(iEvent originalICalEvent,CalendarUser user)
        {
            //CultureInfo.CreateSpecificCulture("es-ES");
            var resources = 
                new System.Resources.ResourceManager(
                    typeof(CalendarDll.Resources));

            string descriptionBetweenTime =
                resources.GetString(
                    "BetweenTime",
                    System.Threading.Thread.CurrentThread.CurrentCulture); // "Between Time" - Localized

            iEvent events = new iEvent()
            {

                Summary = descriptionBetweenTime,
                UID = "*" + Guid.NewGuid().ToString(), // * at the start dennotes a Loconomics (not external) Event
                Start = 
                    originalICalEvent.DTEnd,
                Duration = 
                    user.BetweenTime,
                AvailabilityID = 
                    originalICalEvent.AvailabilityID,
                Status = 
                    originalICalEvent.Status,
                Priority = 
                    originalICalEvent.Priority,
                Description = 
                    originalICalEvent.Description + " - " + descriptionBetweenTime,
                Organizer = 
                    originalICalEvent.Organizer,
                Transparency = 
                    originalICalEvent.Transparency,
                Created = 
                    originalICalEvent.Created,
                DTStamp = 
                    originalICalEvent.DTEnd,
                DTStart = 
                    originalICalEvent.DTEnd,
                DTEnd = 
                    originalICalEvent.DTEnd.Add(user.BetweenTime),
                Sequence = 
                    originalICalEvent.Sequence,
                RecurrenceID = 
                    originalICalEvent.RecurrenceID,
                //RecurrenceRules = evt.RecurrenceRules,

            };

            //----------------------------------------------------------------------
            // If there are Recurrence Rules in the Original
            // add them to the "Between Event" too
            //----------------------------------------------------------------------

            events.RecurrenceRules.AddRange(originalICalEvent.RecurrenceRules);

            //----------------------------------------------------------------------

            return events;
        }


        #endregion




        #region Get Event Status


        /// <summary>
        /// Get Event Status
        /// </summary>
        /// <param name="statusID"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private EventStatus GetEventStatus(int statusID)
        {

            //TODO
            //
            //  Tentative = 0,
            //  Confirmed = 1,
            //  Cancelled = 2,
            //
            //cancelled excluded

            if (statusID == 3) return EventStatus.Tentative;
            else if (statusID == 1 || statusID == 4) return EventStatus.Confirmed;
            else if (statusID == 2 || statusID == 0) return EventStatus.Confirmed;

            return EventStatus.Confirmed;

        }

        #endregion

        #region Get Transparency


        /// <summary>
        /// Get Transparency
        /// </summary>
        /// <param name="eventStatus"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA</remarks>
        private static bool getTransparency(int eventStatus)
        {
            if (eventStatus == 0) return true;
            return false;
        }


        #endregion

        #region Get Availability Id

        private int getAvailabilityId(Event currEvent)
        {
            var Status = currEvent.Status;
            var Transparency = currEvent.Transparency;

           
            if (Transparency == null) Transparency = TransparencyType.Opaque;


            var returnValue = AvailabilityTypes.TRANSPARENT;

            if (Transparency == TransparencyType.Transparent)
            {
                returnValue = AvailabilityTypes.TRANSPARENT;
            }
            else 
            {

                switch (Status)
                {
                    case EventStatus.Confirmed:
                        {
                            returnValue = AvailabilityTypes.BUSY; 
                            break;
                        }
                    case EventStatus.Tentative:
                        {
                            returnValue = AvailabilityTypes.TENTATIVE;
                            break;
                        }
                    case EventStatus.Cancelled:
                        {
                            returnValue = AvailabilityTypes.TRANSPARENT;
                            break;
                        }
                    default:
                        {
                            returnValue = AvailabilityTypes.TENTATIVE;
                            break;
                        }
                } 

            } 
            return (Int32)returnValue;
        }

        /// <summary>
        /// Get the Database AvailabilityID based on the 
        /// FreeBusyEntry status, that has one-to-one equivalencies
        /// </summary>
        /// <param name="fbentry"></param>
        /// <returns></returns>
        /// <remarks>IagoSRL 2013/05/08</remarks>
        private AvailabilityTypes getAvailabilityId(IFreeBusyEntry fbentry)
        {
            switch (fbentry.Status)
            {
                case FreeBusyStatus.Free:
                    return AvailabilityTypes.FREE;
                default:
                case FreeBusyStatus.Busy:
                    return AvailabilityTypes.BUSY;
                case FreeBusyStatus.BusyTentative:
                    return AvailabilityTypes.TENTATIVE;
                case FreeBusyStatus.BusyUnavailable:
                    return AvailabilityTypes.UNAVAILABLE;
            }
        }


        /// <summary>
        /// Get Availability Id
        /// </summary>
        /// <param name="eventStatus"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private int getAvailabilityId(
            int eventStatus)
        {


            if (eventStatus == 0) { 
                return 4; 
            }
            
            
            return 2;

        }

        /// <summary>
        /// Availabilty when Importing
        /// 
        /// It calculates the Availability
        /// depending on the Status (which could be Confirmed, Tentative, Cancelled)
        /// and the Transparency (which could be Opaque or Transparent)
        /// </summary>
        /// <param name="Status"></param>
        /// <param name="Transparency"></param>
        /// <returns></returns>
        /// <remarks>2013/01/02 CA2S RM</remarks>
        private int getAvailabilityId(string Status, string Transparency)
        {

            // Event Availability (Return Values)
            // (See table: CalendarAvailabilityType)
            //
            //const Int32 AVAILABILITY_UNAVAILABLE = 0;
            const Int32 AVAILABILITY_FREE        = 1;
            const Int32 AVAILABILITY_BUSY        = 2;
            const Int32 AVAILABILITY_TENTATIVE   = 3;
            const Int32 AVAILABILITY_TRANSPARENT = 4;

            const string TRANSPARENCY_OPAQUE      = "OPAQUE";
            const string TRANSPARENCY_TRANSPARENT = "TRANSPARENT";

            const string STATUS_CONFIRMED = "CONFIRMED";
            const string STATUS_TENTATIVE = "TENTATIVE";
            const string STATUS_CANCELLED = "CANCELLED";


            //----------------------------------------------------------------------
            // Clean Up of Parameters
            //----------------------------------------------------------------------


            Status = Status.Trim().ToUpper();
            Transparency = Transparency.Trim().ToUpper();


            //----------------------------------------------------------------------
            // Default Values for the Parameters
            //----------------------------------------------------------------------

            if (Status == "") 
            {
                Status = STATUS_CONFIRMED;
            }

            if (Transparency == "") 
            {
                Transparency = TRANSPARENCY_OPAQUE;
            }


            ////----------------------------------------------------------------------
            //// If Both Parameters are empty
            ////----------------------------------------------------------------------

            //if ((Status=="") && (Transparency==""))
            //{
            //    return 2; // 2 == Busy            
            //}

            ////----------------------------------------------------------------------
            //// If Status Parameter is empty
            ////----------------------------------------------------------------------

            //if ((Status == "") && (Transparency != "")) 
            //{

            //    if (Transparency == "")
            //    {

            //    }
            //    else
            //    {

            //    }
            //}


            //----------------------------------------------------------------------
            // Default Value for the Return Value: Transparent 
            // (Doesn't take part in Free/Busy calculations)
            //----------------------------------------------------------------------


            Int32 returnValue = AVAILABILITY_TRANSPARENT;


            //----------------------------------------------------------------------
            // Check which Combination of Parameters applies
            //----------------------------------------------------------------------

            if (Transparency == TRANSPARENCY_OPAQUE) 
            {

                switch (Status) 
                {
                    case STATUS_CONFIRMED: { 
                        returnValue = AVAILABILITY_BUSY;
                        break;
                    }
                    case STATUS_TENTATIVE: { 
                        returnValue = AVAILABILITY_TENTATIVE;
                        break;
                    }
                    case STATUS_CANCELLED: { 
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }

                } // switch (Status)
            
            }
            else if (Transparency == TRANSPARENCY_TRANSPARENT)
            {

                switch (Status) 
                {
                    case STATUS_CONFIRMED: { 
                        returnValue = AVAILABILITY_FREE;
                        break;
                    }
                    case STATUS_TENTATIVE: { 
                        // Case Free, but Tentative - Don't take part in calculations
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }
                    case STATUS_CANCELLED: { 
                        // Case Free, but Cancelled - Don't take part in calculations
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }

                } // switch (Status)

            } // else if (Transparency == TRANSPARENCY_TRANSPARENT)


            //----------------------------------------------------------------------
            // Return Value
            //----------------------------------------------------------------------

            return returnValue;

        }


        #endregion

        #region Get Events by User


        /// <summary>
        /// Get Events by User
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private IEnumerable<iEvent> GetEventsByUser(CalendarUser user)
        {

            using (var db = new CalendarDll.Data.loconomicsEntities()) 
            { 
            
                var listEventsFromDB =
                    db.CalendarEvents.
                        Where(c => c.UserId == user.Id).ToList();

                var iCalEvents = new List<iEvent>();

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    var iCalEvent = CreateEvent(currEventFromDB);

                    iCalEvents.Add(iCalEvent);

                    //----------------------------------------------------------------------
                    // If the Event is a Busy Event
                    // that is Work of a Provider,
                    // it adds a "Between Time" or buffer time
                    // so that the next Job is not completely next in the Calendar.
                    //
                    // This is to give some preparation or transportation time
                    // between Jobs to the Provider
                    //----------------------------------------------------------------------

                    //----------------------------------------------------------------------
                    // Event types
                    //----------------------------------------------------------------------
                    //
                    // 1	booking - GENERATES BETWEEN TIME
                    // 2	work hours
                    // 3	availibility events
                    // 4	imported
                    // 5	other
                    //
                    //----------------------------------------------------------------------


                    if (iCalEvent.EventType == 1)
                    {
                        var evExt = CreateBetweenEvent(iCalEvent,user);
                        iCalEvents.Add(evExt);
                    }

                    //var newEv = CreateEvent(c);
                    //yield return newEv;

                    //----------------------------------------------------------------------

                }     
      
            return iCalEvents;


            }

        }

        /// <summary>
        /// Get Events By User
        /// (overloads another version without Dates parameters)
        /// 
        /// And also by Range of Dates
        /// Note: Because recurrence events are more complicated,
        /// they are recovered regardless of dates
        /// </summary>
        /// <param name="user"></param>
        /// <param name="startEvaluationDate"></param>
        /// <param name="endEvaluationDate"></param>
        /// <returns></returns>
        /// <remarks>2012/12 by CA2S FA</remarks>
        private IEnumerable<iEvent> GetEventsByUserDateRange(
            CalendarUser user, 
            DateTime startEvaluationDate, 
            DateTime endEvaluationDate)
        {

            // For the Ending of the Range
            // We'll get the Next Day
            // And the comparisson will be: Less than this Next Day
            DateTime nextDayFromEndEvaluationDay = 
                endEvaluationDate.Date.AddDays(1);


            using (var db = new CalendarDll.Data.loconomicsEntities()) 
            { 
            
            
                // Recovers Events 
                // for a particular User
                // and a particular Date Range
                // OR, if they are Recurrence, any Date Range
                var listEventsFromDB =
                    db.CalendarEvents.Where(
                        c => c.UserId == user.Id &&
                        ((c.EndTime < nextDayFromEndEvaluationDay && 
                        c.StartTime >=startEvaluationDate) || 
                            c.CalendarReccurrence.Any())).ToList();

                var iCalEvents = new List<iEvent>();

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    var iCalEvent = CreateEvent(currEventFromDB);

                    iCalEvents.Add(iCalEvent);

                    //----------------------------------------------------------------------
                    // If the Event is a Busy Event
                    // that is Work of a Provider,
                    // it adds a "Between Time" or buffer time
                    // so that the next Job is not completely next in the Calendar.
                    //
                    // This is to give some preparation or transportation time
                    // between Jobs to the Provider
                    //----------------------------------------------------------------------

                    //----------------------------------------------------------------------
                    // Event types
                    //----------------------------------------------------------------------
                    //
                    // 1	booking - GENERATES BETWEEN TIME
                    // 2	work hours
                    // 3	availibility events
                    // 4	imported
                    // 5	other
                    //
                    //----------------------------------------------------------------------

                    if (iCalEvent.EventType == 1)
                    {
                        var evExt = CreateBetweenEvent(iCalEvent,user);
                        iCalEvents.Add(evExt);
                    }

                    //var newEv = CreateEvent(c);
                    //yield return newEv;

                    //----------------------------------------------------------------------

                }

                return iCalEvents;            
            
            }

        }



        #endregion



        #region Fill Exceptions Dates



        /// <summary>
        /// Fill Exceptions Dates
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillExceptionsDates(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            var exceptionDates = 
                eventFromDB.CalendarEventExceptionsPeriodsList;

            if (!exceptionDates.Any()) 
            { 
                return; 
            }

            var periodsList = new List<PeriodList>();

            foreach (var prd in exceptionDates)
            {
                var period = new PeriodList();
                foreach (var dates in prd.CalendarEventExceptionsPeriod)
                {
                    if (dates.DateEnd.HasValue)
                        period.Add(
                            new Period(
                                new iCalDateTime(dates.DateStart),
                                new iCalDateTime(dates.DateEnd.Value)));
                    else
                        period.Add(
                            new Period(
                                new iCalDateTime(dates.DateStart)));
                }
                iCalEvent.ExceptionDates.Add(period);
            }
        }


        private void FillExceptionsDatesToDB(Event iCalEvent, CalendarDll.Data.CalendarEvents eventForDB)
        {
            var exceptionDates = iCalEvent.ExceptionDates;

            if (!exceptionDates.Any())
            {
                return;
            }

            var periodsList = new List<PeriodList>();
            var periods = new CalendarEventExceptionsPeriodsList();

            foreach (var prd in exceptionDates)
            {
                foreach (var dates in prd)
                {
                    periods.CalendarEventExceptionsPeriod.Add(new CalendarEventExceptionsPeriod()
                    {
                        DateStart = dates.StartTime.Value,
                        DateEnd = dates.EndTime != null ? (DateTime?)dates.EndTime.Value : null,
                    });
                }
            }
            eventForDB.CalendarEventExceptionsPeriodsList.Add(periods);
        }

        #endregion

        #region Fill Recurrence Dates



        /// <summary>
        /// Fill Recurrence Dates
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillRecurrencesDates(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            var recurrenceDates = 
                eventFromDB.CalendarEventRecurrencesPeriodList;
            
            if (!recurrenceDates.Any())   return; 

            var periodsList = new List<PeriodList>();

            foreach (var prd in recurrenceDates)
            {
                var period = new PeriodList();

                foreach (var dates in prd.CalendarEventRecurrencesPeriod)
                {
                    if (dates.DateEnd.HasValue)
                        period.Add( new Period(
                            new iCalDateTime(dates.DateStart),
                            new iCalDateTime(dates.DateEnd.Value)));
                    else
                        period.Add( new Period(
                            new iCalDateTime(dates.DateStart)));
                }

                iCalEvent.RecurrenceDates.Add(period);
            }

        }

        private void FillRecurrencesDatesToDB( Event iCalEvent, CalendarEvents eventForDB)
        {
            var recurrenceDates = iCalEvent.RecurrenceDates;

            if (!recurrenceDates.Any()) return;

            var periodsList = new CalendarEventRecurrencesPeriodList();

            foreach (var prd in recurrenceDates)
            {
                foreach (var dates in prd)
                {
                    periodsList.CalendarEventRecurrencesPeriod.Add(new CalendarEventRecurrencesPeriod{
                        DateStart = dates.StartTime.Value,
                        DateEnd = dates.EndTime != null ? (DateTime?)dates.EndTime.Value : null
                    });
                }
            }
            eventForDB.CalendarEventRecurrencesPeriodList.Add(periodsList);

        }



        #endregion

        #region Fill Contacts


        /// <summary>
        /// Fill Contacts
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillContacts(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {

            if (eventFromDB.CalendarEventsContacts.Any())
                iCalEvent.Contacts.AddRange(
                    eventFromDB.CalendarEventsContacts.Select(
                        ct => ct.Contact));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventForDB"></param>
        private void FillContactsToDB(dynamic iCalEvent, CalendarEvents eventForDB)
        {
            if (!iCalEvent.Contacts.Any()) return;

            foreach(var contact in iCalEvent.Contacts){
                eventForDB.CalendarEventsContacts.Add(new CalendarEventsContacts(){ Contact = contact, IdEvent = eventForDB.Id});
            }
        }


        #endregion

        #region Fill Attendees


        /// <summary>
        /// Fill Attendees
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillAttendees(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            //cass attendee[0] type: 'MAILTO:myid@mymaildomain.com'
            //cass attendee[1] type: 'John Doe'
            //cass attemdee[2] type: 'Admin, Administrator'
            if (!eventFromDB.CalendarEventsAttendees.Any()) return;

            foreach (var att in eventFromDB.CalendarEventsAttendees)
            {
                iCalEvent.Attendees.Add(new Attendee(att.Uri){ CommonName = att.Attendee, Role = att.Role});
                
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventForDB"></param>
        /// <remarks>Changed by IagoSRL on 2013/05/08 to be generic, accepting any IUniqueComponent
        /// and dynamic objectForDB that has CalendarEventComments field.
        /// This allow using the method not only for Events, like originally, else for vfreebusy objects
        /// and others.</remarks>
        private void FillAttendeesToDB(IUniqueComponent iCalObject, dynamic objectForDB)
        {
            if (!iCalObject.Attendees.Any()) return;

            foreach (var atts in iCalObject.Attendees) {
                objectForDB.CalendarEventsAttendees.Add(new CalendarEventsAttendees { 
                    Attendee = atts.CommonName, IdEvent = objectForDB.Id, Role = atts.Role, Uri = atts.Value.ToString()
                });
            }
        }

        #endregion

        #region Fill Comments


        /// <summary>
        /// Fill Comments
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillComments(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            if (eventFromDB.CalendarEventComments.Any())
                iCalEvent.Comments.AddRange(
                    eventFromDB.CalendarEventComments.Select(
                        cmts => cmts.Comment));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalObject"></param>
        /// <param name="objectForDB"></param>
        /// <remarks>Changed by IagoSRL on 2013/05/08 to be generic, accepting any IUniqueComponent
        /// and dynamic objectForDB that has CalendarEventComments field.
        /// This allow using the method not only for Events, like originally, else for vfreebusy objects
        /// and others.</remarks>
        private void FillCommentsToDB(IUniqueComponent iCalObject, dynamic objectForDB)
        {
            if (!iCalObject.Comments.Any()) return;

            foreach(var comment in iCalObject.Comments)
                objectForDB.CalendarEventComments.Add(new CalendarEventComments { Comment = comment, IdEvent = objectForDB.Id  });            
        }


        #endregion

        #region Fill Recurrences



        /// <summary>
        /// Fill Recurrences
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillRecurrences(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {

            var recur = eventFromDB.CalendarReccurrence;
            if (!recur.Any()) return;

            foreach (var rec in recur)
            {
                var recPattern = new RecurrencePattern();

                recPattern.Frequency = (FrequencyType)rec.Frequency;
                if (rec.Count != null) recPattern.Count = (Int32)rec.Count;
                if (rec.Until != null) recPattern.Until = (DateTime)rec.Until;
                if (rec.Interval != null) recPattern.Interval = (Int32)rec.Interval;
                SetFrequencies(rec, recPattern);

                iCalEvent.RecurrenceRules.Add(recPattern);
            }
        }

        private void FillRecurrencesToDB( Event iCalEvent, CalendarEvents eventforDB)
        {
            if (!iCalEvent.RecurrenceRules.Any()) return;
            foreach (var rec in iCalEvent.RecurrenceRules) {
                var newrec = new CalendarReccurrence
                {
                    EventID = eventforDB.Id,
                    Count = rec.Count,
                    EvaluationMode = rec.EvaluationMode.ToString(),
                    Frequency = Convert.ToInt32(rec.Frequency),
                    Interval = rec.Interval,
                    RestristionType = Convert.ToInt32(rec.RestrictionType),
                    FirstDayOfWeek = Convert.ToInt32(rec.FirstDayOfWeek),
                    
                };
                if (rec.Until != null && rec.Until.Year > 1900) newrec.Until = rec.Until;
                SetFrequenciesToDB(rec, newrec);

                eventforDB.CalendarReccurrence.Add(newrec);
            }

           
                /*eventFromDB.CalendarReccurrence;
            if (!recur.Any()) return;

            foreach (var rec in recur)
            {
                var recPattern = new RecurrencePattern();

                recPattern.Frequency = (FrequencyType)rec.Frequency;
                if (rec.Count != null) recPattern.Count = (Int32)rec.Count;
                if (rec.Until != null) recPattern.Until = (DateTime)rec.Until;
                if (rec.Interval != null) recPattern.Interval = (Int32)rec.Interval;
                SetFrecuencies(rec, recPattern);

                iCalEvent.RecurrenceRules.Add(recPattern);
            }*/
        }

       

        #endregion

        #region Set Frecuencies - for Recurrences


        /// <summary>
        /// Set Frecuencies - for Recurrences
        /// </summary>
        /// <param name="rec"></param>
        /// <param name="recPattern"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>

        private static void SetFrequenciesToDB(IRecurrencePattern rec, CalendarReccurrence newrec)
        {
            if (rec.ByDay.Any())
            {
                foreach (var dy in rec.ByDay)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByDay = true,
                        DayOfWeek = Convert.ToInt32(dy.DayOfWeek),
                        FrequencyDay = dy.Offset,
                    });
                }
            }
            if (rec.ByWeekNo.Any())
            {
                foreach (var wk in rec.ByWeekNo)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByWeekNo = true,
                        ExtraValue = wk
                    });
                }
            }
            if (rec.ByMonth.Any())
            {
                foreach (var mnt in rec.ByMonth)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByMonth = true,
                        ExtraValue = mnt
                    });
                }
            }

            if (rec.ByYearDay.Any())
            {
                foreach (var yr in rec.ByMonth)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByYearDay = true,
                        ExtraValue = yr
                    });
                }
            }
        }

        private void SetFrequencies(
            CalendarDll.Data.CalendarReccurrence rec,
            RecurrencePattern recPattern)
        {

            var frec = rec.CalendarReccurrenceFrequency.ToList();

            foreach (var fr in frec)
            {
                if (fr.ByDay ?? false)
                {
                    //var frecDay = fr.FrequencyDay??-2147483648;
                    // Bugfix: @IagoSRL: DayOfWeek > -1 instead of buggy '> 0', because
                    // Sunday is value 0, and was discarted for recurrence because of this:
                    if (fr.DayOfWeek != null && fr.DayOfWeek > -1) 
                        recPattern.ByDay.Add( new WeekDay((DayOfWeek)fr.DayOfWeek, (FrequencyOccurrence)(fr.FrequencyDay ?? -2147483648)));
                }
                else if (fr.ByHour ?? false)
                {
                    recPattern.ByHour.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMinute ?? false)
                {
                    recPattern.ByMinute.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMonth ?? false)
                {
                  
                    recPattern.ByMonth.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMonthDay ?? false)
                {
                    
                    recPattern.ByMonthDay.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.BySecond ?? false)
                {
                    recPattern.BySecond.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.BySetPosition ?? false)
                {
                    recPattern.BySetPosition.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByWeekNo ?? false)
                {
                    
                    recPattern.ByWeekNo.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByYearDay ?? false)
                {
                   
                    recPattern.ByYearDay.Add(fr.ExtraValue ?? 0);
                }
            }
        }

        #endregion



        #region Prepare Data for Export

        /// <summary>
        /// Prepare Data for Export
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Tuple<byte[], string> PrepareExportDataForUser(
            CalendarUser user)
        {


            iCalendar iCalForExport = GetCalendarByUserForExport(user);


            var ctx = new SerializationContext();
            var factory = new
                DDay.iCal.Serialization.iCalendar.SerializerFactory();

            // Get a serializer for our object
            var serializer =
                factory.Build(
                    iCalForExport.GetType(),
                    ctx) as IStringSerializer;

            var output =
                serializer.SerializeToString(
                    iCalForExport);

            var contentType = "text/calendar";

            var bytes = Encoding.UTF8.GetBytes(output);



            return new Tuple<byte[], string>(
                bytes,
                contentType);

        }

        #endregion

        #region Import Calendar



        /// <summary>
        /// Import Calendar
        /// </summary>
        /// <param name="calendar"></param>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public bool ImportCalendar( IICalendarCollection calendar,  CalendarUser user)
        {
            try
            {


                //----------------------------------------------------------------------
                // Loop that adds the Imported Events to a List of CalendarEvents 
                // which are compatible in their fields with the Loconomics database
                //----------------------------------------------------------------------

                using ( var db = new loconomicsEntities() )
                {
                    //----------------------------------------------------------------------
                    // Delete Previously Imported Events
                    //
                    // This was Iago Lorenzo Salgueiro's recommendation
                    // as it simplifies dealing with Events created externally.
                    // In particular, he was concerned when an Event was deleted
                    // outside Loconomics (for example, Google Calendar)
                    // 
                    // Note: EventType = 4 are the Imported Events
                    //
                    // 2013/01/15 CA2S RM
                    //----------------------------------------------------------------------


                    // read the Events for the Specified User and EventType==4 (Imported)
                    var previouslyImportedEventsToDelete =
                        db.CalendarEvents.Where(x =>
                            (x.UserId == user.Id) &&
                            (x.EventType == 4));

                    // Mark the Events as Deleted
                    foreach (var eventToDelete in previouslyImportedEventsToDelete) 
                    {
                        db.CalendarEvents.Remove(eventToDelete);
                    }

                    // Send the Changes (Deletes) to the Database
                    db.SaveChanges();
                    

                    //----------------------------------------------------------------------
                    // Loop to Import the Events
                    //----------------------------------------------------------------------
                    foreach (Event currEvent in calendar.FirstOrDefault().Events.Where(evs => !evs.UID.StartsWith("*")))
                    {

                        // Event Types 
                        // (See table: CalendarEventType)
                        //
                        // 1	booking - GENERATES BETWEEN TIME
                        // 2	work hours
                        // 3	availibility events
                        // 4	imported <-- As we are currently Importing, we will use this Type
                        // 5	other
                        

                        //----------------------------------------------------------------------
                        // See if an Event with the same UID already Exists in the DB
                        // If it Exists, don't import, or there will be duplicates
                        //----------------------------------------------------------------------


                        //bool eventAlreadyExists=false;

                        //----------------------------------------------------------------------
                        //// Delete old event
                        //// This won't be necessary anymore, 
                        //// as the Imported Events are deleted beforehand now
                        //// 2013/01/15 CA2S RM
                        //----------------------------------------------------------------------

                        //var eventExist = db.CalendarEvents.FirstOrDefault(
                        //    ev => ev.UID == currEvent.UID);
                        
                        //if (eventExist != null)
                        //{
                        //    db.CalendarEvents.Remove(eventExist);
                        //   // db.SaveChanges();
                        //}

                        //----------------------------------------------------------------------
                        
                        var eventForDB = new CalendarEvents()
                        {
                            CreatedDate = DateTime.Now,
                            UID = currEvent.UID,
                            UserId = user.Id,
                            StartTime = currEvent.Start.Date.Year != 1 ? currEvent.Start.Date.Add(currEvent.Start.TimeOfDay) : DateTime.Now,
                            EndTime = currEvent.End.Date.Year != 1 ? currEvent.End.Date.Add(currEvent.End.TimeOfDay) : DateTime.Now,
                            Organizer = (currEvent.Organizer != null) ? currEvent.Organizer.CommonName : string.Empty,
                            CalendarAvailabilityTypeID = getAvailabilityId(currEvent),
                            Transparency = getTransparency((int)currEvent.Status),
                            Summary = currEvent.Summary,
                            EventType = 4,  // 4 = Imported
                            IsAllDay = false
                        };

                        FillExceptionsDatesToDB(currEvent, eventForDB);
                        FillRecurrencesDatesToDB(currEvent, eventForDB);
                        FillContactsToDB(currEvent, eventForDB);
                        FillAttendeesToDB(currEvent, eventForDB);
                        FillCommentsToDB(currEvent, eventForDB);
                        FillRecurrencesToDB(currEvent, eventForDB);

                        // Add to the DB

                        db.CalendarEvents.Add(eventForDB);
                    } // foreach (Event currEvent in...
                    
                    // By IagoSRL @Loconomics:
                    // To support Public Calendars, that mainly provide VFREEBUSY (and most of times only that kind of elements),
                    // we need import too the VFREEBUSY blocks, and we will create a single and simple event for each of that,
                    // with automatic name/summary and the given availability:
                    foreach (var fb in calendar.FirstOrDefault().FreeBusy.Where(fb => !fb.UID.StartsWith("*")))
                    {
                        // If the FreeBusy block contains Entries, one event must be created for each entry
                        if (fb.Entries != null && fb.Entries.Count > 0)
                        {
                            int ientry = 0;
                            foreach (var fbentry in fb.Entries)
                            {
                                ientry++;
                                var availID = getAvailabilityId(fbentry);
                                var dbevent = new CalendarEvents()
                                {
                                    CreatedDate = DateTime.Now,
                                    UpdatedDate = DateTime.Now,
                                    ModifyBy = "importer",
                                    UID = fb.UID + "_freebusyentry:" + ientry.ToString(),
                                    UserId = user.Id,
                                    StartTime = fbentry.StartTime.Value,
                                    TimeZone = fbentry.StartTime.TZID,
                                    EndTime = (fbentry.EndTime != null ? fbentry.EndTime.Value : fbentry.StartTime.Value.Add(fbentry.Duration)),
                                    Organizer = (fb.Organizer != null) ? fb.Organizer.CommonName : string.Empty,
                                    CalendarAvailabilityTypeID = (int)availID,
                                    Transparency = false,
                                    Summary = fb.Name ?? availID.ToString(),
                                    EventType = 4, // 4 = Imported
                                    IsAllDay = false
                                };
                                // Linked records
                                FillCommentsToDB(fb, dbevent);
                                FillAttendeesToDB(fb, dbevent);
                                // Add to database
                                db.CalendarEvents.Add(dbevent);
                            }
                        }
                        // If there is no entries, the event is created for the vfreebusy dtstart-dtend dates:
                        else
                        {
                            // The availability for a VFREEBUSY is ever 'Busy', because the object doesn't
                            // allow set the availability/status information, it goes inside freebusy-entries when
                            // there are some.
                            var availID = AvailabilityTypes.BUSY;
                            var dbevent = new CalendarEvents()
                            {
                                CreatedDate = DateTime.Now,
                                UpdatedDate = DateTime.Now,
                                ModifyBy = "importer",
                                UID = fb.UID,
                                UserId = user.Id,
                                StartTime = fb.DTStart.Value,
                                TimeZone = fb.DTStart.TZID,
                                EndTime = fb.DTEnd.Value,
                                Organizer = (fb.Organizer != null) ? fb.Organizer.CommonName : string.Empty,
                                CalendarAvailabilityTypeID = (int)availID,
                                Transparency = false,
                                Summary = fb.Name ?? availID.ToString(),
                                EventType = 4, // 4 = Imported
                                IsAllDay = false
                            };
                            // Linked records
                            FillCommentsToDB(fb, dbevent);
                            FillAttendeesToDB(fb, dbevent);
                            // Add to database
                            db.CalendarEvents.Add(dbevent);
                        }
                    }


                    //----------------------------------------------------------------------
                    // Saves the Events to the Database
                    //----------------------------------------------------------------------

                    db.SaveChanges();


                } //  using ( var db = new CalendarDll.Data.loconomicsEntities() )



                //----------------------------------------------------------------------
                // Reports Import was successful
                //----------------------------------------------------------------------

                return true;

            }
            catch (Exception ex)
            {
                return false;
            }

        }

       



        #endregion













    }

}
