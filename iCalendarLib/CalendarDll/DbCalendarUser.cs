using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System;
using System.Collections;
using System.Data;
using System.Web;


namespace CalendarDll
{
    public static class DbCalendarUser
    {
        public static void SetUser(Int32 IdUser)
        {
            
            var cookie = HttpContext.Current.Request.Cookies["_calendaruser"];
            if (cookie != null)
            {
                if (IdUser != Convert.ToInt32(cookie.Value))
                {
                    _user = new CalendarUser(IdUser);
                    cookie.Value = _user.Id.ToString();
                }
               
            }
            else
            {
                _user = new CalendarUser(IdUser);
                new HttpCookie("_calendaruser") { Value = _user.Id.ToString(), Expires = DateTime.Now.AddDays(1) };
            }
        }

        private static CalendarUser _user;

        public static CalendarUser GetUser() {
                return _user;
        }
    }

   
}
