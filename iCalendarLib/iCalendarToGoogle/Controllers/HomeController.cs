using DDay.iCal.Serialization;
using DDay.iCal.Serialization.iCalendar;
using iCalendarToGoogle.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using CalendarDll;
using CalendarDll.Data;
using System.Threading;
using System.Globalization;
using iCalendarToGoogle.Helpers;
using DDay.iCal;

namespace iCalendarToGoogle.Controllers
{
    public class HomeController : Controller
    {


        
        #region Action Result: Index (Main Page)


        /// <summary>
        /// Action Result: Index (Main Page)
        /// </summary>
        /// <param name="language"></param>
        /// <returns></returns>
        public ActionResult Index(string language)
        {

            //---------------------------------------------------------------------------
            // Culture
            //---------------------------------------------------------------------------


            ViewBag.CurrentLanguage = CultureHelper.SetCulture(language);
            ViewBag.CurrentDate     = DateTime.Now.ToLongDateString();
            ViewBag.CulturesList    = Cultures.GetCultures();
            

            //---------------------------------------------------------------------------
            // Establish User
            //---------------------------------------------------------------------------


            var cUsers = Datacontext.users.Select(
                u => new UserInfo 
                { 
                    NumUserId = u.UserID, 
                    Name = u.FirstName });

            if (cUsers.Count() <= 1) 
            { 
                DbCalendarUser.SetUser(
                    cUsers.Select(c => c.NumUserId).FirstOrDefault()); 
            }
            
            ViewBag.CalendarUsers = cUsers;


            //---------------------------------------------------------------------------
            
            
            return View();
        }

        #endregion

        
        #region Action Result: Evaluate (Free / Busy Events)



        /// <summary>
        /// Evaluate (Free / Busy Events)
        /// 
        /// Gets a List of Time Slices
        /// and shows them on the Web Page
        /// </summary>
        /// <param name="dateStart">From which Date (at 00:00) do we wish to evaluate</param>
        /// <param name="dateEnd">Up to which Date (at just before 24:00) do we wish to evaluate</param>
        /// <returns></returns>
        public ActionResult Evaluate(
            DateTime dateStart, 
            DateTime dateEnd)
        {
            // Gets and sets the Static User property
            // (Needed to know for whom are we getting the Free / Busy times)

            // NOTE: WE WILL DEPRECATE THE UTILS (STATIC) LIBRARIES EVENTUALLY

            //Utils.User = DbCalendarUser.GetUser();


            //------------------------------------------------------------------------
            // Current User
            //------------------------------------------------------------------------


            // NOTE: CURRENTLY THIS USES A STATIC DBCALENDARUSER LIBRARY
            // IT SHOULD PERHAPS BETTER GET THE USER FROM THE SESSION

            CalendarUser user = DbCalendarUser.GetUser();


            ////------------------------------------------------------------------------
            //// Parameters to see if there are Any Events
            ////------------------------------------------------------------------------


            //DateTime startDateAnyEvents = dateStart;
            //DateTime endDateAnyEvents = dateEnd.AddDays(1).AddMinutes(-1);


            //------------------------------------------------------------------------
            // Calendar Library
            // (Note: this is the Dynamic (not Static) version
            //------------------------------------------------------------------------


            CalendarUtils libCalendarutils = new CalendarUtils();


            // Get the Events for the User and Date Range


            iCalendar CalendarEventsExistsInDateRange = 
                libCalendarutils.GetICalendarEventsFromDBByUserDateRange(
                    user, 
                    dateStart, 
                    dateEnd);


            //------------------------------------------------------------------------
            // If there are Any Events, 
            // evaluate the Events to look for Free / Busy times
            //------------------------------------------------------------------------

            
            List<CalendarDll.ProviderAvailabilityResult> eventsFreeBusy =
                libCalendarutils.GetFreeEvents(
                    user,
                    dateStart,   // From which Date we get the time slices (starts at 00:00 of that date)
                    dateEnd,     // Up to which Date we get the time slices (ends at just before the next day, by the size of the Time Slice)
                    dateStart);  // This parameter is the Current Date-Time for calculating Advance Time. Times before this Date-Time + Advance Time are not available. FOR THIS DEMO WE HAVE PUT THE SAME DATESTART, BUT IT WOULD BE THE CURRENT DATE TIME

            return View(eventsFreeBusy);


            //------------------------------------------------------------------------


            //// If there are Any Events, process the Events
            //if (Utils.GetCalendar(startDateAnyEvents, endDateAnyEvents).Events.Any())
            //{
            //    var events =
            //        Utils.GetFreeEvents(
            //            dateStart,   // From which Date we get the time slices (starts at 00:00 of that date)
            //            dateEnd,     // Up to which Date we get the time slices (ends at just before the next day, by the size of the Time Slice)
            //            dateStart);  // This parameter is the Current Date-Time for calculating Advance Time. Times before this Date-Time + Advance Time are not available. FOR THIS DEMO WE HAVE PUT THE SAME DATESTART, BUT IT WOULD BE THE CURRENT DATE TIME

            //    return View(events);
            //}

            //else
            //{

            //    //TODO:

            //    return View();

            //    //return View("Index", "Home");
            //}


        }



        #endregion


        #region Action Result: Export

        /// <summary>
        /// Action Result: Export iCalendar
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public ActionResult Export()
        {
            try
            {
                //cass: serializaing to ics, item1 = bits, item2 = filepath

                // Sets the current User
                CalendarUser user = DbCalendarUser.GetUser();
                //Utils.User = DbCalendarUser.GetUser();

                CalendarUtils libCalendarUtils = new CalendarUtils();

                //var file = Utils.PrepareExportData();
                var file = libCalendarUtils.PrepareExportDataForUser(user);

                return File(
                    file.Item1, 
                    file.Item2, 
                    "Calendar.ics");

            }
            catch (Exception ex) { 
                
                // TODO:
                ViewBag.Error = ex.Message.ToString();

                return View();
            }
        }


        #endregion


        #region Action Result: Change User


        /// <summary>
        /// Change User
        /// </summary>
        /// <param name="Users"></param>
        /// <returns></returns>
        public ActionResult ChangeUser(int Users) 
        {
            // Establishes the New User
            DbCalendarUser.SetUser(Users);
            
            return RedirectToAction("Index", "Home");

        }


        #endregion


        #region Action Result: About (the one that comes by default on MVC projects)


        /// <summary>
        /// Action Result: About (the one that comes by default on MVC projects)
        /// </summary>
        /// <returns></returns>
        public ActionResult About()
        {
            return View();
        }


        #endregion



        
        #region Private Declarations

        /// <summary>
        /// Loconomics Entities
        /// </summary>
        private loconomicsEntities Datacontext = 
            new loconomicsEntities();


        #endregion




        
    }
}
