using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Manages records from ServiceProfessionalClient table.
/// Some direct queries and tasks are done from the Client class to.
/// Is not exposed directly in the REST API, but an internal utility
/// when managing user related clients, bookings, service-professionals.
/// </summary>
internal class ServiceProfessionalClient
{
    #region Fields
    public int serviceProfessionalUserID;
    public int clientUserID;
    public string notesAboutClient;
    public int referralSourceID;
    public int? createdByBookingID;
    #endregion

    #region Instances
    public ServiceProfessionalClient FromDB(dynamic record)
    {
        if (record == null) return null;
        return new ServiceProfessionalClient
        {
            serviceProfessionalUserID = record.serviceProfessionalUserID,
            clientUserID = record.clientUserID,
            notesAboutClient = record.notesAboutClient,
            referralSourceID = record.referralSourceID,
            createdByBookingID = record.createdByBookingID
        };
    }
    #endregion

    #region Get
    const string sqlGetItem = @"
        SELECT serviceProfessionalUserID, clientUserID,
            notesAboutClient,
            referralSourceID,
            createdByBookingID
        FROM ServiceProfessionalClient
        WHERE
            serviceProfessionalUserID = @0,
            clientUserID = @1
    ";
    public static ServiceProfessionalClient Get(int serviceProfessionalUserID, int clientUserID)
    {
        using (var db = new LcDatabase())
        {
            return FromDB(db.QuerySingle(sqlGetItem, serviceProfessionalUserID, clientUserID));
        }
    }
    #endregion

    #region Set
    public static void Set(ServiceProfessionalClient spc, Database sharedDb = null)
    {
        using (var db = new LcDatabase(sharedDb))
        {
            db.Execute(@"
                IF EXISTS (SELECT * FROM ServiceProfessionalClient WHERE ServiceProfessionalUserID = @0 AND ClientUserID = @1)
                    UPDATE ServiceProfessionalClient SET
                        -- Passing null, will keep current notes; to delete them, pass in an empty string
                        NotesAboutClient = coalesce(@2, NotesAboutClient),
                        UpdatedDate = getdate()
                        -- Other fields are not allowed to be updated
                    WHERE
                        ServiceProfessionalUserID = @0
                         AND ClientUserID = @1
                ELSE
                    INSERT INTO ServiceProfessionalClient (
                        ServiceProfessionalUserID,
                        ClientUserID,
                        NotesAboutClient,
                        ReferralSourceID,
                        CreatedByBookingID,
                        CreatedDate,
                        UpdatedDate,
                        Active
                    ) VALUES (
                        @0, @1,
                        coalesce(@2, ''),
                        @3,
                        @4,
                        getdate(),
                        getdate(),
                        1 -- Active
                    )
                ",
                spc.serviceProfessionalUserID,
                spc.clientUserID,
                spc.notesAboutClient,
                spc.referralSourceID,
                spc.createdByBookingID
            );
        }
    }
    #endregion

    #region Delete
    /// <summary>
    /// Just remove relationship between professional and client.
    /// Will work only if there is no bookings that related both users, unless 'declined', 'expired' ones. 
    /// </summary>
    /// <param name="spc"></param>
    /// <param name="sharedDb"></param>
    public static void Delete(ServiceProfessionalClient spc, Database sharedDb = null)
    {
        Delete(spc.serviceProfessionalUserID, spc.clientUserID, sharedDb);
    }
    /// <summary>
    /// Just remove relationship between professional and client.
    /// Will work only if there is no bookings that related both users, unless 'declined', 'expired' ones. 
    /// </summary>
    /// <param name="serviceProfessionalUserID"></param>
    /// <param name="clientUserID"></param>
    /// <param name="sharedDb"></param>
    public static void Delete(int serviceProfessionalUserID, int clientUserID, Database sharedDb = null)
    {
        using (var db = new LcDatabase(sharedDb))
        {
            db.Execute(@"
                -- Allow If there is no bookings (discarding Denied:4 and Expired:5)
                IF NOT EXISTS (SELECT * FROM Booking WHERE serviceProfessionalUserID = @0 AND clientUserID = @1 AND BookingStatusID NOT IN (4, 5))
                BEGIN
                    DELETE FROM ServiceProfessionalClient
                    WHERE ServiceProfessionalUserID = @0
                        AND ClientUserID = @1
                END
            ", serviceProfessionalUserID, clientUserID);
        }
    }
    /// <summary>
    /// Request to delete the relationship if was generated by a booking.
    /// This is the way to cancel a relationship generated by a booking after the booking is declined.
    /// Thanks to this constraint, a record created by the service-professional from the Client API is never removed, even
    /// if there are no active bookings.
    /// MUST BE EXECUTED after effectively decline the booking, or the 'active booking' check will prevent the deletion.
    /// IMPORTANT: the identity of the booking is not checked, because is not needed. In other words, we don't
    /// delete the record only if record was created by and deletion requested by, the same bookingID, because overlapped
    /// bookings can happen, like bookingID 1 created the relationship, bookingID 2 re-enforced it, and cancelling 
    /// bookingID 1 will not delete the record (because it's connected to another 'active' booking), and then cancelling
    /// the bookingID 2 needs to be able to delete the record (since is not connected to 'active' bookings) even if
    /// was created by bookingID 1. It's clear?
    /// </summary>
    /// <param name="serviceProfessionalUserID"></param>
    /// <param name="clientUserID"></param>
    /// <param name="sharedDb"></param>
    public static void CancelFromBooking(int serviceProfessionalUserID, int clientUserID, Database sharedDb = null)
    {
        var spc = Get(serviceProfessionalUserID, clientUserID);
        if (spc.createdByBookingID.HasValue)
        {
            // Can be deleted, since was created by a booking
            // bug still 'Delete' will enforce that there are not other active bookings linked
            Delete(serviceProfessionalUserID, clientUserID, sharedDb);
        }
    }
    #endregion
}