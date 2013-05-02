using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CalendarDll
{
    public class EventsUtilities
    {

        #region Return Codes

        public enum EventsUtilitiesReturnCodes
        {
            success,

            exceptionOnCreate,
            exceptionOnCreateNewRecordParameterNull,
            exceptionOnCreateUIDAlreadyExists,

            exceptionOnEdit,
            exceptionOnEditEditRecordParameterNull,
            exceptionOnEditRecordNotFound,

            exceptionOnDelete,
            exceptionOnDeleteUIDParameterEmpty,
            exceptionOnDeleteRecordNotFound,

            exceptionOnRead,
            exceptionOnReadUIDParameterEmpty
        }


        #endregion


        //================================================================================
        // CRUD Operations with Evens
        //================================================================================


        #region Create Event

        /// <summary>
        /// Create Event
        /// </summary>
        /// <param name="newCalendarEvent"></param>
        /// <remarks>2013/02/06 CA2S Roque Mocan</remarks>
        public EventsUtilitiesReturnCodes 
            CreateEvent(
                CalendarDll.Data.CalendarEvents newCalendarEvent) 
        {
            try
            {
                //-----------------------------------------------------------------------------
                // Check: Is parameter null?
                // If so, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                if (newCalendarEvent == null)
                {
                    return 
                        EventsUtilitiesReturnCodes.
                            exceptionOnCreateNewRecordParameterNull;
                }

                //-----------------------------------------------------------------------------
                // Check: Does an Event with the same UID already exist?
                // If so, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                using (CalendarDll.Data.loconomicsEntities db = new Data.loconomicsEntities())
                {

                    if (db.CalendarEvents.Where(x => x.UID==newCalendarEvent.UID).Any())
                    {
                        return
                            EventsUtilitiesReturnCodes.
                                exceptionOnCreateUIDAlreadyExists;

                    }
                

                //-----------------------------------------------------------------------------
                // Add the New Event, and Save it
                //-----------------------------------------------------------------------------
                    db.CalendarEvents.Add(newCalendarEvent);
                    db.SaveChanges();

                    return EventsUtilitiesReturnCodes.success;
                }

            }
            catch // (Exception ex)
            {
                return EventsUtilitiesReturnCodes.exceptionOnCreate;
            }

        }

        #endregion

        #region Edit Event


        /// <summary>
        /// Edit Event
        /// </summary>
        /// <param name="calendarEventWithChanges"></param>
        /// <returns>2013/02/11 CA2S Roque Mocan</returns>
        public EventsUtilitiesReturnCodes EditEvent(
            CalendarDll.Data.CalendarEvents calendarEventWithChanges) 
        {
            try
            {
                //-----------------------------------------------------------------------------
                // Check: Is parameter null?
                // If so, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                if (calendarEventWithChanges == null)
                {
                    return 
                        EventsUtilitiesReturnCodes.
                            exceptionOnEditEditRecordParameterNull;
                }                
                
                //-----------------------------------------------------------------------------
                // Check: Does the Record to Edit exist?
                // If not, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                using (CalendarDll.Data.loconomicsEntities db = new Data.loconomicsEntities())
                {

                    CalendarDll.Data.CalendarEvents eventToEdit =
                        db.CalendarEvents.
                            Where(x => x.UID == calendarEventWithChanges.UID).FirstOrDefault();


                    if (eventToEdit == null)
                    {
                        return
                            EventsUtilitiesReturnCodes.
                                exceptionOnEditRecordNotFound;

                    }




                //-----------------------------------------------------------------------------
                // Edit the Event
                //-----------------------------------------------------------------------------



                    eventToEdit.CalendarAvailabilityType = calendarEventWithChanges.CalendarAvailabilityType;
                    eventToEdit.CalendarAvailabilityTypeID = calendarEventWithChanges.CalendarAvailabilityTypeID;
                    eventToEdit.CalendarEventComments = calendarEventWithChanges.CalendarEventComments;

                    eventToEdit.CalendarEventExceptionsPeriodsList = calendarEventWithChanges.CalendarEventExceptionsPeriodsList;
                    eventToEdit.CalendarEventRecurrencesPeriodList = calendarEventWithChanges.CalendarEventRecurrencesPeriodList;
                    eventToEdit.CalendarEventsAttendees = calendarEventWithChanges.CalendarEventsAttendees;

                    eventToEdit.CalendarEventsContacts = calendarEventWithChanges.CalendarEventsContacts;
                    eventToEdit.CalendarEventType = calendarEventWithChanges.CalendarEventType;
                    eventToEdit.CalendarReccurrence = calendarEventWithChanges.CalendarReccurrence;

                    eventToEdit.Class = calendarEventWithChanges.Class;
                    eventToEdit.CreatedDate = calendarEventWithChanges.CreatedDate;
                    eventToEdit.DayofWeek = calendarEventWithChanges.DayofWeek;

                    eventToEdit.Description = calendarEventWithChanges.Description;
                    eventToEdit.EndTime = calendarEventWithChanges.EndTime;
                    //eventToEdit.EventType = calendarEventWithChanges.EventType; // CHECK WHAT TYPE OF DATA SHOULD BE RETURNED HERE

                    eventToEdit.Geo = calendarEventWithChanges.Geo;
                    //eventToEdit.Id                         = calendarEventWithChanges.Id;
                    eventToEdit.IsAllDay = calendarEventWithChanges.IsAllDay;

                    eventToEdit.Location = calendarEventWithChanges.Location;
                    eventToEdit.ModifyBy = calendarEventWithChanges.ModifyBy;
                    eventToEdit.Organizer = calendarEventWithChanges.Organizer;

                    eventToEdit.Priority = calendarEventWithChanges.Priority;
                    eventToEdit.RecurrenceId = calendarEventWithChanges.RecurrenceId;
                    eventToEdit.Sequence = calendarEventWithChanges.Sequence;

                    eventToEdit.StampTime = calendarEventWithChanges.StampTime;
                    eventToEdit.StartTime = calendarEventWithChanges.StartTime;
                    eventToEdit.Summary = calendarEventWithChanges.Summary;

                    //eventToEdit.TimeBlock = calendarEventWithChanges.TimeBlock;
                    //eventToEdit.TimeZone = calendarEventWithChanges.TimeZone;
                    //eventToEdit.Transparency = calendarEventWithChanges.Transparency;

                    //eventToEdit.UID = calendarEventWithChanges.UID;
                    //eventToEdit.UpdatedDate = calendarEventWithChanges.UpdatedDate;
                    //eventToEdit.UserId = calendarEventWithChanges.UserId;

                    //eventToEdit.users = calendarEventWithChanges.users;


                    // Save the Edited Changes
                    db.SaveChanges();

                    return EventsUtilitiesReturnCodes.success;
                }

            }
            catch (Exception ex)
            {
                //throw ex;
                return EventsUtilitiesReturnCodes.exceptionOnCreate;
            }

        }

        #endregion

        #region Delete Event by UID



        /// <summary>
        /// Delete Event by UID
        /// </summary>
        /// <param name="UID"></param>
        /// <returns></returns>
        /// <remarks>2013/02/09 Roque Mocan</remarks>
        public EventsUtilitiesReturnCodes DeleteEvent(string UIDToDelete) 
        {

            try
            {

                //-----------------------------------------------------------------------------
                // Check: Is parameter null?
                // If so, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                if (UIDToDelete.Trim() == "")
                {
                    return 
                        EventsUtilitiesReturnCodes.
                            exceptionOnDeleteUIDParameterEmpty;
                }                
                
                //-----------------------------------------------------------------------------
                // Check: Does the Record to Delete exist?
                // If not, exit with an Error Return Code
                //-----------------------------------------------------------------------------

                using (CalendarDll.Data.loconomicsEntities db = new Data.loconomicsEntities())
                {

                    CalendarDll.Data.CalendarEvents eventToDelete =
                        db.CalendarEvents.
                            Where(x => x.UID == UIDToDelete).FirstOrDefault();


                    if (eventToDelete == null)
                    {
                        return
                            EventsUtilitiesReturnCodes.
                                exceptionOnDeleteRecordNotFound;

                    }
                    else
                    // Delete
                    { 
                        db.CalendarEvents.Remove(eventToDelete);

                        db.SaveChanges();                    
                    }

                //using (CalendarDll.Data.loconomicsEntities db = new Data.loconomicsEntities())
                //{
                    //CalendarDll.Data.CalendarEvents eventToDelete = 
                    //    db.CalendarEvents.
                    //        Where(x => x.UID == UIDToDelete).
                    //            FirstOrDefault();

                    //if (eventToDelete != null)
                    //{
                    //    db.CalendarEvents.Remove(eventToDelete);

                    //    db.SaveChanges();
                    //}

                }

                return EventsUtilitiesReturnCodes.success;
            }
            catch
            {
                 return EventsUtilitiesReturnCodes.exceptionOnDelete;

            }
 
        }

        #endregion

        #region Get Event by UID

        /// <summary>
        /// Get Event by UID
        /// </summary>
        /// <param name="UIDToReturn"></param>
        /// <returns></returns>
        /// <remarks>2013/02/11 CA2S Roque Mocan</remarks>
        public CalendarDll.Data.CalendarEvents GetEventByUID(string UIDToReturn)
        {
            //return null;

            try
            {   
                
                //-----------------------------------------------------------------------------
                // Check: Is parameter null?
                // If so, return Null
                //-----------------------------------------------------------------------------

                if (UIDToReturn.Trim() == "")
                {
                    return null;
                }  
     
                //-----------------------------------------------------------------------------

                CalendarDll.Data.CalendarEvents eventToReturn = null;

                using (CalendarDll.Data.loconomicsEntities db = new Data.loconomicsEntities())
                {
                    eventToReturn = 
                            db.CalendarEvents.
                                Where(x => x.UID == UIDToReturn).FirstOrDefault();


                }

                return eventToReturn;

            }
            catch // (Exception ex)
            {
                return null;
                //throw ex;
            }


        }

        #endregion


    }



}
