using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcCommonLib
{
    public enum ACKProcessTypeId
    {
        Accepted = 8
      , Canceled = 5
      , Expired = 6
      , Invalid = 0
    }

    /// <summary>
    /// Summary description for AckDTO
    /// </summary>
    public class AckDTO
    {        
        public string SrId {get; set;}
        public ACKProcessTypeId Status { get; set; }
        public int UserId {get; set;}
        public string WfId {get; set;}
        public bool Cancelled { get; set; }
    }


    /*
     * SELECT	ServiceStartDate,
				ServiceDuration,
				JobDetails,
				customer.Email as CustomerEmail,
				u.FirstName + '  ' + u.LastName as CustomerName,
				provider.Email as ProviderEmail,
				up.FirstName + '  ' + up.LastName as ProviderName
    */
    public class AckDTOResponse
    {
        public DateTime ServiceStartDate { get; set; }
        public int ServiceDuration { get; set; }
        public string JobDetails { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerName { get; set; }
        public string ProviderEmail { get; set; }
        public string ProviderName { get; set; }
        public string SrId { get; set; }
        public string WfId { get; set; }
        public string Location { get; set; }
        public string CultureString { get; set; }
    }
}