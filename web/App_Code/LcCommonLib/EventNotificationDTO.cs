using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace LcCommonLib
{
    public class EventNotificationDTO: AckDTOResponse
    {
        public List<string> DistributionList { get; set; }
        public string Subject { get; set; }
        public string Summary { get; set; }
        public string Location { get; set; }
        public string organizerName { get; set; }
        public string OrganizerEmail { get; set; }
        public string FromName { get; set; }
        public string FromEmail { get; set; }

        public EventNotificationDTO() { } //default constructor

        public EventNotificationDTO(AckDTOResponse response)
        {
            this.CustomerEmail = response.CustomerEmail;
            this.CustomerName = response.CustomerName;
            this.JobDetails = response.JobDetails;
            this.ProviderEmail = response.ProviderEmail;
            this.ProviderName = response.ProviderName;
            this.ServiceDuration = response.ServiceDuration;
            this.ServiceStartDate = response.ServiceStartDate;
            this.SrId = response.SrId;
            this.WfId = response.WfId;
            this.CultureString = response.CultureString;
            this.DistributionList = new List<string>();
            this.DistributionList.Add(this.ProviderEmail);
        }
    }
}
