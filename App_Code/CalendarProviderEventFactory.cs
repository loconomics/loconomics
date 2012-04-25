using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Mail;
using System.Reflection;

namespace LcCommonLib
{
    /// <summary>
    /// This class looks at the host portion of the email provider address (e.g. @gmail, @live, @yahoo) to determine
    /// the email provider. It the uses Reflection to find the corresponding class that supports the interface
    /// "ICalendarProviderEvent" with the corresponding "MailHost" property, and instantiates an instance of that class.
    /// if a corresponding class cannot be found the "DefaultCalendarProviderEvent" class is instantiated.
    /// 
    /// The Method CreateCalendarEvent is called passing the EventDetail and formatting the Event notification in the 
    /// Appropriate CalendarFormat for that Email client.
    /// the object is returned to the Caller.
    /// 
    /// This is an extensible approach that supports adding new mail providers with their own variation of the ICAL/VCAL
    /// specifical, by implementing a new ICalendarProviderEvent class within the application for each.
    /// </summary>
    public class CalendarProviderEventFactory
    {
        public static ICalendarProviderEvent Create(string ReceiverEmail, EventNotificationDTO EventDetail)
        {
            MailAddress ma = new MailAddress(ReceiverEmail);
            return Create(ma, EventDetail);
        }

        public static ICalendarProviderEvent Create(MailAddress ReceiverEmail, EventNotificationDTO EventDetail)
        {
            ICalendarProviderEvent CalendarProviderEvent = null;

            var all = Assembly.GetCallingAssembly();
            var instances = (from type in all.GetTypes()
                             where !type.IsAbstract &&
                                   type.IsClass &&
                                   type.IsPublic &&
                                   !type.IsGenericType &&
                                   typeof(ICalendarProviderEvent).IsAssignableFrom(type)
                             let ctor = type.GetConstructor(Type.EmptyTypes)
                             where ctor != null && ctor.IsPublic
                             select (ICalendarProviderEvent)Activator.CreateInstance(type))
                .ToList();

            bool found = false;
            foreach (ICalendarProviderEvent provider in instances)
            {
                if (!found)
                {
                    if (provider.MailHost == ReceiverEmail.Host)
                    {
                        CalendarProviderEvent = provider;
                        found = true;
                    }
                }
            }


            //bool found = false;
            //Assembly curAssembly = Assembly.GetCallingAssembly();
            //foreach (Type t in curAssembly.GetTypes())
            //{
            //    if (!typeof(ICalendarProviderEvent).IsAssignableFrom(t)) continue;
            //    if (!found)
            //    {
            //        //Instantiate an instance of the type so we can read its mail host property
            //        object inst = Activator.CreateInstance(Type.GetType(t.FullName));
            //        if (inst != null)
            //        {   //if not null, cast as the interface
            //            CalendarProviderEvent = (ICalendarProviderEvent)inst;

            //            //Check this instances MailHost property against the ReceiverEmail we have to see if its the right
            //            //Instance Type: eg. MailHost = "gmail.com"  matches ReceiverEmail.Host = "gmail.com"
            //            if (CalendarProviderEvent.MailHost == ReceiverEmail.Host)
            //            {
            //                //If the mailhost property matches the currrent ReceiverEmail.host
            //                //this is the class type we need, set found to true, so this instance will be returned to the caller
            //                found = true;
            //            }
            //        }

                    

            //    }
            //}

            if (CalendarProviderEvent == null)
            {
                //No Corresponding Calendar eventtype was found matching CurrentHost
                //e.g. current classes may only implement "gmail.com, live.com, and Yahoo.com" while
                //     ReceiverEmail.Host = "xyz.tv"
                // over time we can analyze which hosts are heavily used and implement new classes accordingly
                //Create an instance of DefaultCalendarProviderEvent

                object inst = Activator.CreateInstance(Type.GetType("LcCommonLib.DefaultCalendarProviderEvent"));
                if (inst != null)
                {   //if not null, cast as the interface
                    CalendarProviderEvent = (ICalendarProviderEvent)inst;
                }
            }

            if(CalendarProviderEvent == null)
            {
                string msg = "[CalendarProviderEventFactory.Create] CalendarProviderEvent is null, prior to Call to 'CreateCalendarEvent().'";
                throw new ApplicationException(msg);
            }

            //create an event instance with the provided event detail
            CalendarProviderEvent.CreateCalendarEvent(EventDetail);

            return CalendarProviderEvent;
        }
    }
}
