using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;

/// <summary>
/// Utilities for use when building email templates.
/// </summary>
public static class LcEmailTemplate
{
    private static HttpRequest Request
    {
        get
        {
            return System.Web.HttpContext.Current.Request;
        }
    }

    public class ServicePricing
    {
        public LcRest.ServiceProfessionalService service;
        public LcRest.PricingSummaryDetail pricing;

        public ServicePricing() { }
    }

    public class BookingEmailInfo
    {
        public LcRest.Booking booking;
        public List<ServicePricing> servicePricing;
        /// <summary>
        /// Making publicly available an internal property of booking.
        /// </summary>
        public LcRest.PublicUserJobTitle userJobTitle;

        private LcRest.PublicUserProfile _serviceProfessional;
        public LcRest.PublicUserProfile serviceProfessional
        {
            get
            {
                if (_serviceProfessional == null)
                    _serviceProfessional = LcRest.PublicUserProfile.Get(booking.serviceProfessionalUserID, booking.clientUserID);
                return _serviceProfessional;
            }
        }

        private LcRest.PublicUserProfile _client;
        public LcRest.PublicUserProfile client
        {
            get
            {
                if (_client == null)
                    _client = LcRest.PublicUserProfile.Get(booking.clientUserID, booking.serviceProfessionalUserID);
                return _client;
            }
        }

        /// <summary>
        /// Let's know if current booking is in request status.
        /// This is a very used check.
        /// </summary>
        public bool isBookingRequest
        {
            get
            {
                return booking.bookingStatusID == (int)LcEnum.BookingStatus.request;
            }
        }

        /// <summary>
        /// TODO Internal generated URL may need to be updated
        /// </summary>
        public string viewEmailUrl
        {
            get
            {
                return LcUrl.LangUrl + LcData.Booking.GetUrlPathForBooking(booking.bookingID);
            }
        }
    }

    public static BookingEmailInfo GetBookingInfo(IDictionary<object, dynamic> PageData)
    {
        if (PageData[0] is BookingEmailInfo) return (BookingEmailInfo)PageData[0];
        if (PageData["BookingEmailInfo"] is BookingEmailInfo) return (BookingEmailInfo)PageData["BookingEmailInfo"];
        throw new Exception("Booking info not found at Email component");
    }

    public static BookingEmailInfo GetBookingInfo()
    {
        var bID = Request["BookingID"].AsInt();

        var b = LcRest.Booking.Get(bID, false);
        if (b == null) throw new Exception("BookingID not found #" + bID + ", at Email template");

        /* Generics not used in new email template organization, but keep this commented
         * for any future chance:
        var url = Request.Url.OriginalString.ToUpper();
        var sentTo = LcData.UserInfo.UserType.None;
        if (url.IndexOf("/TOCLIENT/") > -1) {
            sentTo = LcData.UserInfo.UserType.Client;
        }
        else if (url.IndexOf("/TOSERVICEPROFESSIONAL/") > -1) {
            sentTo = LcData.UserInfo.UserType.ServiceProfessional;
        }
        int toUserID = 0;
        if (sentTo == LcData.UserInfo.UserType.ServiceProfessional) {
            toUserID = b.serviceProfessionalUserID;
        }
        else if (sentTo == LcData.UserInfo.UserType.Client) {
            toUserID = b.clientUserID;
        }
        */

        b.FillLinks();

        // The service details from database
        var servicePricing = new List<ServicePricing>();
        if (b.pricingSummary.details != null && b.pricingSummary.details.Count() > 0)
        {
            var services = LcRest.ServiceProfessionalService.GetFromPricingSummary(b.pricingSummaryID, b.pricingSummaryRevision);

            if (services != null)
            {
                // Mix booking pricing details and service details in a list, by the common serviceProfessionaServiceID
                // so is easiest from templates to access all that info while we keep in one database call
                // the query for all the pricing details (rather than one call per each).
                foreach (var service in services)
                {
                    var pricingDetail = b.pricingSummary.details.First(pd => pd.serviceProfessionalServiceID == service.serviceProfessionalServiceID);

                    servicePricing.Add(new ServicePricing
                    {
                        service = service,
                        pricing = pricingDetail
                    });
                }
            }
        }

        return new BookingEmailInfo
        {
            booking = b,
            servicePricing = servicePricing,
            userJobTitle = b.userJobTitle
            //,SentTo = sentTo
            //,SentToUserID = toUserID
        };
    }
}