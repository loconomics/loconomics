using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WindowsFormsApplicationTestCSharp
{
    public partial class FrmLoconomicsICalendarTests : Form
    {
        public FrmLoconomicsICalendarTests()
        {
            InitializeComponent();
        }


        #region Button Create Event


        /// <summary>
        /// Button Create Event
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        /// <remarks>2013/02/07 CA2S Roque Mocan</remarks>
        private void btnEventCreate_Click(object sender, EventArgs e)
        {
            try
            {
 
                //-----------------------------------------------------------
                // Read the Data
                //-----------------------------------------------------------
                
                int      newEventUserID       = (int) nudCreateEventUserId.Value ;
                string   newEventComment      = txtCreateEventSummary.Text;
                string   newEventUID          = txtCreateEventUID.Text;

                int      newEventCalendarAvailabilityTypeID = (int) nudCreateEventCalendarAvailabilityTypeId.Value;
                bool     newEventTransparency = chkCreateEventTransparency.Checked;
                DateTime newEventStartTime    = dtpCreateEventStartTime.Value;

                DateTime newEventEndTime      = dtpCreateEventEndTime.Value;
                bool     newEventIsAllDay     = chkCreateEventIsAllDay.Checked;
                DateTime newEventStampTime    = dtpCreateEventStampTime.Value;

                string   newEventTimeZone     = txtCreateEventTimeZone.Text;
                int      newEventPriority     = (int) nudCreateEventPriority.Value;
                string   newEventLocation     = txtCreateEventLocation.Text;

                DateTime newEventUpdateDate   = dtpCreateEventUpdatedDate.Value;
                DateTime newEventCreatedDate  = dtpCreateEventCreatedDate.Value;
                string   newEventModifyBy     = txtCreateEventModifiedBy.Text;

                string   newEventClass        = txtCreateEventClass.Text;
                string   newEventOrganizer    = txtCreateEventOrganizer.Text;
                int      newEventSequence     = (int) nudCreateEventSequence.Value;

                string   newEventGeo          = txtCreateEventGeo.Text;
                DateTime newEventRecurrenceId = dtpCreateEventRecurrenceId.Value;
                TimeSpan newEventTimeBlock    = new TimeSpan(0, (int) nudCreateEventTimeBlock.Value, 0);

                int      newEventDayOfWeek    = (int) nudCreateEventDayOfWeek.Value;
                string   newEventDescription  = txtCreateEventDescription.Text;
                int      newEventType         = (int) nudCreateEventCalendarEventType.Value;
                



                //-----------------------------------------------------------
                // Create a new Event (in a local variable)
                //-----------------------------------------------------------
                
                CalendarDll.Data.CalendarEvents 
                    NewCalendarEvent = 
                        new CalendarDll.Data.CalendarEvents();

                // Fill the New Event
                NewCalendarEvent.UserId       = newEventUserID;
                NewCalendarEvent.Summary      = newEventComment;
                NewCalendarEvent.UID          = newEventUID;

                NewCalendarEvent.CalendarAvailabilityTypeID = newEventCalendarAvailabilityTypeID;
                NewCalendarEvent.Transparency = newEventTransparency;
                NewCalendarEvent.StartTime    = newEventStartTime;

                NewCalendarEvent.EndTime      = newEventEndTime;
                NewCalendarEvent.IsAllDay     = newEventIsAllDay;
                NewCalendarEvent.StampTime    = newEventStampTime;

                NewCalendarEvent.TimeZone     = newEventTimeZone;
                NewCalendarEvent.Priority     = newEventPriority;
                NewCalendarEvent.Location     = newEventLocation;

                NewCalendarEvent.UpdatedDate  = newEventUpdateDate;
                NewCalendarEvent.CreatedDate  = newEventCreatedDate;
                NewCalendarEvent.ModifyBy     = newEventModifyBy;

                NewCalendarEvent.Class        = newEventClass;
                NewCalendarEvent.Organizer    = newEventOrganizer;
                NewCalendarEvent.Sequence     = newEventSequence;

                NewCalendarEvent.Geo          = newEventGeo;
                NewCalendarEvent.RecurrenceId = newEventRecurrenceId;
                NewCalendarEvent.TimeBlock    = newEventTimeBlock;

                NewCalendarEvent.DayofWeek    = newEventDayOfWeek;
                NewCalendarEvent.Description  = newEventDescription;
                NewCalendarEvent.EventType    = newEventType;


                //-----------------------------------------------------------
                // Call the Library to Create the Event in the Database
                //-----------------------------------------------------------
                

                CalendarDll.EventsUtilities 
                    objEventsUtilities = 
                        new CalendarDll.EventsUtilities();

                CalendarDll.EventsUtilities.EventsUtilitiesReturnCodes 
                    returnCode =  
                        objEventsUtilities.
                            CreateEvent(
                                NewCalendarEvent);

                if (returnCode ==
                    CalendarDll.
                        EventsUtilities.
                            EventsUtilitiesReturnCodes.
                                success)
                {
                    MessageBox.Show("Saved...");
                }
                else
                {
                    MessageBox.Show("There was a problem..." + returnCode.ToString());
                }


            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }


        #endregion

        #region Button Read Event by UID

        /// <summary>
        /// Button Read Event by UID
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e">2013/02/11 Roque Mocan</param>
        private void btnReadEventByID_Click(object sender, EventArgs e)
        {
            try
            {
                string UIDToRead;
                UIDToRead = txtReadEventById.Text;

                CalendarDll.EventsUtilities 
                    objEventsUtilities = 
                        new CalendarDll.EventsUtilities();

                CalendarDll.Data.CalendarEvents 
                    eventToRead = 
                        objEventsUtilities.GetEventByUID(UIDToRead);

                if (eventToRead != null)
                {

                    //-----------------------------------------------------------
                    // Read the Data
                    //-----------------------------------------------------------

                    nudReadEventEventUser.Value = eventToRead.UserId;
                    txtReadEventSummary.Text = eventToRead.Summary;
                    txtReadEventUID.Text = eventToRead.UID;

                    nudReadEventCalendarAvailabilityTypeId.Value = eventToRead.CalendarAvailabilityTypeID;
                    chkReadEventTransparency.Checked = eventToRead.Transparency;
                    dtpReadEventStartTime.Value = eventToRead.StartTime;

                    dtpReadEventEndTime.Value = eventToRead.EndTime;
                    chkReadEventIsAllDay.Checked = eventToRead.IsAllDay;
                    dtpReadEventStampTime.Value = (eventToRead.StampTime == null) ? DateTime.Parse("1900/01/01") : (DateTime)eventToRead.StampTime;

                    txtReadEventTimeZone.Text = eventToRead.TimeZone;
                    nudReadEventPriority.Value = (decimal)eventToRead.Priority;
                    txtReadEventLocation.Text = eventToRead.Location;

                    dtpReadEventUpdatedDate.Value = (eventToRead.UpdatedDate == null) ? DateTime.Parse("1900/01/01") : (DateTime)eventToRead.UpdatedDate;
                    dtpReadEventCreatedDate.Value = (eventToRead.CreatedDate == null) ? DateTime.Parse("1900/01/01") : (DateTime)eventToRead.CreatedDate;
                    txtReadEventModifiedBy.Text = eventToRead.ModifyBy;

                    txtReadEventClass.Text = eventToRead.Class;
                    txtReadEventOrganizer.Text = eventToRead.Organizer;
                    nudReadEventSequence.Value = (decimal)eventToRead.Sequence;

                    txtReadEventGeo.Text = eventToRead.Geo;
                    dtpReadEventRecurrenceId.Value = (eventToRead.RecurrenceId == null) ? DateTime.Parse("1900/01/01") : (DateTime)eventToRead.RecurrenceId;
                    nudReadEventTimeBlock.Value = eventToRead.TimeBlock.Value.Minutes;

                    nudReadEventDayOfWeek.Value = (decimal)eventToRead.DayofWeek;
                    txtReadEventDescription.Text = eventToRead.Description;

                    //nudReadEventCalendarEventType.Value = (decimal)eventToRead.CalendarEventType.EventTypeId;


                }
                else
                {
                    MessageBox.Show("Not Found");
                }

            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }


        #endregion

        #region Button Save Edited Changes

        /// <summary>
        /// Button Save Edited Changes
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        /// <remarks>2013/02/11 Roque Mocan</remarks>
        private void btnSaveEditedChanges_Click(object sender, EventArgs e)
        {
            try
            {
                // Note: Before, we Read the Event and Edited it


                //-----------------------------------------------------------
                // Read the Data
                //-----------------------------------------------------------

                int editedEventUserID            = (int)nudReadEventEventUser.Value;
                string   editedEventComment      = txtReadEventSummary.Text;
                string   editedEventUID          = txtReadEventUID.Text;
                         
                int      editedEventCalendarAvailabilityTypeID = (int) nudReadEventCalendarAvailabilityTypeId.Value;
                bool     editedEventTransparency = chkReadEventTransparency.Checked;
                DateTime editedEventStartTime    = dtpReadEventStartTime.Value;
                         
                DateTime editedEventEndTime      = dtpReadEventEndTime.Value;
                bool     editedEventIsAllDay     = chkReadEventIsAllDay.Checked;
                DateTime editedEventStampTime    = dtpReadEventStampTime.Value;
                         
                string   editedEventTimeZone     = txtReadEventTimeZone.Text;
                int      editedEventPriority     = (int) nudReadEventPriority.Value;
                string   editedEventLocation     = txtReadEventLocation.Text;
                         
                DateTime editedEventUpdateDate   = dtpReadEventUpdatedDate.Value;
                DateTime editedEventCreatedDate  = dtpReadEventCreatedDate.Value;
                string   editedEventModifyBy     = txtReadEventModifiedBy.Text;
                         
                string   editedEventClass        = txtReadEventClass.Text;
                string   editedEventOrganizer    = txtReadEventOrganizer.Text;
                int      editedEventSequence     = (int) nudReadEventSequence.Value;
                         
                string   editedEventGeo          = txtReadEventGeo.Text;
                DateTime editedEventRecurrenceId = dtpReadEventRecurrenceId.Value;
                TimeSpan editedEventTimeBlock    = new TimeSpan(0, (int) nudReadEventTimeBlock.Value, 0);
                         
                int      editedEventDayOfWeek    = (int) nudReadEventDayOfWeek.Value;
                string   editedEventDescription  = txtReadEventDescription.Text;
                int      editedEventType         = (int) nudReadEventCalendarEventType.Value;

                CalendarDll.Data.CalendarEvents 
                    editedEvent = 
                        new CalendarDll.Data.CalendarEvents();

                //-----------------------------------------------------------
                // Fill the Edited Event in a Calendar Event Object
                //----------------------------------------------------------
                
                editedEvent.UserId       = editedEventUserID;
                editedEvent.Summary      = editedEventComment;
                editedEvent.UID          = editedEventUID;

                editedEvent.CalendarAvailabilityTypeID = editedEventCalendarAvailabilityTypeID;
                editedEvent.Transparency = editedEventTransparency;
                editedEvent.StartTime    = editedEventStartTime;
                                           
                editedEvent.EndTime      = editedEventEndTime;
                editedEvent.IsAllDay     = editedEventIsAllDay;
                editedEvent.StampTime    = editedEventStampTime;
                                           
                editedEvent.TimeZone     = editedEventTimeZone;
                editedEvent.Priority     = editedEventPriority;
                editedEvent.Location     = editedEventLocation;
                                           
                editedEvent.UpdatedDate  = editedEventUpdateDate;
                editedEvent.CreatedDate  = editedEventCreatedDate;
                editedEvent.ModifyBy     = editedEventModifyBy;
                                           
                editedEvent.Class        = editedEventClass;
                editedEvent.Organizer    = editedEventOrganizer;
                editedEvent.Sequence     = editedEventSequence;
                                           
                editedEvent.Geo          = editedEventGeo;
                editedEvent.RecurrenceId = editedEventRecurrenceId;
                editedEvent.TimeBlock    = editedEventTimeBlock;
                                           
                editedEvent.DayofWeek    = editedEventDayOfWeek;
                editedEvent.Description  = editedEventDescription;
                editedEvent.EventType    = editedEventType; // NOT SURE IF VALUES ARE CORRECT. IT SEEMS TO BE A COMPLETE CLASS

                //-----------------------------------------------------------
                // Save the Edits
                //-----------------------------------------------------------

                CalendarDll.EventsUtilities 
                    objEventsUtilities =
                        new CalendarDll.EventsUtilities();

                CalendarDll.EventsUtilities.EventsUtilitiesReturnCodes returnCode;
                returnCode = objEventsUtilities.EditEvent(editedEvent);

                //-----------------------------------------------------------

                if (returnCode == CalendarDll.EventsUtilities.EventsUtilitiesReturnCodes.success)
                { 
                    MessageBox.Show("Edited Event Saved...");
                }
                else
                {
                    MessageBox.Show("There was a problem editing: " + returnCode.ToString());
                }

            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }
        #endregion


        #region Button Delete Event by UID


        /// <summary>
        /// Delete Event by UID
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnDeleteEvent_Click(object sender, EventArgs e)
        {

            string UIDtoDelete;
            UIDtoDelete = txtDeleteEventUID.Text;


            CalendarDll.EventsUtilities 
                objEventsUtilities = 
                    new CalendarDll.EventsUtilities();

            CalendarDll.EventsUtilities.EventsUtilitiesReturnCodes returnCode;
            returnCode = objEventsUtilities.DeleteEvent(UIDtoDelete);

            if (returnCode == CalendarDll.EventsUtilities.EventsUtilitiesReturnCodes.success)
            {
                MessageBox.Show("Deleted...");
            }
            else
            {
                MessageBox.Show("Error: " + returnCode.ToString());
            }

        }


        #endregion







    }
}
