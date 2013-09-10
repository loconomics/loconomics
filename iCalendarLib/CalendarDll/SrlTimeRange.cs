using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SRL
{
    /// It represents a pair of Start and End times and elapsed time between both.
    /// Author: IagoSRL@gmail.com
    /// From Lib: SRL
    public class TimeRange
    {
        public TimeSpan? StartTime;
        public TimeSpan? EndTime;
        public TimeRange()
        {
            StartTime = DateTime.Now.TimeOfDay;
            EndTime = null;
        }
        public TimeRange(TimeSpan? start, TimeSpan? end)
        {
            StartTime = start;
            EndTime = end;
        }
        public TimeSpan? ElapsedTime
        {
            get
            {
                if (!StartTime.HasValue || !EndTime.HasValue)
                    return null;
                else
                    return EndTime.Value - StartTime.Value;
            }
        }
    }
}
