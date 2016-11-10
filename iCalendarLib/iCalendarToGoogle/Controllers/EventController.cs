using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using CalendarDll.Data;
using CalendarDll.Helpers;
using iCalendarToGoogle.Helpers;

namespace iCalendarToGoogle.Controllers
{ 
    public class EventController : Controller
    {
        private loconomicsEntities db = new loconomicsEntities();

        //
        // GET: /Event/

        public ViewResult Index()
        {

            const int HARDCODED_USER_ID = 141;

            var calendarevents = 
                db.CalendarEvents.Include(
                    c => c.CalendarAvailabilityType).Include(
                        c => c.users).Include(
                            c => c.CalendarEventType).Where(
                                c => c.UserId == HARDCODED_USER_ID);

            return View(calendarevents.ToList());

        }

        //
        // GET: /Event/Details/5

        public ViewResult Details(int id)
        {
            CalendarEvents calendarevents = db.CalendarEvents.Find(id);
            return View(calendarevents);
        }

        //
        // GET: /Event/Create

        public ActionResult Create(CalendarReccurrence recurrence)
        {
            ViewBag.CalendarAvailabilityTypeID = 
                new SelectList( 
                    db.CalendarAvailabilityType, 
                    "CalendarAvailabilityTypeID", 
                    "CalendarAvailabilityTypeName");
            ViewBag.UserId = new SelectList(db.users, "UserID", "FirstName");
            ViewBag.EventType = new SelectList(db.CalendarEventType, "EventTypeId", "EventType");
            ViewBag.DayofWeek = UtilsHelpers.GetDaysOfWeek();
            return View();
        } 

        //
        // POST: /Event/Create

        [HttpPost]
        public ActionResult Create(CalendarEvents calendarevents)
        {
            if (ModelState.IsValid)
            {
                db.CalendarEvents.Add(calendarevents);
                db.SaveChanges();
                return RedirectToAction("Index");  
            }

            ViewBag.CalendarAvailabilityTypeID = 
                new SelectList(
                    db.CalendarAvailabilityType, 
                    "CalendarAvailabilityTypeID", 
                    "CalendarAvailabilityTypeName", 
                    calendarevents.CalendarAvailabilityTypeID);

            ViewBag.UserId = 
                new SelectList(
                    db.users, 
                    "UserID", 
                    "FirstName", 
                    calendarevents.UserId);

            ViewBag.EventType = 
                new SelectList(
                    db.CalendarEventType, 
                    "EventTypeId", 
                    "EventType", 
                    calendarevents.EventType);

            return View(calendarevents);
        }
        
        //
        // GET: /Event/Edit/5
 
        public ActionResult Edit(int id)
        {
           
            CalendarEvents calendarevents = 
                db.CalendarEvents.Include(
                    c => c.CalendarReccurrence).
                        FirstOrDefault(c => c.Id == id);
            // CalendarEvents calendarevents = db.CalendarEvents.Find(id);
            
            ViewBag.CalendarAvailabilityTypeID = 
                new SelectList(
                    db.CalendarAvailabilityType, 
                    "CalendarAvailabilityTypeID", 
                    "CalendarAvailabilityTypeName", 
                    calendarevents.CalendarAvailabilityTypeID);

            ViewBag.UserId = 
                new SelectList(
                    db.users, 
                    "UserID", 
                    "FirstName", 
                    calendarevents.UserId);

            ViewBag.EventType = 
                new SelectList(
                    db.CalendarEventType, 
                    "EventTypeId", 
                    "EventType", 
                    calendarevents.EventType);

            return View(calendarevents);

        }

        //
        // POST: /Event/Edit/5

        [HttpPost]
        public ActionResult Edit(CalendarEvents calendarevents)
        {
            if (ModelState.IsValid)
            {
                db.Entry(calendarevents).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            ViewBag.CalendarAvailabilityTypeID = 
                new SelectList(
                    db.CalendarAvailabilityType, 
                    "CalendarAvailabilityTypeID", 
                    "CalendarAvailabilityTypeName", 
                    calendarevents.CalendarAvailabilityTypeID);

            ViewBag.UserId = 
                new SelectList(
                    db.users, 
                    "UserID", 
                    "FirstName", 
                    calendarevents.UserId);

            ViewBag.EventType = 
                new SelectList(
                    db.CalendarEventType, 
                    "EventTypeId", 
                    "EventType", 
                    calendarevents.EventType);

            return View(calendarevents);

        }

        //
        // GET: /Event/Delete/5
 
        public ActionResult Delete(int id)
        {
            CalendarEvents calendarevents = 
                db.CalendarEvents.Find(id);
            return View(calendarevents);
        }

        //
        // POST: /Event/Delete/5

        [HttpPost, ActionName("Delete")]
        public ActionResult DeleteConfirmed(int id)
        {            
            CalendarEvents calendarevents = 
                db.CalendarEvents.Find(id);
            db.CalendarEvents.Remove(calendarevents);
            db.SaveChanges();

            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}