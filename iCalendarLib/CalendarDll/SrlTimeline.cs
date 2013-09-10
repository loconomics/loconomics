using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SRL;
using System.Data;

namespace Srl
{
    /// <summary>
    /// Allows registering times on performing tasks to help in the measuring of performance.
    /// Author: IagoSRL@gmail.com
    /// From Lib: SRL
    /// </summary>
    public class Timeline
    {
        private Dictionary<string, TimeRange> times = new Dictionary<string,TimeRange>();
        private Dictionary<string, string> notes = new Dictionary<string,string>();
        public Timeline()
        {
        }
        public TimeRange SetTime(string name, TimeSpan? start, TimeSpan? end)
        {
            times[name] = new TimeRange(start, end);
            return times[name];
        }
        public TimeRange SetTime(string name, TimeSpan? start) 
        {
            return SetTime(name, start, null);
        }
        public TimeRange SetTime(string name)
        {
            return SetTime(name, DateTime.Now.TimeOfDay, null);
        }
        public TimeRange StopTime(string name)
        {
            if (times.ContainsKey(name))
            {
                times[name].EndTime = DateTime.Now.TimeOfDay;
                return times[name];
            }
            return null;
        }
        public TimeRange StopTime(string name, string timeNotes)
        {
            var t = StopTime(name);
            if (t != null)
                notes[name] = timeNotes;
            return t;
        }
        public TimeRange GetTime(string name)
        {
            if (times.ContainsKey(name))
                return times[name];
            return null;
        }
        public string GetTimeNotes(string name)
        {
            if (notes.ContainsKey(name))
                return notes[name];
            return "";
        }
        public DataTable GetDataTable()
        {
            var t = new DataTable("timeline");
            t.Columns.Add("name", typeof(string));
            t.Columns.Add("startTime", typeof(TimeSpan?));
            t.Columns.Add("endTime", typeof(TimeSpan?));
            t.Columns.Add("elapsedTime", typeof(TimeSpan?));
            t.Columns.Add("notes", typeof(string));

            foreach (var it in times)
            {
                string n = null;
                if (notes.ContainsKey(it.Key))
                    n = notes[it.Key];
                t.Rows.Add(
                    it.Key,
                    it.Value.StartTime,
                    it.Value.EndTime,
                    it.Value.ElapsedTime,
                    n
                );
            }

            return t;
        }
        public override string ToString()
        {
            var s = "";

            s += "Name".PadRight(30, ' ');
            s += "|Start  ".PadRight(4, ' ');
            s += "|End    ".PadRight(4, ' ');
            s += "|Elapsed".PadRight(4, ' ');
            s += "|Notes\n";
            s += "".PadRight(80, '_');
            s += "\n";

            foreach (var it in times)
            {
                s += it.Key.PadRight(30);
                s += "|" + it.Value.StartTime.ToString().PadRight(4, ' ');
                s += "|" + it.Value.EndTime.ToString().PadRight(4, ' ');
                s += "|" + it.Value.ElapsedTime.ToString().PadRight(4, ' ');
                if (notes.ContainsKey(it.Key))
                    s += "|" + notes[it.Key];
                s += "\n";
            }

            return s;
        }
        public string ToHtmlString(
            string className = "timeline",
            bool showName = true,
            bool showStartTime = true,
            bool showEndTime = true,
            bool showElapsedTime = true,
            bool showNotes = true)
        {
            var s = new StringBuilder();

            s.AppendFormat("<table class='{0}'>", className);

            // Headers
            s.Append("<tr>");
            if (showName)
                s.Append("<th>Name</th>");
            if (showStartTime)
                s.Append("<th>Start</th>");
            if (showEndTime)
                s.Append("<th>End</th>");
            if (showElapsedTime)
                s.Append("<th>Elapsed</th>");
            if (showNotes)
                s.Append("<th>Notes</th>");
            s.Append("</tr>");

            // Data
            foreach (var it in times)
            {
                s.Append("<tr>");
                if (showName)
                    s.AppendFormat("<td>{0}</td>", new System.Web.HtmlString(it.Key).ToHtmlString());
                if (showStartTime)
                    s.AppendFormat("<td>{0}</td>", it.Value.StartTime);
                if (showEndTime)
                    s.AppendFormat("<td>{0}</td>", it.Value.EndTime);
                if (showElapsedTime)
                    s.AppendFormat("<td>{0}</td>", it.Value.ElapsedTime);
                if (showNotes)
                    s.AppendFormat("<td>{0}</td>", (notes.ContainsKey(it.Key) ? new System.Web.HtmlString(notes[it.Key]).ToHtmlString() : ""));
                s.Append("</tr>");
            }

            s.Append("</table>");

            return s.ToString();
        }
    }
}
