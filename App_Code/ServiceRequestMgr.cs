using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using WebMatrix.Data;
using System.Net.Mail;

namespace LcCommonLib
{
    public class ServiceRequestMgr
    {

        string commandText = string.Empty;
        string Culture = string.Empty;
        
        public static ACKProcessTypeId Validate(string ProcessType)
        {
            ACKProcessTypeId returnvalue = ACKProcessTypeId.Invalid;
            if ((ProcessType != null) && (ProcessType != string.Empty))
            {
                if ("0,5,6,8".IndexOf(ProcessType.Trim()) > -1)
                {
                    returnvalue = (ACKProcessTypeId)int.Parse(ProcessType.Trim());
                }
            }

            return returnvalue;
        }

       
        public ServiceRequestMgr()
        {
            //default constructor
        }

        public ServiceRequestMgr(string Culture)
        {
            this.Culture = Culture;
        }   

        public string Execute(AckDTO ack)
        {
            string returnvalue = string.Empty;
            var db = Database.Open("sqlloco");
            commandText = "EXEC dbo.UpdateServiceAcknowledgement @0,@1,@2,@3,@4";
            IEnumerable<dynamic> result = db.Query(commandText, ack.SrId, ack.Status, ack.UserId, ack.WfId, System.Convert.ToInt32(ack.Cancelled));

            if (ack.Status == ACKProcessTypeId.Accepted)
            {
                //result will contain info for Meeting Request
                ///TODO Create code to send notification here
                ///(1) loop over results to parse relevant data to build mail message parts
                ///(2) Send notification
                //string note = "to be implemented.";

                List<AckDTOResponse> AckDtos = new List<AckDTOResponse>();
                AckDTOResponse AckDto = null;
                int count = 0;
                foreach (var record in result)
                {
                    if (count < 1)
                    {
                        /*
                         * SELECT	ServiceStartDate,
				                    ServiceDuration,
				                    JobDetails,
				                    customer.Email as CustomerEmail,
				                    u.FirstName + '  ' + u.LastName as CustomerName,
				                    provider.Email as ProviderEmail,
				                    up.FirstName + '  ' + up.LastName as ProviderName
                        */
                        AckDto = new AckDTOResponse();
                        AckDto.ServiceStartDate = record.ServiceStartDate;
                        AckDto.ServiceDuration = record.ServiceDuration;
                        AckDto.JobDetails = record.JobDetails;
                        AckDto.CustomerEmail = record.CustomerEmail;
                        AckDto.CustomerName = record.CustomerName;
                        AckDto.ProviderEmail = record.ProviderEmail;
                        AckDto.ProviderName = record.ProviderName;
                        AckDto.Location = String.Empty;  // record.Location;     //*****   not available yet
                        
                        //add workflowId and ServiceRequestId to the AckResponseDTO
                        AckDto.SrId = ack.SrId;
                        AckDto.WfId = ack.WfId;

                        //Add the culture string so it can be used in the Email
                        AckDto.CultureString = this.Culture;

                        AckDtos.Add(AckDto);
                    }
                }
            
                MailMessage ProviderMail = LcCommonLib.MailHelper.CreateServiceMeetingRequest(AckDtos.ToArray()[0], MailHelper.DefaultEmailTemplate());
                returnvalue = string.Format("Meeting request sent to {0}",ProviderMail.To[0].DisplayName);

                LcCommonLib.MailHelper.SendMailMessage(ProviderMail);
            }
            return returnvalue;
        }


        /*
            [CreateService]
            @SCPID int,                     
	        @ServiceStartDate datetime,
	        @ServiceDuration int,
	        @ServiceStartDateAlt1 datetime,
	        @ServiceDurationAlt1 int,
	        @ServiceStartDateAlt2 datetime,
	        @ServiceDurationAlt2 int,
	        @JobDetails varchar(250),
	        @WorkflowID varchar(28),
	        @UserID INT,                    <--- Assumption: this is the provider ID
	        @CustomerUserID INT
        */
        public List<string> Execute(ServiceDTO svc)
        {
            List<string> returnvalue = null;
            var db = Database.Open("sqlloco");
            var commandText = "EXEC dbo.CreateService @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10";
            IEnumerable<dynamic> result = db.Query( commandText
                                                  , svc.PositionID
                                                  , svc.ServiceStartDate
                                                  , svc.ServiceDuration
                                                  , svc.ServiceStartDateAlt1
                                                  , svc.ServiceDurationAlt1
                                                  , svc.ServiceStartDateAlt2
                                                  , svc.ServiceDurationAlt2
                                                  , svc.JobDetails
                                                  , svc.WorkflowID
                                                  , svc.UserID
                                                  , svc.CustomerUserID );

            List<ServiceResponseDTO> SrDtos = new List<ServiceResponseDTO>();
            ServiceResponseDTO srDto = null;
            int count = 0;
            foreach (var record in result)
            {
                if (count < 1)
                {
                    //map response DTO to procedure resultset
                    srDto = new ServiceResponseDTO();
                    srDto.ServiceRequestID = record.FirstChoiceSR;
                    srDto.Alternate1SrID = record.SecondChoiceSR;
                    srDto.Alternate2SrID = record.ThirdChoiceSR;
                    srDto.ServiceDuration = record.ServiceDuration;
                    srDto.ProviderName = record.ProviderName;
                    srDto.ProviderEMail = record.ProviderEmail;
                    srDto.CustomerArea = record.CustomerArea;

                    //add workflowId and starttime options from the requestDto so it can be used in the email
                    srDto.WorkflowId = svc.WorkflowID;
                    srDto.SrDateTime = svc.ServiceStartDate;
                    srDto.SrAlt1DateTime = svc.ServiceStartDateAlt1;
                    srDto.SrAlt2DateTime = svc.ServiceStartDateAlt2;

                    //srDto.PrefersHTMLEmail = svc.srDtoHTMLEmail  -- this field does not exist yet
                    srDto.PrefersHTMLEmail = true;

                    ///Todo - update population of the CultureString so that it is pulled from the site or the user preferences
                    
                    //Add the culture string so it can be used in the Email
                    srDto.CultureString = this.Culture;

                    SrDtos.Add(srDto);
                }
                count++;
            }
            MailMessageTemplate providerMailtemplate = MailHelper.DefaultEmailTemplate();
            MailMessage ProviderMail = LcCommonLib.MailHelper.CreateServiceRequestNotification(SrDtos.ToArray()[0], ref providerMailtemplate);
            returnvalue = providerMailtemplate.RelativeURIs;

            LcCommonLib.MailHelper.SendMailMessage(ProviderMail);

            return returnvalue;
        }

        //this will be implemented later
        public string Execute()
        {
            string returnvalue = "Not implemented.";// string.Empty;
            var db = Database.Open("sqlloco");
            commandText = "EXEC dbo.?? @0";
            //IEnumerable<dynamic> result = db.Query(commandText);

            return returnvalue;
        }

       
    }
}