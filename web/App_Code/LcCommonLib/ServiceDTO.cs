using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcCommonLib
{
    /// <summary>
    /// Summary description for ServiceDTO
    /*
    @PositionID int,
	@ServiceStartDate datetime,
	@ServiceDuration int,
	@ServiceStartDateAlt1 datetime,
	@ServiceDurationAlt1 int,
	@ServiceStartDateAlt2 datetime,
	@ServiceDurationAlt2 int,
	@JobDetails varchar(250),
	@WorkflowID varchar(28),
	@UserID INT,
	@CustomerUserID INT,
	@LanguageID INT = 1,
	@CountryID int = 1
    */
    /// </summary>
    public class ServiceDTO
    {
        
        public int PositionID { get; set;}
	    public DateTime ServiceStartDate  { get; set;}
	    public int ServiceDuration  { get; set;}
	    public DateTime ServiceStartDateAlt1  { get; set;}
	    public int ServiceDurationAlt1  { get; set;}
	    public DateTime ServiceStartDateAlt2  { get; set;}
	    public int ServiceDurationAlt2  { get; set;}
	    public string JobDetails { get; set;}
	    public string WorkflowID  { get; set;}
	    public int UserID  { get; set;}
	    public int CustomerUserID  { get; set;}
        
    }

    /// <summary>
    /// Summary description for ServiceResponseDTO
    /// 
    /// @PositionID int,
    /// 
    /*
	SELECT	ServiceStartDate,
			ServiceDuration,	
			u.FirstName + '  ' + u.LastName as CustomerName,
			upe.Email as ProviderEmail,
			up.FirstName + '  ' + up.LastName as ProviderName,
			@FirstChoiceSR as FirstChoiceSR,
			@SecondChoiceSR as SecondChoiceSR,
			@ThirdChoiceSR as ThirdChoiceSR
    */
    /// </summary>
    public class ServiceResponseDTO
    {
        public int ServiceRequestID { get; set; }
        public int Alternate1SrID { get; set; }
        public int Alternate2SrID { get; set; }
        public DateTime ServiceStartDate { get; set; }
        public int ServiceDuration { get; set; }
        public string ProviderName { get; set; }
        public string ProviderEMail { get; set; }
        public string CustomerArea { get; set; }
        public string WorkflowId { get; set; }
        public DateTime SrDateTime { get; set; }
        public DateTime SrAlt1DateTime { get; set; }
        public DateTime SrAlt2DateTime { get; set; }
        public string CultureString { get; set; }
        public bool PrefersHTMLEmail { get; set; }
    }
}