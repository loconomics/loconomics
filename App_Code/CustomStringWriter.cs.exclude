using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcCommonLib
{
/// <summary>
/// Summary description for StringWriter
/// </summary>
public static class CustomStringWriter
{
    private static string reader(string Key, string Default)
    {
        string returnvalue = string.Empty;

        //to change overall functionality change implementation in this method
        //This could be where we hook into the CMS system

        //temporary implemtation
        returnvalue = Utility.ConfigGet(Key, Default, true, null);       

        return returnvalue;
    }
     
    public static string schedulemanager_cancelLink
    {
        get { return reader("schedulemanager_cancelLink", "http://loconomics.com/schedulemanager.cshtml?pt={0}&wkid={1}"); } 
    }

    public static string schedulemanager_acceptLink
    {
        get { return reader("schedulemanager_acceptLink", "http://loconomics.com/schedulemanager.cshtml?pt={0}&wkid={1}&sr={2}"); } 
    }

    public static string Provider_Email_Header_line1
    {
        get { return reader("Provider_Email_Header_line1", "Congratulations!"); } 
    }

    public static string Provider_Email_Header_line2
    {
        get { return reader("Provider_Email_Header_line2", "A customer has selected you as a service provider they would like to work with. Please select one of the links below to indicate your preference: "); }
    }

    public static string Provider_Email_Footer_Line1
    {
        get { return reader("Provider_Email_Footer_Line1", "Thank you for being a part of the Loconomics community"); }
    }

    public static string Provider_Email_Footer_Line2
    {
        get { return reader("Provider_Email_Footer_Line2", "And good luck!"); }
    }

    public static string Loconomics_Trademark
    {
        get { return reader("Loconomics_Trademark", "@tm Loconomics.com 2012 all rights reserved."); }
    }

    public static string Provider_Email_Subject
    {
        get { return reader("Provider_Email_Subject", "New Job Posting From Loconomics.com"); } 
    }

    public static string Provider_Email_From
    {
        get { return reader("Provider_Email_From", "Jobs@Loconomics.com"); } 
    }

    public static string Provider_Email_From_Discription
    {
        get { return reader("Provider_Email_From_Discription", "Loconomics Job Request"); } 
    }

    public static string Provider_Email_Organizer
    {
        get { return reader("Provider_Email_Organizer", "Loconomics.com"); }
    }

    public static string Cancel_Link_Text
    {
        get { return reader("Cancel_Link_Text", "Decline: I am unable to perform this task at any of the above Date/Times specified"); }
    }

    public static string Primary_Link_Text
    {
        get { return reader("Primary_Link_Text", "Customer preferred: {0}"); }
    }

    public static string Alternate1_Link_Text
    {
        get { return reader("Alternate1_Link_Text", "Second choice: {0}"); }
    }

    public static string Alternate2_Link_Text
    {
        get { return reader("Alternate2_Link_Text", "Third choice: {0}"); }
    }

    public static string Provider_Email_Greeting
    {
        get { return reader("Provider_Email_Greeting", "{0},"); }
    }

    public static string Ack_Invite_Detail_Line1
    {
        get { return reader("Ack_Invite_Detail_Line1", "Customer Name: {0}"); }
    }

    public static string Ack_Invite_Detail_Line2
    {
        get { return reader("Ack_Invite_Detail_Line2", "Customer Email: {0}"); }
    }

    public static string Ack_Invite_Detail_Line3
    {
        get { return reader("Ack_Invite_Detail_Line3", "Service Scheduled Date/Time: {0}"); }
    }

    public static string Ack_Invite_Detail_Line4
    {
        get { return reader("Ack_Invite_Detail_Line4", "Service Duration Estimation (minutes): {0}"); }
    }

    public static string Ack_Invite_Detail_Line5
    {
        get { return reader("Ack_Invite_Detail_Line1", "Service Details Follow:"); }
    }

  

}

}