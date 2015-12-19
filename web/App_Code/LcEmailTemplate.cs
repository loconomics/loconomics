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

        public static IEnumerable<ServicePricing> GetForPricingSummary(LcRest.PricingSummary pricingSummary)
        {
            if (pricingSummary.details != null && pricingSummary.details.Count() > 0)
            {
                var services = LcRest.ServiceProfessionalService.GetFromPricingSummary(pricingSummary.pricingSummaryID, pricingSummary.pricingSummaryRevision);

                if (services != null)
                {
                    // Mix booking pricing details and service details in a list, by the common serviceProfessionaServiceID
                    // so is easiest from templates to access all that info while we keep in one database call
                    // the query for all the pricing details (rather than one call per each).
                    foreach (var service in services)
                    {
                        var pricingDetail = pricingSummary.details.First(pd => pd.serviceProfessionalServiceID == service.serviceProfessionalServiceID);
                        yield return new ServicePricing
                        {
                            service = service,
                            pricing = pricingDetail
                        };
                    }
                }
            }
        }
    }

    public class BookingEmailInfo
    {
        public LcRest.Booking booking;
        //public List<ServicePricing> servicePricing;
        /// <summary>
        /// Making publicly available an internal property of booking.
        /// </summary>
        public LcRest.PublicUserJobTitle userJobTitle;
        public LcRest.CancellationPolicy cancellationPolicy;

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
        /// Gets the limit date-time to allow a cancellation for current booking,
        /// and different rules to get money refunded depending
        /// on the policy and that date.
        /// </summary>
        public DateTime cancellationLimitDate
        {
            get
            {
                // Default base date is an example with plus 7 days from now.
                var baseDate = DateTime.Now.AddDays(7);

                if (booking.serviceDate != null)
                {
                    baseDate = booking.serviceDate.startTime;
                }

                return baseDate.AddHours(0 - cancellationPolicy.hoursRequired);
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

        #region URLs
        public static string GetBookingUrl(int bookingID)
        {
            return LcUrl.AppUrl + "/appointment/" + bookingID.ToString();
        }
        /// <summary>
        /// URL: Opens a view in the website where the user can see the email content
        /// </summary>
        public string viewEmailUrl
        {
            get
            {
                return LcUrl.LangUrl + "/inbox/booking/" + booking.bookingID;
            }
        }
        /// <summary>
        /// URL: Opens the booking process that a client sees to make a new booking with the Service Professional.
        /// </summary>
        public string newServiceProfessionalBooking
        {
            get
            {
                return LcUrl.AppUrl + "/booking/" + booking.serviceProfessionalUserID.ToString() + "/" + booking.jobTitleID.ToString();
            }
        }
        /// <summary>
        /// URL: Opens "talk to us" that a client sees.
        /// </summary>
        public string viewClientHelpCenter
        {
            get
            {
                return LcUrl.AppUrl + "/feedback";
            }
        }
        /// <summary>
        /// URL: Opens the booking card that the client sees.
        /// </summary>
        public string viewClientBookingCard
        {
            get
            {
                return GetBookingUrl(booking.bookingID);
            }
        }
        /// <summary>
        /// URL: Opens the Terms page.
        /// </summary>
        public string viewTermsOfService
        {
            get
            {
                return LcUrl.AppUrl + "/terms/terms-of-service";
            }
        }
        /// <summary>
        /// URL: Opens the Privacy Policy page.
        /// </summary>
        public string viewPrivacyPolicy
        {
            get
            {
                return LcUrl.AppUrl + "/terms/privacy-policy";
            }
        }
        /// <summary>
        /// URL: Opens the review page that the client sees to review the Service Professional.
        /// </summary>
        public string viewServiceProfessionalReviewForm
        {
            get
            {
                return LcUrl.AppUrl + "/reviews/" + booking.bookingID.ToString();
            }
        }
        /// <summary>
        /// URL: Client view of the Service Professional profile.
        /// </summary>
        public string viewServiceProfessionalProfile
        {
            get
            {
                return serviceProfessional.serviceProfessionalProfileUrl;
            }
        }
        /// <summary>
        /// URL: Opens the booking process that a Service Professional sees to make a new booking with the client.
        /// </summary>
        public string newClientBooking
        {
            get
            {
                return LcUrl.AppUrl + "/appointment/?clientID=" + booking.clientUserID.ToString();
            }
        }
        /// <summary>
        /// URL: Opens "talk to us" that a Service Professional sees.
        /// </summary>
        public string viewServiceProfessionalHelpCenter
        {
            get
            {
                return LcUrl.AppUrl + "/feedback";
            }
        }
        /// <summary>
        /// URL: Opens the booking card that the Service Professional sees.
        /// </summary>
        public string viewServiceProfessionalBookingCard
        {
            get
            {
                return GetBookingUrl(booking.bookingID);
            }
        }
        /// <summary>
        /// URL: Opens the review page that the Service Professional sees to review the Client Professional.
        /// </summary>
        public string viewClientReviewForm
        {
            get
            {
                return LcUrl.AppUrl + "/reviews/" + booking.bookingID.ToString();
            }
        }
        /// <summary>
        /// URL: Service Professional view of the Client profile.
        /// </summary>
        public string viewClientProfile
        {
            get
            {
                return LcUrl.AppUrl + "/profile/" + booking.clientUserID.ToString();
            }
        }
        #endregion
    }

    public static BookingEmailInfo GetBookingInfo(IDictionary<object, dynamic> PageData)
    {
        if (PageData[0] is BookingEmailInfo) return (BookingEmailInfo)PageData[0];
        if (PageData["BookingEmailInfo"] is BookingEmailInfo) return (BookingEmailInfo)PageData["BookingEmailInfo"];
        throw new Exception("Booking info not found at Email component");
    }

    public static BookingEmailInfo GetBookingInfo()
    {
        return GetBookingInfo(Request["bookingID"].AsInt());
    }

    public static BookingEmailInfo GetBookingInfo(int bookingID)
    {
        var bID = bookingID;

        var b = LcRest.Booking.Get(bID, true);
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

        // Cancellation policy
        var policy = LcRest.CancellationPolicy.Get(b.cancellationPolicyID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

        return new BookingEmailInfo
        {
            booking = b,
            //servicePricing = GetForPricingSummary(b.pricingSummary),
            userJobTitle = b.userJobTitle,
            cancellationPolicy = policy
            //,SentTo = sentTo
            //,SentToUserID = toUserID
        };
    }

    public static string GetLocationForGoogleMaps(LcRest.Address address)
    {
        return ASP.LcHelpers.JoinNotEmptyStrings(", ", address.addressLine1, address.city, address.stateProvinceCode, address.countryCode);
    }

    public static string GetLocationGoogleMapsUrl(LcRest.Address address)
    {
        return "http://maps.google.com/?q=" + Uri.EscapeDataString(GetLocationForGoogleMaps(address));
    }
}