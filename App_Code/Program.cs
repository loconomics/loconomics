using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace LcCommonLib
{
    class Program
    {
        static int PROVIDER_USERID = 74;
        static int CUSTOMER_USERID = 75;
        static int POSITION_ID = 14;

        static void Main(string[] args)
        {
           

            try
            {
                List<string> AckPaths = SeviceRequestMgr_Test();
                foreach (string AckPath in AckPaths)
                {
                    Console.WriteLine(AckPath);
                }

                Console.WriteLine("Testing Select Ack [2] ");
                Uri baseUri = new Uri("http://localhost/");
                Uri myUri = new Uri(baseUri, AckPaths[0]);
                string QueryString = myUri.Query; // ?pt={0}&wfid={1}&srid={2}
                QueryString = QueryString.Substring(1); //removes "?"
                
                Console.WriteLine(Ack_Test(QueryString));


            }
            catch(System.Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }


            Console.ReadKey();
        }

        public static List<string> SeviceRequestMgr_Test()
        {
            ServiceDTO svcDTO = new ServiceDTO();
            //EXEC 	dbo.CreateService 14,'2012-03-22T08:00:00',20,'2012-03-22T12:30:00',20,'2012-03-24T15:45:00',20,'test','asdfasd',2,2
            svcDTO.UserID = PROVIDER_USERID;
            svcDTO.ServiceStartDate = DateTime.Parse("2012-03-22T08:00:00");
            svcDTO.ServiceDuration = 180;
            svcDTO.ServiceStartDateAlt1 = DateTime.Parse("2012-03-22T12:30:00");
            svcDTO.ServiceDurationAlt1 = 180;
            svcDTO.ServiceStartDateAlt2 = DateTime.Parse("2012-03-24T15:00:00");
            svcDTO.ServiceDurationAlt2 = 180;
            svcDTO.JobDetails = "From local web";
            svcDTO.WorkflowID = Guid.NewGuid().ToString();
            svcDTO.PositionID = POSITION_ID;
            svcDTO.CustomerUserID = CUSTOMER_USERID;

            //SeviceRequestMgr svcMgr = new SeviceRequestMgr();
            ServiceRequestMgr sm = new ServiceRequestMgr();
            return sm.Execute(svcDTO);
        }

        public static string Ack_Test(string QueryString)
        {
            string[] parts = QueryString.Split('&');

            string pt = string.Empty;
            string wfid = string.Empty;
            string srid = string.Empty;
            foreach (string part in parts)
            {
                string[] nvp = part.Split('=');
                switch (nvp[0])
                {
                    case "pt": { pt = nvp[1]; } break;
                    case "wkid": { wfid = nvp[1]; } break;
                    case "sr": { srid = nvp[1]; } break;
                }
            }

            AckDTO data = new AckDTO();
            data.SrId = srid;
            data.Status = ACKProcessTypeId.Accepted;
            data.UserId = PROVIDER_USERID;   // -- Logged in Provider
            data.WfId = wfid;
            data.Cancelled = false;
            ServiceRequestMgr sm = new ServiceRequestMgr("en-US");
            return sm.Execute(data);

        }
    }
}
