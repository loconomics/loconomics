using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SRL;
using System.Data;

namespace Srl
{
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
    }
}
