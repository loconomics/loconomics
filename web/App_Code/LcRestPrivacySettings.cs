using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// User privacy settings from a subset of [users] table
/// for the REST API, and static methods for database
/// operations
/// </summary>
public class LcRestPrivacySettings
{
    #region Fields
    public int userID;

    public bool smsBookingCommunication;
    public bool phoneBookingCommunication;
    public bool loconomicsCommunityCommunication;
    public bool loconomicsDbmCampaigns;

    public bool profileSeoPermission;
    public bool loconomicsMarketingCampaigns;
    public bool coBrandedPartnerPermissions;

    public DateTime createdDate;
    public DateTime updatedDate;
    #endregion

    public static LcRestPrivacySettings FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestPrivacySettings {
            userID = record.userID,

            smsBookingCommunication = record.smsBookingCommunication,
            phoneBookingCommunication = record.phoneBookingCommunication,
            loconomicsCommunityCommunication = record.loconomicsCommunityCommunication,
            loconomicsDbmCampaigns = record.loconomicsDbmCampaigns,

            profileSeoPermission = record.profileSeoPermission,
            loconomicsMarketingCampaigns = record.loconomicsMarketingCampaigns,
            coBrandedPartnerPermissions = record.coBrandedPartnerPermissions,

            createdDate = record.createdDate,
            updatedDate = record.updatedDate
        };
    }

    #region SQL
    private const string sqlSelect = @"
        SELECT TOP 1
            -- ID
            Users.userID

            -- User preferences
            ,smsBookingCommunication
            ,phoneBookingCommunication
            ,loconomicsCommunityCommunication
            ,loconomicsDbmCampaigns

            -- Freelancer only
            ,profileSeoPermission
            ,loconomicsMarketingCampaigns
            ,coBrandedPartnerPermissions

            ,createdDate
            ,updatedDate

        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
        WHERE Users.UserID = @0
            AND Active = 1
    ";

    private const string sqlUpdate = @"
        DECLARE 
        @UserID int
        ,@smsBookingCommunication varchar(50)
        ,@phoneBookingCommunication varchar(145)
        ,@loconomicsCommunityCommunication varchar(145)
        ,@loconomicsDbmCampaigns nvarchar(56)

        ,@profileSeoPermission varchar(20)
        ,@loconomicsMarketingCampaigns bit
        ,@coBrandedPartnerPermissions int

        SET @userID = @0
        SET @smsBookingCommunication = @1
        SET @phoneBookingCommunication = @2
        SET @loconomicsCommunityCommunication = @3
        SET @loconomicsDbmCampaigns = @4
        SET @profileSeoPermission = @5
        SET @loconomicsMarketingCampaigns = @6
        SET @coBrandedPartnerPermissions = @7

        UPDATE	Users
        SET     smsBookingCommunication = @smsBookingCommunication
		        ,phoneBookingCommunication = @phoneBookingCommunication
		        ,loconomicsCommunityCommunication = @loconomicsCommunityCommunication
                ,loconomicsDbmCampaigns = @loconomicsDbmCampaigns		    
    
                ,profileSeoPermission = @profileSeoPermission
                ,loconomicsMarketingCampaigns = @loconomicsMarketingCampaigns
                ,coBrandedPartnerPermissions = @coBrandedPartnerPermissions

                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
        WHERE   UserId = @UserID
    ";
    #endregion

    #region Fetch
    public static LcRestPrivacySettings GetPrivacySettings(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return FromDB(db.QuerySingle(sqlSelect, userID));
        }
    }
    #endregion

    #region Create/Update
    public static void UpdatePrivacySettings(LcRestPrivacySettings profile)
    {
        using (var db = Database.Open("sqlloco")) {

            db.Execute(sqlUpdate,
                profile.userID,
                profile.smsBookingCommunication,
                profile.phoneBookingCommunication,
                profile.loconomicsCommunityCommunication,
                profile.loconomicsDbmCampaigns,
                profile.profileSeoPermission,
                profile.loconomicsMarketingCampaigns,
                profile.coBrandedPartnerPermissions
            );
        }
    }
    #endregion

}