using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// A dates range, simplified info usually needed from an CalendarEvent
/// </summary>
public class EventDates
{
    public DateTime startTime;
    public DateTime endTime;

	public EventDates(DateTime start, DateTime end)
	{
        startTime = start;
        endTime = end;
	}
}
