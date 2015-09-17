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

    public class BookingEmailInfo
    {
        public LcRest.Booking booking;
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

        return new BookingEmailInfo
        {
            booking = b,
            userJobTitle = b.userJobTitle
            //,SentTo = sentTo
            //,SentToUserID = toUserID
        };
    }
}