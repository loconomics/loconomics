using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// It identifies when a constraint of any kind 
/// cancelled or not allowed an operation from
/// being performed.
/// </summary>
public class ConstraintException : Exception
{
    public string Message { get; set; }
	public ConstraintException()
	{}
    public ConstraintException(string message)
    {
        Message = message;
    }
}