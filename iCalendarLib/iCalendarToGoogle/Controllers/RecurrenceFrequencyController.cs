using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using CalendarDll.Data;

namespace iCalendarToGoogle.Controllers
{ 
    public class RecurrenceFrequencyController : Controller
    {
        private loconomicsEntities db = new loconomicsEntities();

        //
        // GET: /RecurrenceFrequency/

        public ViewResult Index()
        {
            var calendarreccurrencefrequency = db.CalendarReccurrenceFrequency.Include(c => c.CalendarReccurrence);
            return View(calendarreccurrencefrequency.ToList());
        }

        //
        // GET: /RecurrenceFrequency/Details/5

        public ViewResult Details(int id)
        {
            CalendarReccurrenceFrequency calendarreccurrencefrequency = db.CalendarReccurrenceFrequency.Find(id);
            return View(calendarreccurrencefrequency);
        }

        //
        // GET: /RecurrenceFrequency/Create

        public ActionResult Create()
        {
            ViewBag.CalendarReccursiveID = new SelectList(db.CalendarReccurrence, "ID", "EvaluationMode");
            return View();
        } 

        //
        // POST: /RecurrenceFrequency/Create

        [HttpPost]
        public ActionResult Create(CalendarReccurrenceFrequency calendarreccurrencefrequency)
        {
            if (ModelState.IsValid)
            {
                db.CalendarReccurrenceFrequency.Add(calendarreccurrencefrequency);
                db.SaveChanges();
                return RedirectToAction("Index");  
            }

            ViewBag.CalendarReccursiveID = new SelectList(db.CalendarReccurrence, "ID", "EvaluationMode", calendarreccurrencefrequency.CalendarReccursiveID);
            return View(calendarreccurrencefrequency);
        }
        
        //
        // GET: /RecurrenceFrequency/Edit/5
 
        public ActionResult Edit(int id)
        {
            CalendarReccurrenceFrequency calendarreccurrencefrequency = db.CalendarReccurrenceFrequency.Find(id);
            ViewBag.CalendarReccursiveID = new SelectList(db.CalendarReccurrence, "ID", "EvaluationMode", calendarreccurrencefrequency.CalendarReccursiveID);
            return View(calendarreccurrencefrequency);
        }

        //
        // POST: /RecurrenceFrequency/Edit/5

        [HttpPost]
        public ActionResult Edit(CalendarReccurrenceFrequency calendarreccurrencefrequency)
        {
            if (ModelState.IsValid)
            {
                db.Entry(calendarreccurrencefrequency).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            ViewBag.CalendarReccursiveID = new SelectList(db.CalendarReccurrence, "ID", "EvaluationMode", calendarreccurrencefrequency.CalendarReccursiveID);
            return View(calendarreccurrencefrequency);
        }

        //
        // GET: /RecurrenceFrequency/Delete/5
 
        public ActionResult Delete(int id)
        {
            CalendarReccurrenceFrequency calendarreccurrencefrequency = db.CalendarReccurrenceFrequency.Find(id);
            return View(calendarreccurrencefrequency);
        }

        //
        // POST: /RecurrenceFrequency/Delete/5

        [HttpPost, ActionName("Delete")]
        public ActionResult DeleteConfirmed(int id)
        {            
            CalendarReccurrenceFrequency calendarreccurrencefrequency = db.CalendarReccurrenceFrequency.Find(id);
            db.CalendarReccurrenceFrequency.Remove(calendarreccurrencefrequency);
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