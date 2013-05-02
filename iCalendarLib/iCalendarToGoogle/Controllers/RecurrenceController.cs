using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using CalendarDll.Data;
using DDay.iCal;
using iCalendarToGoogle.Helpers;

namespace iCalendarToGoogle.Controllers
{ 
    public class RecurrenceController : Controller
    {

        #region Declarations

        private loconomicsEntities db = 
            new loconomicsEntities();

        #endregion



        #region GET: /Recurrence/  (Index)



        ///// <summary>
        ///// GET: /Recurrence/
        ///// </summary>
        ///// <returns></returns>
        //public ViewResult Index()
        //{

        //    var calendarreccurrence = 
        //        db.CalendarReccurrence.Include(
        //            c => c.CalendarEvents);
        //    return View(
        //        calendarreccurrence.ToList());
        //}


        /// <summary>
        /// GET: /Recurrence/188
        /// 
        /// Paremeterized with the Event ID
        /// </summary>
        /// <param name="Id">Event Id</param>
        /// <returns></returns>
        /// <remarks>2013/01/15 CA2S RM</remarks>
        public ViewResult Index(int Id)
        {


            var calendarreccurrence =
                db.CalendarReccurrence.
                    Include(c => c.CalendarEvents).
                Where(x => x.EventID == Id).ToList();

            return View(calendarreccurrence);

        }

        #endregion

        #region GET: /Recurrence/Details/5


        /// <summary>
        /// GET: /Recurrence/Details/5
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public ViewResult Details(int Id)
        {
            CalendarReccurrence calendarreccurrence = db.CalendarReccurrence.Find(Id);
            return View(calendarreccurrence);
        }



        #endregion



        #region GET: /Recurrence/Create 

        /// <summary>
        /// GET: /Recurrence/Create
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public ActionResult Create(int Id)
        {
            
            ViewBag.EventID = Id;
            return View();
        }


        #endregion

        #region POST: /Recurrence/Create


        /// <summary>
        /// POST: /Recurrence/Create
        /// </summary>
        /// <param name="calendarreccurrence"></param>
        /// <returns></returns>
        [HttpPost]
        public JsonResult Create(CalendarReccurrence calendarreccurrence)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    if (calendarreccurrence.ID > 0)
                    {
                        var currentFrequences = db.CalendarReccurrenceFrequency.Where(f => f.CalendarReccursiveID == calendarreccurrence.ID);
                        //delete olds frequences
                        foreach (var cf in currentFrequences) db.CalendarReccurrenceFrequency.Remove(cf);

                        /*
                         frequency = 
                         * "SECONDLY" 0 
                         * "MINUTELY" 1 
                         * "HOURLY" 2 
                         * "DAILY" 3
                         * "WEEKLY" 4 
                         * "MONTHLY" 5 
                         * "YEARLY" 6
                         */
                        //add new frequences
                        foreach (var af in calendarreccurrence.CalendarReccurrenceFrequency)
                        {
                            switch (calendarreccurrence.Frequency) {                                
                                case 5: af.ByDay = true; break;
                                case 6: af.ByDay = true; af.ByWeekNo = true; break;
                                case 7: af.ByYearDay = true; break;
                            }  
                            db.CalendarReccurrenceFrequency.Add(af);
                        }

                        db.Entry(calendarreccurrence).State = EntityState.Modified;

                    }
                    else
                    {
                        db.CalendarReccurrence.Add(calendarreccurrence);
                    }
                    db.SaveChanges();

                    return Json(new { Success = 1, RecurrenceId = calendarreccurrence.ID, ex = "" });
                    //return RedirectToAction("Index");  
                }
            }
            catch (Exception ex)
            {
                // If Sucess== 0 then Unable to perform Save/Update Operation and send Exception to View as JSON
                return Json(new { Success = 0, ex = ex.Message.ToString() });
            }

            return Json(new { Success = 0, ex = new Exception("Unable to save").Message.ToString() });
        }


        #endregion



        #region GET: /Recurrence/Edit/5


        /// <summary>
        /// GET: /Recurrence/Edit/5
        /// </summary>
        /// <param name="id"></param>
        /// <param name="evId"></param>
        /// <returns></returns>
        public ActionResult Edit(int id, int evId)
        {

            // db.CalendarEvents.Include(c => c.CalendarAvailabilityType).Include(c => c.users).Include(c => c.CalendarEventType).Where(c => c.UserId == 141);
            CalendarReccurrence calendarreccurrence = db.CalendarReccurrence.Find(id);
            
            ViewBag.EventID = evId;
            
            ViewBag.FirstDayOfWeek = 
                UtilsHelpers.
                    GetDaysOfWeek(
                        calendarreccurrence.FirstDayOfWeek);

            ViewBag.Frequency = 
                UtilsHelpers.
                    GetFrequencies(
                        calendarreccurrence.Frequency);

            return View("Create", calendarreccurrence);
        }
        
        #endregion



        #region Delete

        /// <summary>
        /// ActionResult: Delete
        /// </summary>
        /// <param name="id"></param>
        /// <param name="evId"></param>
        /// <returns></returns>
        public ActionResult Delete(int id, int evId)
        {
            ViewBag.EventID = evId;

            CalendarReccurrence calendarreccurrence = 
                db.CalendarReccurrence.Find(id);

            return View(calendarreccurrence);
        }


        #endregion

        #region POST: /Recurrence/Delete/5

        /// <summary>
        /// POST: /Recurrence/Delete/5
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpPost, ActionName("Delete")]
        public ActionResult DeleteConfirmed(int id)
        {            
            CalendarReccurrence calendarreccurrence = 
                db.CalendarReccurrence.Find(id);

            db.CalendarReccurrence.Remove(calendarreccurrence);
            
            db.SaveChanges();
            
            return RedirectToAction("");
        }

        #endregion



        #region Method: Dispose

        /// <summary>
        /// 
        /// </summary>
        /// <param name="disposing"></param>
        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }

        #endregion

    }


}