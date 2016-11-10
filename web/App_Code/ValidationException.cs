using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Describes an input data validation error, marking the 
/// field/property name publicly recognized (ParamName) or nothing if
/// a global validation rule or complex rule involving several
/// fields. It allows to specify a container name if the parameter
/// is part of another object with that name, on complex 
/// schemes (ContainerName).
/// </summary>
public class ValidationException : Exception
{
    public string ParamName { get; private set; }
    public string ContainerName { get; private set; }
    public string Message { get; private set; }

	public ValidationException(string message, string paramName, string containerName)
	{
        ParamName = paramName;
        ContainerName = containerName;
        Message = message;
	}

    public ValidationException(string message, string paramName)
	{
        ParamName = paramName;
        Message = message;
	}

    public ValidationException(string message)
	{
        ParamName = "";
        Message = message;
	}
}