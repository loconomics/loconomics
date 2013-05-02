using DDay.iCal;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using CalendarDll;
using CalendarDll.Data;

namespace iCalendarToGoogle.Controllers
{
    public class ImportController : Controller
    {
        //
        // GET: /Import/


        #region ActionResult: Index


        /// <summary>
        /// ActionResult: Index
        /// </summary>
        /// <returns></returns>
        public ActionResult Index()
        {
            return View();
        }


        #endregion

        #region ActionResult: Import

        /// <summary>
        /// ActionResult: Import
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult ImportResult(HttpPostedFileBase file)
        {
            // save file to server
            try
            {
                if (file != null && file.ContentLength > 0)
                {

                    var fileName =  DateTime.Today.ToString("yy.MM.dd") +  Path.GetFileName(file.FileName);

                    var path =  Path.Combine( Server.MapPath("~/Calendars"), fileName);

                    file.SaveAs(path);

                    /*IMPORT*/
                    var user = DbCalendarUser.GetUser();

                    if (user != null)
                    {
                        var iCaltoImport =  iCalendar.LoadFromFile(path);

                        CalendarUtils libCalendarUtil = new CalendarUtils();

                        libCalendarUtil.ImportCalendar( iCaltoImport, user);

                        ViewBag.Msg = "Import Succeeded";
                    }
                    else ViewBag.Msg = "User not found";
                }
                else 
                {
                    ViewBag.Msg = "File not Found";
                }
            }
            catch (Exception ex) {
                ViewBag.Msg =  string.Format("Error on Import: {0}", ex.Message);
            }

            return View();
        }


        #endregion

    }
}
