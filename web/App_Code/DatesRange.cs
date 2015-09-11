using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 
/// </summary>
public class DatesRange
{
    public DateTime Start;
    public DateTime End;

	public DatesRange(DateTime start, DateTime end)
	{
		Start = start;
        End = end;
	}
}